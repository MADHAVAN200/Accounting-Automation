import hashlib
import json
import uuid
from datetime import datetime
from db import get_connection
from ledger import post_journal_entry

def ensure_audit_tables():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_timeline (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        prev_status TEXT,
        new_status TEXT,
        details TEXT,
        ip_address TEXT DEFAULT '127.0.0.1',
        hash_checksum TEXT
    )""")

    c.execute("SELECT COUNT(*) FROM audit_timeline")
    if c.fetchone()[0] == 0:
        genesis_entries = [
            ("aud-gen-01", "2026-09-01 10:14:00", "TRANSACTION", "tx-101", "GENESIS_POST", "Auto-Post Engine", "SYSTEM_DAEMON", "NEW", "categorized", "Auto-approved AWS monthly compute charge against GL 6100", "127.0.0.1", "a87f9d023b1c4e89f76a0129cd4b568910fedcba876543210fedcba987654321"),
            ("aud-gen-02", "2026-09-01 10:15:20", "TRANSACTION", "tx-101", "MAKER_CHECKER_SIGN_OFF", "Madhavan Nadar", "VP of Finance", "categorized", "APPROVED_POSTED", "Controller sign-off executed. Voucher released for ledger posting.", "192.168.1.42", "b98e0c134d2e5f90a87b1230de5c679021afedcb9876543210fedcba09876543"),
            ("aud-gen-03", "2026-09-02 09:12:00", "INVOICE", "inv-1001", "INVOICE_OCR_INGESTION", "Invoice OCR Daemon", "PARSER", "NEW", "MATCHED", "Extracted AWS Invoice #INV-1001. GST ₹16,540 verified.", "127.0.0.1", "c09f1d245e3f6a01b98c2341ef6d780132bafedc09876543210fedcba1098765")
        ]
        for e in genesis_entries:
            c.execute("""
            INSERT INTO audit_timeline (id, timestamp, entity_type, entity_id, action, user_name, user_role, prev_status, new_status, details, ip_address, hash_checksum)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, e)
    conn.commit()
    conn.close()

def compute_hash(prev_hash, entity_id, action, timestamp, user_name):
    payload = f"{prev_hash}::{entity_id}::{action}::{timestamp}::{user_name}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def record_audit_action(entity_type, entity_id, action, user_name, user_role, prev_status, new_status, details):
    ensure_audit_tables()
    conn = get_connection()
    c = conn.cursor()
    
    # Get last hash for chaining
    c.execute("SELECT hash_checksum FROM audit_timeline ORDER BY timestamp DESC LIMIT 1")
    last_row = c.fetchone()
    prev_hash = last_row[0] if last_row and last_row[0] else "GENESIS_ROOT_HASH_0000"

    now_iso = datetime.now().isoformat()
    checksum = compute_hash(prev_hash, entity_id, action, now_iso, user_name)

    rec_id = f"aud-{uuid.uuid4().hex[:8]}"
    c.execute("""
    INSERT INTO audit_timeline (
        id, timestamp, entity_type, entity_id, action, user_name, user_role,
        prev_status, new_status, details, ip_address, hash_checksum
    ) VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, '192.168.1.42', ?)
    """, (rec_id, entity_type, entity_id, action, user_name, user_role, prev_status, new_status, details, checksum))

    conn.commit()
    conn.close()
    return {"id": rec_id, "checksum": checksum}

