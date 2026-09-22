import json
import sys
import os
import uuid
from datetime import datetime

from db import init_db, get_connection
from analytics import calculate_dashboard_summary
from categorize import categorize_transaction
from reconcile import get_reconciliation_status, auto_match_all, confirm_match
from ledger import get_ledger_view, post_journal_entry, reverse_journal_entry
from realtime_feed import generate_live_transaction
from copilot import answer_financial_query, get_live_financial_context
from invoice_parser import parse_and_save_invoice
from financial_statements import get_income_statement, get_balance_sheet
from rules_engine import get_rules, create_rule, delete_rule, toggle_rule, simulate_rules, get_confidence_policies, update_confidence_policies, ensure_rules_tables
from anomalies import detect_anomalies
from currency import get_exchange_rates, calculate_fx_gain_loss
from dual_approval import process_maker_checker_approval, get_audit_timeline, ensure_audit_tables
from vendor_tax import get_vendor_intelligence, calculate_tds_breakdown, get_gst_itc_reconciliation, ensure_vendors_table

def get_transactions(status="ALL", tx_type="ALL", search=None):
    conn = get_connection()
    c = conn.cursor()
    sql = "SELECT * FROM transactions WHERE 1=1"
    params = []
    if status and status != "ALL":
        sql += " AND status = ?"
        params.append(status)
    if tx_type and tx_type != "ALL":
        sql += " AND type = ?"
        params.append(tx_type)
    if search and search != "NONE":
        sql += " AND (description LIKE ? OR vendor LIKE ? OR category LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
    sql += " ORDER BY date DESC, created_at DESC"
    c.execute(sql, params)
    rows = c.fetchall()

    results = []
    for r in rows:
        expl = json.loads(r["ai_explanation"]) if r["ai_explanation"] else []
        results.append({
            "id": r["id"],
            "organizationId": r["organization_id"],
            "date": r["date"],
            "description": r["description"],
            "rawText": r["raw_text"],
            "amount": float(r["amount"]),
            "currency": r["currency"],
            "type": r["type"],
            "status": r["status"],
            "vendor": r["vendor"],
            "customer": r["customer"],
            "category": r["category"],
            "glAccount": r["gl_account"],
            "glAccountName": r["category"],
            "confidence": float(r["confidence"] or 0.95),
            "aiExplanation": expl,
            "suggestedDebitAccount": r["suggested_debit_account"],
            "suggestedCreditAccount": r["suggested_credit_account"],
            "paymentMethod": r["payment_method"],
            "matchedInvoiceId": r["matched_invoice_id"],
            "journalEntryId": r["journal_entry_id"],
            "isAnomaly": bool(r["is_anomaly"]),
            "anomalyReason": r["anomaly_reason"],
            "approvedAt": r["approved_at"],
            "approvedBy": r["approved_by"]
        })
    conn.close()
    return results

