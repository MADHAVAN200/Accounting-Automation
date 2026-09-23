import json
from datetime import datetime
from db import get_connection

def detect_anomalies():
    conn = get_connection()
    c = conn.cursor()

    # 1. Fetch all invoices for duplicate detection
    c.execute("SELECT id, invoice_number, vendor_name, invoice_date, total, status FROM invoices ORDER BY invoice_date DESC")
    invoices = [dict(row) for row in c.fetchall()]

    duplicate_invoices = []
    seen_combinations = {}

    for inv in invoices:
        v_name = (inv["vendor_name"] or "").strip().lower()
        amt = float(inv["total"] or 0)
        inv_num = (inv["invoice_number"] or "").strip().lower()

        # Key 1: exact same invoice number
        if inv_num and inv_num in seen_combinations:
            duplicate_invoices.append({
                "type": "DUPLICATE_INVOICE_NUMBER",
                "severity": "CRITICAL",
                "invoiceId": inv["id"],
                "invoiceNumber": inv["invoice_number"],
                "vendorName": inv["vendor_name"],
                "amount": amt,
                "date": inv["invoice_date"],
                "matchedWithId": seen_combinations[inv_num]["id"],
                "reason": f"Exact duplicate invoice number '{inv['invoice_number']}' already registered for {inv['vendor_name']}",
                "recommendation": "Block settlement and request vendor credit note or confirmation"
            })
        else:
            seen_combinations[inv_num] = inv

        # Key 2: exact same vendor + amount within rolling window
        pair_key = f"{v_name}::{amt}"
        if pair_key in seen_combinations and seen_combinations[pair_key]["id"] != inv["id"]:
            prev = seen_combinations[pair_key]
            duplicate_invoices.append({
                "type": "DUPLICATE_VENDOR_AMOUNT",
                "severity": "HIGH",
                "invoiceId": inv["id"],
                "invoiceNumber": inv["invoice_number"],
                "vendorName": inv["vendor_name"],
                "amount": amt,
                "date": inv["invoice_date"],
                "matchedWithId": prev["id"],
                "reason": f"Identical bill amount (₹{amt:,.2f}) detected from {inv['vendor_name']} matching invoice #{prev['invoice_number']}",
                "recommendation": "Verify with procurement whether this represents a dual charge or recurring service"
            })
        else:
            seen_combinations[pair_key] = inv

    # 2. Outlier & Variance Detection on Transactions
    c.execute("""
    SELECT id, date, description, amount, category, vendor, gl_account, created_at, status
    FROM transactions
    ORDER BY date DESC
    """)
    transactions = [dict(row) for row in c.fetchall()]

    # Calculate vendor / category historical averages
    vendor_amounts = {}
    for tx in transactions:
        v = (tx["vendor"] or tx["category"] or "General").strip()
        amt = float(tx["amount"] or 0)
        if v not in vendor_amounts:
            vendor_amounts[v] = []
        vendor_amounts[v].append(amt)

    outlier_transactions = []
    off_hour_transactions = []

    for tx in transactions:
        v = (tx["vendor"] or tx["category"] or "General").strip()
        amt = float(tx["amount"] or 0)
        dt_str = tx["date"] or "2026-09-01"

        # Trailing variance test
        history = vendor_amounts.get(v, [])
        if len(history) >= 2:
            avg_spend = sum(history) / len(history)
            variance_ratio = (amt - avg_spend) / avg_spend if avg_spend > 0 else 0
            if variance_ratio > 0.25 and amt > 10000:  # > 25% spike
                outlier_transactions.append({
                    "type": "VARIANCE_SPIKE",
                    "severity": "MEDIUM",
                    "transactionId": tx["id"],
                    "date": tx["date"],
                    "description": tx["description"],
                    "vendor": v,
                    "amount": amt,
                    "baselineAverage": round(avg_spend, 2),
                    "variancePercent": round(variance_ratio * 100, 1),
                    "reason": f"Charge of ₹{amt:,.2f} is {round(variance_ratio * 100, 1)}% above the trailing benchmark (₹{avg_spend:,.2f}) for {v}",
                    "recommendation": "Check monthly AWS/SaaS user seat addition or cloud bandwidth overage"
                })

        # Weekend / unusual hour test
        try:
            d = datetime.strptime(dt_str[:10], "%Y-%m-%d")
            is_weekend = d.weekday() in (5, 6) # Sat, Sun
            if is_weekend and amt > 5000:
                off_hour_transactions.append({
                    "type": "WEEKEND_SPEND",
                    "severity": "LOW",
                    "transactionId": tx["id"],
                    "date": tx["date"],
                    "dayOfWeek": d.strftime("%A"),
                    "description": tx["description"],
                    "vendor": v,
                    "amount": amt,
                    "reason": f"Corporate card debited on {d.strftime('%A')} outside standard business banking hours",
                    "recommendation": "Confirm legitimate urgent field travel, server emergency, or automated batch job"
                })
        except:
            pass

    conn.close()

    total_flags = len(duplicate_invoices) + len(outlier_transactions) + len(off_hour_transactions)
    health_score = max(0, 100 - (len(duplicate_invoices) * 20 + len(outlier_transactions) * 10 + len(off_hour_transactions) * 5))

    return {
        "healthScore": health_score,
        "totalAnomaliesDetected": total_flags,
        "duplicateInvoicesCount": len(duplicate_invoices),
        "outlierSpendCount": len(outlier_transactions),
        "offHoursCount": len(off_hour_transactions),
        "duplicateInvoices": duplicate_invoices,
        "outlierTransactions": outlier_transactions,
        "offHourTransactions": off_hour_transactions,
        "checkedAt": datetime.now().isoformat()
    }