def process_maker_checker_approval(entity_type, entity_id, user_name="Madhavan Nadar", user_role="Finance Analyst", threshold=100000.0):
    ensure_audit_tables()
    conn = get_connection()
    c = conn.cursor()

    if entity_type == "TRANSACTION":
        c.execute("SELECT * FROM transactions WHERE id = ?", (entity_id,))
        item = c.fetchone()
        if not item:
            conn.close()
            return {"error": f"Transaction {entity_id} not found"}
        amt = float(item["amount"])
        curr_status = item["status"]

        # Dual approval logic
        should_post_to_gl = False
        if amt >= threshold:
            if curr_status == "review" or curr_status == "unmatched":
                new_status = "PENDING_CHECKER_APPROVAL"
                msg = f"Maker step approved by {user_name} ({user_role}). Requires Controller sign-off for amounts ≥ ₹{threshold:,.0f}."
                c.execute("UPDATE transactions SET status = ?, approved_by = ? WHERE id = ?", (new_status, f"Maker: {user_name}", entity_id))
            elif curr_status == "PENDING_CHECKER_APPROVAL":
                new_status = "APPROVED_POSTED"
                msg = f"Final sign-off granted by Checker {user_name} (VP of Finance). Voucher posted to General Ledger."
                c.execute("UPDATE transactions SET status = 'categorized', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?", (f"Checker: {user_name}", entity_id))
                should_post_to_gl = True
            else:
                new_status = "categorized"
                msg = "Transaction already verified."
        else:
            new_status = "categorized"
            msg = f"Below ₹{threshold:,.0f} threshold: immediate sign-off approved and posted to General Ledger."
            c.execute("UPDATE transactions SET status = 'categorized', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?", (user_name, entity_id))
            should_post_to_gl = True

        # Post balanced double-entry voucher to GL if not already posted
        if should_post_to_gl and not item["journal_entry_id"]:
            is_revenue = (str(item["type"]).lower() == "revenue")
            deb_acc = item["suggested_debit_account"] or ("1010" if is_revenue else (item["gl_account"] or "6100"))
            cred_acc = item["suggested_credit_account"] or ((item["gl_account"] or "4000") if is_revenue else "1010")
            deb_name = "HDFC Bank Operating" if is_revenue else (item["category"] or "Expense")
            cred_name = (item["category"] or "Revenue") if is_revenue else "HDFC Bank Operating"

            lines = [
                {"accountCode": deb_acc, "accountName": deb_name, "debit": amt, "credit": 0.0, "description": f"DR: {deb_name}"},
                {"accountCode": cred_acc, "accountName": cred_name, "debit": 0.0, "credit": amt, "description": f"CR: {cred_name}"}
            ]
            je_res = post_journal_entry(
                date=item["date"] or datetime.now().strftime("%Y-%m-%d"),
                description=f"Approved voucher for {item['description']}",
                lines=lines,
                created_by=user_name,
                source_type="TRANSACTION",
                source_id=entity_id,
                external_conn=conn
            )
            if je_res.get("success"):
                je_num = je_res["entryNumber"]
                c.execute("UPDATE transactions SET journal_entry_id = ? WHERE id = ?", (je_num, entity_id))
                msg += f" (Journal Entry #{je_num})"

        record_audit_action("TRANSACTION", entity_id, "MAKER_CHECKER_SIGN_OFF", user_name, user_role, curr_status, new_status, msg)
        conn.commit()
        conn.close()
        return {"success": True, "newStatus": new_status, "message": msg}

    elif entity_type == "INVOICE":
        c.execute("SELECT id, total, status, invoice_number, vendor_name FROM invoices WHERE id = ?", (entity_id,))
        item = c.fetchone()
        if not item:
            conn.close()
            return {"error": f"Invoice {entity_id} not found"}
        amt = float(item["total"])
        curr_status = item["status"]

        if amt >= threshold:
            if curr_status != "PENDING_CHECKER_APPROVAL":
                new_status = "PENDING_CHECKER_APPROVAL"
                msg = f"Maker authorization completed by {user_name}. Escalated to Finance Controller for final payment authorization."
            else:
                new_status = "MATCHED"
                msg = f"Controller final sign-off approved by {user_name}. Invoice cleared for bank disbursement."
        else:
            new_status = "MATCHED"
            msg = f"Invoice below ₹{threshold:,.0f} dual-approval threshold: direct authorization completed."

        c.execute("UPDATE invoices SET status = ? WHERE id = ?", (new_status, entity_id))
        record_audit_action("INVOICE", entity_id, "MAKER_CHECKER_SIGN_OFF", user_name, user_role, curr_status, new_status, msg)
        conn.commit()
        conn.close()
        return {"success": True, "newStatus": new_status, "message": msg}

    conn.close()
    return {"error": f"Unsupported entity type {entity_type}"}

def get_audit_timeline(entity_id=None, limit=50):
    ensure_audit_tables()
    conn = get_connection()
    c = conn.cursor()
    if entity_id:
        c.execute("SELECT * FROM audit_timeline WHERE entity_id = ? ORDER BY timestamp DESC LIMIT ?", (entity_id, limit))
    else:
        c.execute("SELECT * FROM audit_timeline ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()

    return [
        {
            "id": r["id"],
            "timestamp": r["timestamp"],
            "entityType": r["entity_type"],
            "entityId": r["entity_id"],
            "action": r["action"],
            "userName": r["user_name"],
            "userRole": r["user_role"],
            "prevStatus": r["prev_status"],
            "newStatus": r["new_status"],
            "details": r["details"],
            "ipAddress": r["ip_address"],
            "hashChecksum": r["hash_checksum"]
        }
        for r in rows
    ]
