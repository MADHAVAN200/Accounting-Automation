import json
import sqlite3
import sys
import random
from datetime import datetime
from db import get_connection
from categorize import categorize_transaction
from ledger import post_journal_entry

FEED_TEMPLATES = [
    {
        "description": "AWS AP-SOUTH-1 COMPUTE USAGE",
        "raw_text": "POS DEBIT AWS CLOUD SERVICES MUMBAI AZ-1",
        "amount_range": (12000.0, 48000.0),
        "payment_method": "Corporate Card"
    },
    {
        "description": "STRIPE PAYOUT DAILY SETTLEMENT",
        "raw_text": "NEFT INFLOW STRIPE PAYMENTS INDIA PVT LTD SETTLEMENT",
        "amount_range": (85000.0, 320000.0),
        "payment_method": "NEFT Inflow"
    },
    {
        "description": "RAZORPAY MERCHANT SETTLEMENT",
        "raw_text": "RTGS INFLOW RAZORPAY SOFTWARE SERVICES PVT LTD",
        "amount_range": (110000.0, 450000.0),
        "payment_method": "RTGS Inflow"
    },
    {
        "description": "GOOGLE ADS CAMPAIGN CHARGE",
        "raw_text": "AUTO CHARGE GOOGLE ADS CC*9912 IRELAND",
        "amount_range": (15000.0, 38000.0),
        "payment_method": "Corporate Card"
    },
    {
        "description": "GITHUB ENTERPRISE SEATS",
        "raw_text": "WIRE TRANSFER GITHUB INC SAN FRANCISCO",
        "amount_range": (4200.0, 18500.0),
        "payment_method": "Wire Transfer"
    },
    {
        "description": "VERCEL PRO PLATFORM USAGE",
        "raw_text": "CARD DEBIT VERCEL INC WALNUT CA",
        "amount_range": (2800.0, 9400.0),
        "payment_method": "Corporate Card"
    },
    {
        "description": "UBER BUSINESS RIDE BANGALORE",
        "raw_text": "UPI DEBIT UBER INDIA SYSTEMS PVT LTD REF#77182",
        "amount_range": (380.0, 1850.0),
        "payment_method": "UPI Transfer"
    },
    {
        "description": "WEWORK COWORKING DAY PASS",
        "raw_text": "POS DEBIT WEWORK INDIA MANAGEMENT MUMBAI",
        "amount_range": (8000.0, 24000.0),
        "payment_method": "Bank Transfer"
    },
    {
        "description": "AIRTEL FIBER BROADBAND UTILITY",
        "raw_text": "DIRECT DEBIT BHARTI AIRTEL LIMITED TELECOM",
        "amount_range": (1999.0, 4999.0),
        "payment_method": "Direct Debit"
    },
    {
        "description": "UNKNOWN VENDOR *77281 WIRE TRANSFER",
        "raw_text": "IMPS INFLOW UNKNOWN SENDER REF 8812903",
        "amount_range": (5000.0, 22000.0),
        "payment_method": "IMPS Transfer"
    }
]

def generate_live_transaction(template_idx: int = None, custom_desc: str = None, custom_amt: float = None):
    conn = get_connection()
    c = conn.cursor()

    if template_idx is not None and 0 <= template_idx < len(FEED_TEMPLATES):
        tmpl = FEED_TEMPLATES[template_idx]
    else:
        tmpl = random.choice(FEED_TEMPLATES)

    desc = custom_desc or tmpl["description"]
    amount = custom_amt or round(random.uniform(tmpl["amount_range"][0], tmpl["amount_range"][1]), 2)
    raw_text = tmpl["raw_text"]
    pay_method = tmpl["payment_method"]
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    now_ts = int(now.timestamp())
    now_full = now.strftime("%Y-%m-%d %H:%M:%S")

    # Run Python categorization engine
    classification = categorize_transaction(desc, amount, raw_text)
    tx_id = f"tx-rt-{now_ts}-{random.randint(100, 999)}"

    c.execute("""
    INSERT INTO transactions (
        id, organization_id, date, description, raw_text, amount, currency, type, status,
        vendor, category, gl_account, confidence, ai_explanation, suggested_debit_account,
        suggested_credit_account, payment_method, is_anomaly, anomaly_reason, created_at
    ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        tx_id, date_str, desc, raw_text, amount, classification["type"], classification["status"],
        classification["vendor"], classification["category"], classification["glAccount"],
        classification["confidence"], json.dumps(classification["aiExplanation"]),
        classification["suggestedDebitAccount"], classification["suggestedCreditAccount"],
        pay_method, classification["isAnomaly"], classification["anomalyReason"], now_full
    ))

    # If categorized with high confidence, automatically post balanced Double Entry Journal Entry
    je_entry_no = None
    if classification["status"] == "categorized":
        is_revenue = (classification["type"] == "revenue")
        deb_acc = classification["suggestedDebitAccount"]
        cred_acc = classification["suggestedCreditAccount"]

        if is_revenue:
            deb_name = "HDFC Bank Operating"
            cred_name = classification["category"]
            deb_desc = f"DR: Bank Deposit for {desc}"
            cred_desc = f"CR: {classification['category']}"
        else:
            deb_name = classification["category"]
            cred_name = "HDFC Bank Operating"
            deb_desc = f"DR: {classification['category']}"
            cred_desc = f"CR: Live Bank Settlement for {desc}"

        lines = [
            {"accountCode": deb_acc, "accountName": deb_name, "debit": amount, "credit": 0.0, "description": deb_desc},
            {"accountCode": cred_acc, "accountName": cred_name, "debit": 0.0, "credit": amount, "description": cred_desc}
        ]

        je_res = post_journal_entry(
            date=date_str,
            description=f"Live auto-entry for {desc}",
            lines=lines,
            created_by="Python Realtime Feed",
            source_type="TRANSACTION",
            source_id=tx_id,
            external_conn=conn
        )

        if je_res.get("success"):
            je_entry_no = je_res["entryNumber"]
            c.execute("UPDATE transactions SET journal_entry_id = ?, approved_at = ?, approved_by = 'Python Realtime Engine' WHERE id = ?", (je_entry_no, now_full, tx_id))

    # Log to audit trail
    c.execute("""
    INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details)
    VALUES (?, 'Python Live Engine', 'REALTIME_INGEST', 'TRANSACTION', ?, ?)
    """, (f"al-rt-{now_ts}", tx_id, f"Real-time ingested {desc} (₹{amount:,.2f}) - Status: {classification['status']}"))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "transactionId": tx_id,
        "description": desc,
        "amount": amount,
        "category": classification["category"],
        "vendor": classification["vendor"],
        "status": classification["status"],
        "confidence": classification["confidence"],
        "journalEntryId": je_entry_no,
        "timestamp": now_full
    }

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 1
    results = [generate_live_transaction() for _ in range(count)]
    print(json.dumps(results if count > 1 else results[0], indent=2))