def get_transaction_by_id(tx_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    r = c.fetchone()
    conn.close()
    if not r:
        return None
    expl = json.loads(r["ai_explanation"]) if r["ai_explanation"] else []
    return {
        "id": r["id"],
        "organizationId": r["organization_id"],
        "date": r["date"],
        "description": r["description"],
        "rawText": r["raw_text"],
        "amount": float(r["amount"]),
        "currency": r["currency"],
        "type": r["type"],
        "status": r["status"],
        "vendor": r["vendor"],
        "customer": r["customer"],
        "category": r["category"],
        "glAccount": r["gl_account"],
        "glAccountName": r["category"],
        "confidence": float(r["confidence"] or 0.95),
        "aiExplanation": expl,
        "suggestedDebitAccount": r["suggested_debit_account"],
        "suggestedDebitAccountName": "Cloud Infrastructure" if r["suggested_debit_account"] == "6100" else "Software & Subscriptions" if r["suggested_debit_account"] == "6200" else "Operating Expense",
        "suggestedCreditAccount": r["suggested_credit_account"],
        "suggestedCreditAccountName": "HDFC Bank Operating (1010)",
        "paymentMethod": r["payment_method"],
        "matchedInvoiceId": r["matched_invoice_id"],
        "journalEntryId": r["journal_entry_id"],
        "isAnomaly": bool(r["is_anomaly"]),
        "anomalyReason": r["anomaly_reason"],
        "approvedAt": r["approved_at"],
        "approvedBy": r["approved_by"]
    }

def approve_transaction(tx_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    tx = c.fetchone()
    if not tx:
        conn.close()
        return {"error": "Transaction not found"}

    # Strict idempotency check: prevent duplicate journal entry generation and duplicate balance inflation
    if tx["journal_entry_id"]:
        conn.close()
        return {
            "error": f"Transaction {tx_id} is already approved and posted to the General Ledger as {tx['journal_entry_id']}."
        }

    amount = float(tx["amount"])
    is_revenue = (str(tx["type"]).lower() == "revenue")

    if is_revenue:
        # For Revenue receipts: DR Bank Operating, CR Revenue
        deb_acc = tx["suggested_debit_account"] or "1010"
        cred_acc = tx["suggested_credit_account"] or tx["gl_account"] or "4000"
        deb_name = "HDFC Bank Operating"
        cred_name = tx["category"] or "SaaS Subscription Revenue"
        deb_desc = f"DR: Bank Deposit for {tx['description']}"
        cred_desc = f"CR: {tx['category'] or 'Revenue'}"
    else:
        # For Expenses: DR Expense Category, CR Bank Operating
        deb_acc = tx["suggested_debit_account"] or tx["gl_account"] or "6100"
        credit_acc_fallback = "1010"
        cred_acc = tx["suggested_credit_account"] or credit_acc_fallback
        deb_name = tx["category"] or "Expense"
        cred_name = "HDFC Bank Operating"
        deb_desc = f"DR: {tx['category'] or 'Expense'}"
        cred_desc = f"CR: Bank Settlement for {tx['description']}"

    posting_lines = [
        {
            "accountCode": deb_acc,
            "accountName": deb_name,
            "debit": amount,
            "credit": 0.0,
            "description": deb_desc
        },
        {
            "accountCode": cred_acc,
            "accountName": cred_name,
            "debit": 0.0,
            "credit": amount,
            "description": cred_desc
        }
    ]

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    je_res = post_journal_entry(
        date=tx["date"] or datetime.now().strftime("%Y-%m-%d"),
        description=f"Approved entry for {tx['description']}",
        lines=posting_lines,
        created_by="Madhavan",
        source_type="TRANSACTION",
        source_id=tx["id"],
        external_conn=conn
    )

    if "error" in je_res:
        conn.close()
        return je_res

    je_number = je_res["entryNumber"]
    c.execute("""
    UPDATE transactions 
    SET status = 'categorized', journal_entry_id = ?, approved_at = ?, approved_by = 'Madhavan'
    WHERE id = ?
    """, (je_number, now_str, tx_id))

    unique_suffix = f"{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:6]}"
    c.execute("""
    INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
    VALUES (?, 'Madhavan', 'APPROVE_TRANSACTION', 'TRANSACTION', ?, ?)
    """, (f"al-appr-{unique_suffix}", tx_id, f"Approved transaction and generated balanced Journal Entry {je_number}"))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "journalEntryId": je_number,
        "message": f"Transaction {tx_id} approved and balanced Journal Entry {je_number} posted successfully."
    }

def edit_transaction(tx_id, vendor, category, gl_account):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    tx = c.fetchone()
    if not tx:
        conn.close()
        return {"error": f"Transaction {tx_id} not found"}

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    unique_suffix = f"{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:6]}"

    # If already posted to GL, reverse the previous entry and post the newly classified entry
    new_je_number = tx["journal_entry_id"]
    if tx["journal_entry_id"]:
        rev_res = reverse_journal_entry(
            tx["journal_entry_id"],
            reason=f"Reclassification from {tx['gl_account']} to {gl_account}",
            created_by="Madhavan",
            external_conn=conn
        )
        if "error" in rev_res:
            conn.close()
            return rev_res

        # Post new balanced entry under new GL account
        amount = float(tx["amount"])
        is_revenue = (str(tx["type"]).lower() == "revenue")
        if is_revenue:
            deb_acc = tx["suggested_debit_account"] or "1010"
            cred_acc = gl_account
        else:
            deb_acc = gl_account
            cred_acc = tx["suggested_credit_account"] or "1010"

        new_lines = [
            {"accountCode": deb_acc, "debit": amount, "credit": 0.0, "description": f"DR: {category}"},
            {"accountCode": cred_acc, "debit": 0.0, "credit": amount, "description": "CR: Bank Settlement"}
        ]
        new_post = post_journal_entry(
            date=tx["date"] or datetime.now().strftime("%Y-%m-%d"),
            description=f"Reclassified entry for {tx['description']}",
            lines=new_lines,
            created_by="Madhavan",
            source_type="TRANSACTION",
            source_id=tx_id,
            external_conn=conn
        )
        if "error" in new_post:
            conn.close()
            return new_post
        new_je_number = new_post["entryNumber"]

    c.execute("""
    UPDATE transactions 
    SET vendor = ?, category = ?, gl_account = ?, suggested_debit_account = ?, 
        status = 'categorized', confidence = 1.0, journal_entry_id = ?
    WHERE id = ?
    """, (vendor, category, gl_account, gl_account, new_je_number, tx_id))

    c.execute("""
    INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
    VALUES (?, 'Madhavan', 'EDIT_CLASSIFICATION', 'TRANSACTION', ?, ?)
    """, (f"al-edit-{unique_suffix}", tx_id, f"Manual reclassification to Vendor: {vendor}, Category: {category}, GL: {gl_account}"))

    conn.commit()
    conn.close()
    return {"success": True, "message": "Transaction updated and general ledger adjusted"}

def reject_transaction(tx_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,))
    tx = c.fetchone()
    if not tx:
        conn.close()
        return {"error": f"Transaction {tx_id} not found"}

    unique_suffix = f"{int(datetime.now().timestamp())}-{uuid.uuid4().hex[:6]}"

    # If already posted to the General Ledger, reverse the entry cleanly to restore balances
    if tx["journal_entry_id"]:
        rev_res = reverse_journal_entry(
            tx["journal_entry_id"],
            reason="Transaction rejected by controller",
            created_by="Madhavan",
            external_conn=conn
        )
        if "error" in rev_res:
            conn.close()
            return rev_res

    c.execute("""
    UPDATE transactions 
    SET status = 'unmatched', confidence = 0.0, journal_entry_id = NULL
    WHERE id = ?
    """, (tx_id,))

    c.execute("""
    INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
    VALUES (?, 'Madhavan', 'REJECT_TRANSACTION', 'TRANSACTION', ?, 'Rejected AI recommendation & reversed any posted ledger entry')
    """, (f"al-rej-{unique_suffix}", tx_id))

    conn.commit()
    conn.close()
    return {"success": True, "message": "Transaction rejected and ledger adjusted"}

