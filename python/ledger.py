import json
import sqlite3
import sys
import uuid
from datetime import datetime
from db import get_connection

def get_ledger_view(account_code: str = "ALL"):
    conn = get_connection()
    c = conn.cursor()

    query = """
        SELECT jel.*, je.entry_number, je.date, je.description as je_desc, je.status as je_status
        FROM journal_entry_lines jel
        JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE 1=1
    """
    params = []
    if account_code and account_code != "ALL":
        query += " AND jel.account_code = ?"
        params.append(account_code)
    query += " ORDER BY je.date DESC, jel.id DESC"

    c.execute(query, params)
    lines_raw = c.fetchall()

    lines = []
    total_debits = 0.0
    total_credits = 0.0

    for r in lines_raw:
        deb = float(r["debit"] or 0)
        cred = float(r["credit"] or 0)
        total_debits += deb
        total_credits += cred
        lines.append({
            "id": r["id"],
            "journalEntryId": r["journal_entry_id"],
            "accountId": r["account_id"],
            "accountCode": r["account_code"],
            "accountName": r["account_name"],
            "entryNumber": r["entry_number"],
            "date": r["date"],
            "description": r["description"] or r["je_desc"],
            "debit": deb,
            "credit": cred
        })

    c.execute("SELECT * FROM journal_entries ORDER BY date DESC")
    entries_raw = c.fetchall()
    entries = []
    for e in entries_raw:
        entries.append({
            "id": e["id"],
            "entryNumber": e["entry_number"],
            "date": e["date"],
            "description": e["description"],
            "status": e["status"],
            "sourceType": e["source_type"],
            "sourceId": e["source_id"],
            "totalDebit": float(e["total_debit"] or 0),
            "totalCredit": float(e["total_credit"] or 0),
            "isBalanced": bool(e["is_balanced"]),
            "createdBy": e["created_by"],
            "approvedBy": e["approved_by"]
        })

    # Fetch accounts list with updated balances
    c.execute("SELECT * FROM accounts ORDER BY code ASC")
    accounts = []
    for acc in c.fetchall():
        accounts.append({
            "id": acc["id"],
            "code": acc["code"],
            "name": acc["name"],
            "type": acc["type"],
            "balance": float(acc["balance"] or 0),
            "currency": acc["currency"] or "INR",
            "description": acc["description"]
        })

    conn.close()

    is_balanced = (round(total_debits, 2) == round(total_credits, 2)) if account_code == "ALL" else True

    return {
        "accountCode": account_code or "ALL",
        "accounts": accounts,
        "lines": lines,
        "journalEntries": entries,
        "totalDebits": round(total_debits, 2),
        "totalCredits": round(total_credits, 2),
        "netBalance": round(total_debits - total_credits, 2),
        "isBalanced": is_balanced
    }

def apply_journal_entry_lines_to_accounts(cursor, lines):
    """
    Applies debit/credit legs to chart of accounts according to normal balance rules:
    - ASSET & EXPENSE: Normal debit (debit increases balance, credit decreases balance)
    - LIABILITY, EQUITY & REVENUE: Normal credit (credit increases balance, debit decreases balance)
    """
    for l in lines:
        acc_code = str(l.get("accountCode") or l.get("code") or l.get("account_code") or "")
        deb = abs(float(l.get("debit") or 0))
        cred = abs(float(l.get("credit") or 0))
        cursor.execute("SELECT type FROM accounts WHERE code = ?", (acc_code,))
        acc_row = cursor.fetchone()
        acc_type = acc_row["type"] if acc_row else "EXPENSE"

        if acc_type in ("ASSET", "EXPENSE"):
            balance_delta = deb - cred
        else:
            balance_delta = cred - deb

        cursor.execute("UPDATE accounts SET balance = balance + ? WHERE code = ?", (balance_delta, acc_code))

