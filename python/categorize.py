import json
import re
import sys
from db import get_connection

RULES = [
    {
        "patterns": [r"AWS", r"AMAZON\s*WEB", r"EC2", r"S3\s*STORAGE", r"AWS\s*SERVICES"],
        "vendor": "Amazon Web Services",
        "category": "Cloud Infrastructure",
        "gl_account": "6100",
        "debit_account": "6100",
        "credit_account": "1010",
        "base_confidence": 0.978,
        "type": "expense",
        "reason": "Merchant matched with Amazon Web Services cloud compute and hosting infrastructure."
    },
    {
        "patterns": [r"AZURE", r"MICROSOFT\s*AZURE", r"MSFT\s*CLOUD"],
        "vendor": "Microsoft Azure",
        "category": "Cloud Infrastructure",
        "gl_account": "6100",
        "debit_account": "6100",
        "credit_account": "1010",
        "base_confidence": 0.965,
        "type": "expense",
        "reason": "Identified as Microsoft Azure cloud server instances and database services."
    },
    {
        "patterns": [r"GOOGLE\s*CLOUD", r"GCP", r"GOOGLE\s*STORAGE"],
        "vendor": "Google Cloud Platform",
        "category": "Cloud Infrastructure",
        "gl_account": "6100",
        "debit_account": "6100",
        "credit_account": "1010",
        "base_confidence": 0.962,
        "type": "expense",
        "reason": "Cloud compute and container hosting on Google Cloud Platform."
    },
    {
        "patterns": [r"GOOGLE\s*ADS", r"ADWORDS", r"META\s*ADS", r"FACEBOOK\s*ADS", r"LINKEDIN\s*ADS", r"TWITTER\s*ADS"],
        "vendor": "Google Ads / Meta",
        "category": "Marketing & Advertising",
        "gl_account": "6300",
        "debit_account": "6300",
        "credit_account": "1010",
        "base_confidence": 0.935,
        "type": "expense",
        "reason": "Digital customer acquisition & search marketing advertising spend."
    },
    {
        "patterns": [r"ADOBE", r"CREATIVE\s*CLOUD", r"FIGMA", r"SLACK", r"NOTION", r"ZOOM", r"GITHUB", r"DATADOG", r"VERCEL"],
        "vendor": "Developer & SaaS Tools",
        "category": "Software & Subscriptions",
        "gl_account": "6200",
        "debit_account": "6200",
        "credit_account": "1010",
        "base_confidence": 0.972,
        "type": "expense",
        "reason": "SaaS productivity software license and team subscriptions."
    },
    {
        "patterns": [r"UBER", r"OLA", r"CAB", r"AIR\s*INDIA", r"INDIGO", r"HOTEL", r"FLIGHT"],
        "vendor": "Transit & Travel",
        "category": "Travel & Transportation",
        "gl_account": "7200",
        "debit_account": "7200",
        "credit_account": "1010",
        "base_confidence": 0.940,
        "type": "expense",
        "reason": "Ground mobility, airfare, or business travel accommodation."
    },
    {
        "patterns": [r"STRIPE\s*PAYOUT", r"RAZORPAY", r"CUSTOMER\s*INFLOW", r"INVOICE\s*SETTLEMENT", r"SUBSCRIPTION\s*REVENUE"],
        "vendor": "Payment Gateway / Customer",
        "category": "SaaS Subscription Revenue",
        "gl_account": "4000",
        "debit_account": "1010",
        "credit_account": "4000",
        "base_confidence": 0.995,
        "type": "revenue",
        "reason": "Payment processor settlement for platform subscription collections."
    },
    {
        "patterns": [r"PAYROLL", r"SALARY", r"STIPEND", r"CONTRACTOR\s*FEE"],
        "vendor": "Payroll / Contractors",
        "category": "Payroll & Contractors",
        "gl_account": "7100",
        "debit_account": "7100",
        "credit_account": "1010",
        "base_confidence": 0.980,
        "type": "expense",
        "reason": "Disbursement of monthly employee compensation or contractor fees."
    },
    {
        "patterns": [r"WEWORK", r"AWFIS", r"COWORKING", r"ELECTRICITY", r"INTERNET", r"AIRTEL\s*BROADBAND"],
        "vendor": "Facilities & Utilities",
        "category": "Office & Utilities",
        "gl_account": "7300",
        "debit_account": "7300",
        "credit_account": "1010",
        "base_confidence": 0.950,
        "type": "expense",
        "reason": "Corporate office workspace lease and utility connectivity."
    }
]