def import_csv_rows(csv_rows):
    conn = get_connection()
    c = conn.cursor()
    results = []
    duplicates = 0
    now = datetime.now()
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")

    for i, row in enumerate(csv_rows):
        date = row.get("date") or row.get("Date") or now.strftime("%Y-%m-%d")
        desc = (row.get("description") or row.get("Description") or row.get("memo") or "Transaction").strip()
        try:
            amt = abs(float(row.get("amount") or row.get("Amount") or 0))
        except:
            amt = 0.0
        currency = row.get("currency") or row.get("Currency") or "INR"

        if not desc or amt == 0:
            continue

        c.execute("SELECT id FROM transactions WHERE date = ? AND description = ? AND amount = ?", (date, desc, amt))
        if c.fetchone():
            duplicates += 1
            continue

        classification = categorize_transaction(desc, amt)
        tx_id = f"tx-imp-{int(now.timestamp())}-{i}"
        status = classification["status"]

        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, category, gl_account, confidence, ai_explanation, suggested_debit_account,
            suggested_credit_account, payment_method, is_anomaly, anomaly_reason, created_at
        ) VALUES (?, 'org-1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CSV Bank Feed', ?, ?, ?)
        """, (
            tx_id, date, desc, f"CSV: {desc}", amt, currency, classification["type"], status,
            classification["vendor"], classification["category"], classification["glAccount"],
            classification["confidence"], json.dumps(classification["aiExplanation"]),
            classification["suggestedDebitAccount"], classification["suggestedCreditAccount"],
            classification["isAnomaly"], classification["anomalyReason"], now_str
        ))

        results.append({
            "id": tx_id,
            "date": date,
            "description": desc,
            "amount": amt,
            "vendor": classification["vendor"],
            "category": classification["category"],
            "confidence": classification["confidence"],
            "status": status
        })

    c.execute("INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details) VALUES (?, 'Madhavan', 'CSV_IMPORT', 'TRANSACTION_BATCH', 'batch', ?)", (f"al-csv-{int(now.timestamp())}", f"Imported {len(results)} transactions via Python"))
    conn.commit()
    conn.close()
    return {"importedCount": len(results), "duplicatesSkipped": duplicates, "transactions": results}

def add_single_transaction(data):
    date = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    desc = data.get("description") or "Manual Transaction"
    amt = abs(float(data.get("amount") or 0))
    currency = data.get("currency") or "INR"
    pay_method = data.get("paymentMethod") or "Bank Transfer"
    classification = categorize_transaction(desc, amt)

    conn = get_connection()
    c = conn.cursor()
    tx_id = f"tx-man-{int(datetime.now().timestamp())}"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    c.execute("""
    INSERT INTO transactions (
        id, organization_id, date, description, raw_text, amount, currency, type, status,
        vendor, category, gl_account, confidence, ai_explanation, suggested_debit_account,
        suggested_credit_account, payment_method, is_anomaly, anomaly_reason, created_at
    ) VALUES (?, 'org-1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tx_id, date, desc, f"MANUAL: {desc}", amt, currency, classification["type"],
        classification["status"], classification["vendor"], classification["category"],
        classification["glAccount"], classification["confidence"],
        json.dumps(classification["aiExplanation"]), classification["suggestedDebitAccount"],
        classification["suggestedCreditAccount"], pay_method, classification["isAnomaly"],
        classification["anomalyReason"], now_str
    ))

    conn.commit()
    conn.close()

    return {
        "id": tx_id,
        "status": classification["status"],
        "transaction": {
            "id": tx_id,
            "date": date,
            "description": desc,
            "amount": amt,
            "currency": currency,
            **classification
        }
    }