def post_journal_entry(date: str, description: str, lines: list, created_by: str = "Madhavan", source_type: str = "MANUAL", source_id: str = None, external_conn=None):
    if not lines or len(lines) < 2:
        return {"error": "A double-entry journal entry requires at least two lines."}

    total_debit = 0.0
    total_credit = 0.0

    for line in lines:
        deb = abs(float(line.get("debit") or 0))
        cred = abs(float(line.get("credit") or 0))
        total_debit += deb
        total_credit += cred

    # Strict Accounting Invariant Check: SUM(DR) == SUM(CR)
    diff = abs(total_debit - total_credit)
    if diff > 0.01:
        return {
            "error": f"Unbalanced Journal Entry! Total Debit (₹{total_debit:,.2f}) must equal Total Credit (₹{total_credit:,.2f}). Difference: ₹{diff:,.2f}"
        }

    close_conn = False
    if external_conn:
        conn = external_conn
    else:
        conn = get_connection()
        close_conn = True

    c = conn.cursor()

    ts = f"{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:6]}"
    je_id = f"je-py-{ts}"
    c.execute("SELECT COUNT(*) FROM journal_entries")
    je_count = c.fetchone()[0] + 10050
    entry_number = f"JE-{je_count}"

    c.execute("""
    INSERT INTO journal_entries (
        id, organization_id, entry_number, date, description, status, source_type, source_id,
        total_debit, total_credit, is_balanced, created_by, approved_by
    ) VALUES (?, 'org-1', ?, ?, ?, 'POSTED', ?, ?, ?, ?, 1, ?, ?)
    """, (je_id, entry_number, date or datetime.now().strftime("%Y-%m-%d"), description, source_type, source_id, total_debit, total_credit, created_by, created_by))

    formatted_lines_for_balance = []
    for idx, l in enumerate(lines):
        acc_code = str(l.get("accountCode") or l.get("code") or l.get("account_code") or "")
        deb = abs(float(l.get("debit") or 0))
        cred = abs(float(l.get("credit") or 0))
        desc = l.get("description") or description

        # Look up account name
        c.execute("SELECT name, type FROM accounts WHERE code = ?", (acc_code,))
        acc_row = c.fetchone()
        acc_name = acc_row["name"] if acc_row else f"Account {acc_code}"

        jel_id = f"jel-py-{ts}-{idx}"
        c.execute("""
        INSERT INTO journal_entry_lines (
            id, journal_entry_id, account_id, account_code, account_name, debit, credit, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (jel_id, je_id, f"acc-{acc_code}", acc_code, acc_name, deb, cred, desc))

        formatted_lines_for_balance.append({
            "accountCode": acc_code,
            "debit": deb,
            "credit": cred
        })

    # Update account balances according to standard double-entry rules
    apply_journal_entry_lines_to_accounts(c, formatted_lines_for_balance)

    # Audit log
    c.execute("""
    INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
    VALUES (?, ?, 'CREATE_JOURNAL_ENTRY', 'JOURNAL_ENTRY', ?, ?)
    """, (f"al-py-{ts}", created_by, je_id, f"Created balanced entry {entry_number} for ₹{total_debit:,.2f} ({source_type})"))

    if close_conn:
        conn.commit()
        conn.close()

    return {
        "success": True,
        "entryNumber": entry_number,
        "journalEntryId": je_id,
        "message": f"Journal Entry {entry_number} posted and balanced successfully."
    }

def reverse_journal_entry(entry_id_or_number: str, reason: str = "Void / Correction", created_by: str = "Controller", external_conn=None):
    """
    Creates an offsetting Reversal Journal Entry that mirrors and inverts the original debit/credit legs,
    restoring general ledger account balances cleanly without destructive deletes.
    """
    close_conn = False
    if external_conn:
        conn = external_conn
    else:
        conn = get_connection()
        close_conn = True

    c = conn.cursor()
    c.execute("SELECT * FROM journal_entries WHERE id = ? OR entry_number = ?", (entry_id_or_number, entry_id_or_number))
    orig = c.fetchone()
    if not orig:
        if close_conn:
            conn.close()
        return {"error": f"Journal Entry {entry_id_or_number} not found for reversal"}

    if orig["status"] == "REVERSED":
        if close_conn:
            conn.close()
        return {"error": f"Journal Entry {orig['entry_number']} has already been reversed"}

    c.execute("SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?", (orig["id"],))
    orig_lines = c.fetchall()
    if not orig_lines:
        if close_conn:
            conn.close()
        return {"error": f"No journal entry lines found for {orig['entry_number']}"}

    reversal_lines = []
    for line in orig_lines:
        reversal_lines.append({
            "accountCode": line["account_code"],
            "debit": float(line["credit"] or 0), # Invert credit -> debit
            "credit": float(line["debit"] or 0), # Invert debit -> credit
            "description": f"REVERSAL: {line['description']}"
        })

    today = datetime.now().strftime("%Y-%m-%d")
    rev_result = post_journal_entry(
        date=today,
        description=f"Reversal of {orig['entry_number']}: {reason}",
        lines=reversal_lines,
        created_by=created_by,
        source_type="REVERSAL",
        source_id=orig["id"],
        external_conn=conn
    )

    if rev_result.get("success"):
        c.execute("UPDATE journal_entries SET status = 'REVERSED' WHERE id = ?", (orig["id"],))

    if close_conn:
        conn.commit()
        conn.close()

    return rev_result

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "post":
        data = json.loads(sys.stdin.read())
        res = post_journal_entry(data.get("date"), data.get("description"), data.get("lines"))
        print(json.dumps(res, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "reverse":
        target = sys.argv[2] if len(sys.argv) > 2 else ""
        res = reverse_journal_entry(target)
        print(json.dumps(res, indent=2))
    else:
        code = sys.argv[1] if len(sys.argv) > 1 else "ALL"
        ledger = get_ledger_view(code)
        print(json.dumps(ledger, indent=2))