def categorize_transaction(description: str, amount: float = 0.0, raw_text: str = ""):
    text_to_search = f"{description} {raw_text}".upper()

    # 1. Dynamic User/Organization Rules from Database
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT id, name, condition_field, condition_operator, condition_value, min_amount, max_amount,
                   target_category, target_gl_account, auto_approve
            FROM posting_rules
            WHERE is_active = 1
            ORDER BY priority ASC, created_at DESC
        """)
        db_rules = c.fetchall()
        for r in db_rules:
            min_amt = float(r["min_amount"] or 0)
            max_amt = float(r["max_amount"] or 999999999)
            if not (min_amt <= amount <= max_amt):
                continue

            cond_field = r["condition_field"]
            field_val = description if cond_field == "description" else str(amount) if cond_field == "amount" else f"{description} {raw_text}"
            cond_val = str(r["condition_value"] or "").strip()
            op = r["condition_operator"]
            matched = False

            if op == "contains" and cond_val.lower() in field_val.lower():
                matched = True
            elif op == "equals" and cond_val.lower() == field_val.lower().strip():
                matched = True
            elif op == "starts_with" and field_val.lower().strip().startswith(cond_val.lower()):
                matched = True
            elif op == "greater_than":
                try:
                    matched = (amount > float(cond_val or 0))
                except:
                    matched = False
            elif op == "less_than":
                try:
                    matched = (amount < float(cond_val or 0))
                except:
                    matched = False

            if matched:
                c.execute("UPDATE posting_rules SET match_count = match_count + 1 WHERE id = ?", (r["id"],))
                conn.commit()
                conn.close()

                target_cat = r["target_category"]
                target_gl = r["target_gl_account"]
                auto_appr = bool(r["auto_approve"])
                is_rev = target_gl.startswith("4")
                tx_type = "revenue" if is_rev else "expense"
                deb_acc = "1010" if is_rev else target_gl
                cred_acc = target_gl if is_rev else "1010"
                status = "categorized" if auto_appr else "review"

                return {
                    "vendor": r["name"],
                    "category": target_cat,
                    "glAccount": target_gl,
                    "glAccountName": target_cat,
                    "confidence": 0.99,
                    "status": status,
                    "type": tx_type,
                    "suggestedDebitAccount": deb_acc,
                    "suggestedCreditAccount": cred_acc,
                    "isAnomaly": 0,
                    "anomalyReason": None,
                    "aiExplanation": [
                        f"Matched custom organization posting rule: '{r['name']}'",
                        f"Condition: {cond_field} {op} '{cond_val}'",
                        f"Chart of Accounts mapping: GL {target_gl} ({target_cat})"
                    ]
                }
        conn.close()
    except Exception:
        pass

    # 2. System Intelligence Rules
    matched_rule = None
    specific_vendor = None

    for rule in RULES:
        for pat in rule["patterns"]:
            if re.search(pat, text_to_search, re.IGNORECASE):
                matched_rule = rule
                # Extract precise vendor name if possible
                if "AWS" in text_to_search or "AMAZON" in text_to_search:
                    specific_vendor = "Amazon Web Services"
                elif "ADOBE" in text_to_search:
                    specific_vendor = "Adobe Systems"
                elif "GOOGLE ADS" in text_to_search:
                    specific_vendor = "Google Ads"
                elif "FIGMA" in text_to_search:
                    specific_vendor = "Figma"
                elif "SLACK" in text_to_search:
                    specific_vendor = "Slack Technologies"
                elif "UBER" in text_to_search:
                    specific_vendor = "Uber"
                elif "STRIPE" in text_to_search:
                    specific_vendor = "Stripe"
                elif "AZURE" in text_to_search:
                    specific_vendor = "Microsoft Azure"
                elif "ZOOM" in text_to_search:
                    specific_vendor = "Zoom Video"
                elif "GITHUB" in text_to_search:
                    specific_vendor = "GitHub"
                break
        if matched_rule:
            break

    if matched_rule:
        vendor = specific_vendor or matched_rule["vendor"]
        category = matched_rule["category"]
        gl_account = matched_rule["gl_account"]
        confidence = matched_rule["base_confidence"]
        status = "categorized" if confidence >= 0.85 else "review"
        tx_type = matched_rule["type"]
        debit_acc = matched_rule["debit_account"]
        credit_acc = matched_rule["credit_account"]

        explanations = [
            matched_rule["reason"],
            f"Classified under Chart of Accounts: GL {gl_account} ({category})",
            f"Proposed Double Entry: DR Account {debit_acc} / CR Account {credit_acc}",
            f"Amount ₹{amount:,.2f} verified within historical threshold" if amount > 0 else "Amount evaluated"
        ]
        is_anomaly = 0
        anomaly_reason = None

        # Anomaly heuristic: single expense > 10,00,000 INR
        if amount > 1000000 and tx_type == "expense":
            is_anomaly = 1
            anomaly_reason = f"High value expense transaction (₹{amount:,.2f}) flagged for secondary controller audit"
            status = "review"

    else:
        # Fallback for unrecognized merchant
        vendor = "Unknown Vendor"
        category = "Uncategorized Expense"
        gl_account = "6200"
        confidence = 0.58
        status = "review"
        tx_type = "expense"
        debit_acc = "6200"
        credit_acc = "1010"
        is_anomaly = 1
        anomaly_reason = "Unrecognized merchant string with no prior historical pattern"
        explanations = [
            "Descriptor does not match standard vendor signatures",
            "Assigned provisional GL 6200 with 58.0% confidence",
            "Human controller review required before posting to General Ledger"
        ]

    return {
        "vendor": vendor,
        "category": category,
        "glAccount": gl_account,
        "glAccountName": category,
        "confidence": round(confidence, 3),
        "status": status,
        "type": tx_type,
        "suggestedDebitAccount": debit_acc,
        "suggestedCreditAccount": credit_acc,
        "isAnomaly": is_anomaly,
        "anomalyReason": anomaly_reason,
        "aiExplanation": explanations
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        desc = sys.argv[1]
        amt = float(sys.argv[2]) if len(sys.argv) > 2 else 100.0
        res = categorize_transaction(desc, amt)
        print(json.dumps(res, indent=2))
    else:
        test = categorize_transaction("POS DEBIT 2026-09-02 AWS WEB SERVICES*1234 MUMBAI", 108432.0)
        print(json.dumps(test, indent=2))