def get_invoices():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM invoices ORDER BY invoice_date DESC")
    rows = c.fetchall()
    results = []
    for r in rows:
        line_items = json.loads(r["line_items"]) if r["line_items"] else []
        results.append({
            "id": r["id"],
            "invoiceNumber": r["invoice_number"],
            "vendorName": r["vendor_name"],
            "customerName": r["customer_name"],
            "invoiceDate": r["invoice_date"],
            "dueDate": r["due_date"],
            "currency": r["currency"] or "INR",
            "subtotal": float(r["subtotal"] or 0),
            "tax": float(r["tax"] or 0),
            "total": float(r["total"] or 0),
            "status": r["status"],
            "pdfFilename": r["pdf_filename"],
            "matchedTransactionId": r["matched_transaction_id"],
            "matchScore": float(r["match_score"] or 0),
            "notes": r["notes"],
            "lineItems": line_items,
            "createdAt": r["created_at"]
        })
    conn.close()
    return results

def get_invoice_by_id(inv_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM invoices WHERE id = ?", (inv_id,))
    r = c.fetchone()
    conn.close()
    if not r:
        return None
    line_items = json.loads(r["line_items"]) if r["line_items"] else []
    return {
        "id": r["id"],
        "invoiceNumber": r["invoice_number"],
        "vendorName": r["vendor_name"],
        "customerName": r["customer_name"],
        "invoiceDate": r["invoice_date"],
        "dueDate": r["due_date"],
        "currency": r["currency"] or "INR",
        "subtotal": float(r["subtotal"] or 0),
        "tax": float(r["tax"] or 0),
        "total": float(r["total"] or 0),
        "status": r["status"],
        "pdfFilename": r["pdf_filename"],
        "matchedTransactionId": r["matched_transaction_id"],
        "matchScore": float(r["match_score"] or 0),
        "notes": r["notes"],
        "lineItems": line_items,
        "createdAt": r["created_at"]
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return

    cmd = sys.argv[1]

    if cmd == "analytics":
        print(json.dumps(calculate_dashboard_summary()))
    elif cmd == "transactions":
        status = sys.argv[2] if len(sys.argv) > 2 else "ALL"
        tx_type = sys.argv[3] if len(sys.argv) > 3 else "ALL"
        search = sys.argv[4] if len(sys.argv) > 4 else "NONE"
        print(json.dumps(get_transactions(status, tx_type, search)))
    elif cmd == "transaction-get":
        tx_id = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(get_transaction_by_id(tx_id)))
    elif cmd == "approve-tx":
        tx_id = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(approve_transaction(tx_id)))
    elif cmd == "edit-tx":
        data = json.loads(sys.stdin.read())
        print(json.dumps(edit_transaction(sys.argv[2], data.get("vendor"), data.get("category"), data.get("glAccount"))))
    elif cmd == "reject-tx":
        tx_id = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(reject_transaction(tx_id)))
    elif cmd == "add-tx":
        data = json.loads(sys.stdin.read())
        print(json.dumps(add_single_transaction(data)))
    elif cmd == "csv-import":
        data = json.loads(sys.stdin.read())
        print(json.dumps(import_csv_rows(data.get("csvRows", []))))
    elif cmd == "categorize":
        desc = sys.argv[2] if len(sys.argv) > 2 else ""
        amt = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
        print(json.dumps(categorize_transaction(desc, amt)))
    elif cmd == "reconcile":
        print(json.dumps(get_reconciliation_status()))
    elif cmd == "reconcile-auto":
        print(json.dumps(auto_match_all()))
    elif cmd == "reconcile-confirm":
        rec_id = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(confirm_match(rec_id)))
    elif cmd == "ledger":
        code = sys.argv[2] if len(sys.argv) > 2 else "ALL"
        print(json.dumps(get_ledger_view(code)))
    elif cmd == "ledger-post":
        data = json.loads(sys.stdin.read())
        print(json.dumps(post_journal_entry(data.get("date"), data.get("description"), data.get("lines"))))
    elif cmd == "invoices":
        print(json.dumps(get_invoices()))
    elif cmd == "invoice-get":
        inv_id = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(get_invoice_by_id(inv_id)))
    elif cmd == "invoice-upload":
        data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
        print(json.dumps(parse_and_save_invoice(
            raw_text=data.get("rawText", ""),
            filename=data.get("filename", "Uploaded.pdf"),
            custom_vendor=data.get("customVendor"),
            custom_total=float(data.get("customTotal")) if data.get("customTotal") else None
        )))
    elif cmd == "copilot-context":
        print(json.dumps(get_live_financial_context()))
    elif cmd == "copilot":
        query = ""
        if len(sys.argv) > 2:
            query = " ".join(sys.argv[2:])
        elif not sys.stdin.isatty():
            try:
                stdin_data = json.loads(sys.stdin.read())
                query = stdin_data.get("question", "")
            except Exception:
                pass
        if not query:
            query = "summary"
        print(json.dumps(answer_financial_query(query)))
    elif cmd == "feed":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        res = [generate_live_transaction() for _ in range(count)]
        print(json.dumps(res if count > 1 else res[0]))
    elif cmd == "statements-income":
        period = sys.argv[2] if len(sys.argv) > 2 else "FY2026"
        print(json.dumps(get_income_statement(period)))
    elif cmd == "statements-balance":
        print(json.dumps(get_balance_sheet()))
    elif cmd == "rules-get":
        print(json.dumps(get_rules()))
    elif cmd == "rule-create":
        data = json.loads(sys.stdin.read())
        print(json.dumps(create_rule(data)))
    elif cmd == "rule-delete":
        rule_id = sys.argv[2] if len(sys.argv) > 2 else ""
        print(json.dumps(delete_rule(rule_id)))
    elif cmd == "rule-toggle":
        rule_id = sys.argv[2] if len(sys.argv) > 2 else ""
        is_active = sys.argv[3] == "true" if len(sys.argv) > 3 else True
        print(json.dumps(toggle_rule(rule_id, is_active)))
    elif cmd == "rules-simulate":
        days = int(sys.argv[2]) if len(sys.argv) > 2 else 90
        print(json.dumps(simulate_rules(days)))
    elif cmd == "policies-get":
        print(json.dumps(get_confidence_policies()))
    elif cmd == "policies-update":
        data = json.loads(sys.stdin.read())
        print(json.dumps(update_confidence_policies(data)))
    elif cmd == "anomalies-get":
        print(json.dumps(detect_anomalies()))
    elif cmd == "currency-rates":
        print(json.dumps(get_exchange_rates()))
    elif cmd == "currency-fx-calc":
        data = json.loads(sys.stdin.read())
        print(json.dumps(calculate_fx_gain_loss(data.get("invoiceId"), data.get("settlementRate"), data.get("settlementInr"))))
    elif cmd == "approval-process":
        data = json.loads(sys.stdin.read())
        print(json.dumps(process_maker_checker_approval(
            data.get("entityType", "TRANSACTION"),
            data.get("entityId"),
            data.get("userName", "Madhavan Nadar"),
            data.get("userRole", "Finance Controller"),
            float(data.get("threshold", 100000.0))
        )))
    elif cmd == "audit-timeline":
        entity_id = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "ALL" else None
        print(json.dumps(get_audit_timeline(entity_id)))
    elif cmd == "vendors-get":
        print(json.dumps(get_vendor_intelligence()))
    elif cmd == "tds-calc":
        data = json.loads(sys.stdin.read())
        print(json.dumps(calculate_tds_breakdown(data.get("amount", 0), data.get("section", "194J"), data.get("isCompany", True))))
    elif cmd == "gst-itc":
        print(json.dumps(get_gst_itc_reconciliation()))
    elif cmd == "init-db":
        init_db(force_reseed=False)
        ensure_rules_tables()
        ensure_vendors_table()
        get_exchange_rates()
        ensure_audit_tables()
        print(json.dumps({"success": True, "message": "Database ready"}))
    elif cmd == "reset-db":
        init_db(force_reseed=True)
        ensure_rules_tables()
        ensure_vendors_table()
        get_exchange_rates()
        ensure_audit_tables()
        print(json.dumps({"success": True, "message": "Database successfully reset to initial demo state"}))
    else:
        print(json.dumps({"error": f"Unknown command {cmd}"}))

if __name__ == "__main__":
    main()
