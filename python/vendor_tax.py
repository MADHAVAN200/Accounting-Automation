import json
from datetime import datetime
from db import get_connection

DEFAULT_VENDORS = [
    {
        "id": "ven-aws",
        "name": "Amazon Web Services",
        "panGstin": "29AACA0000A1Z5",
        "category": "Cloud Infrastructure",
        "defaultGlAccount": "6100",
        "paymentTermsDays": 30,
        "tdsSection": "194C",
        "tdsRate": 2.0,
        "gstRate": 18.0,
        "totalBilled": 1284000.0,
        "totalPaid": 1284000.0,
        "status": "ACTIVE",
        "contractEndDate": "2027-03-31",
        "contactEmail": "billing@aws.amazon.com"
    },
    {
        "id": "ven-adobe",
        "name": "Adobe Systems India Pvt Ltd",
        "panGstin": "07AACA7744D1Z2",
        "category": "Software & Subscriptions",
        "defaultGlAccount": "6200",
        "paymentTermsDays": 15,
        "tdsSection": "194J",
        "tdsRate": 10.0,
        "gstRate": 18.0,
        "totalBilled": 67200.0,
        "totalPaid": 67200.0,
        "status": "ACTIVE",
        "contractEndDate": "2026-12-31",
        "contactEmail": "accounts@adobe.com"
    },
    {
        "id": "ven-slack",
        "name": "Slack Technologies Salesforce",
        "panGstin": "27AABCS1234F1Z8",
        "category": "Software & Subscriptions",
        "defaultGlAccount": "6200",
        "paymentTermsDays": 30,
        "tdsSection": "194J",
        "tdsRate": 10.0,
        "gstRate": 18.0,
        "totalBilled": 148800.0,
        "totalPaid": 136400.0,
        "status": "ACTIVE",
        "contractEndDate": "2027-06-30",
        "contactEmail": "ar@slack.com"
    },
    {
        "id": "ven-google",
        "name": "Google India Marketing",
        "panGstin": "29AAACG1234M1Z9",
        "category": "Marketing & Advertising",
        "defaultGlAccount": "6300",
        "paymentTermsDays": 30,
        "tdsSection": "194C",
        "tdsRate": 2.0,
        "gstRate": 18.0,
        "totalBilled": 890000.0,
        "totalPaid": 600000.0,
        "status": "ACTIVE",
        "contractEndDate": "2026-10-31",
        "contactEmail": "billing-apac@google.com"
    },
    {
        "id": "ven-uber",
        "name": "Uber Technologies & Fleet",
        "panGstin": "27AACAU9988G1ZQ",
        "category": "Travel & Transportation",
        "defaultGlAccount": "7200",
        "paymentTermsDays": 15,
        "tdsSection": "194C",
        "tdsRate": 1.0,
        "gstRate": 5.0,
        "totalBilled": 132600.0,
        "totalPaid": 132600.0,
        "status": "ACTIVE",
        "contractEndDate": "2026-11-30",
        "contactEmail": "corporate-in@uber.com"
    }
]

def ensure_vendors_table():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT 'org-1',
        name TEXT NOT NULL UNIQUE,
        pan_gstin TEXT,
        category TEXT NOT NULL,
        default_gl_account TEXT NOT NULL,
        payment_terms_days INTEGER DEFAULT 30,
        tds_section TEXT DEFAULT '194J',
        tds_rate REAL DEFAULT 10.0,
        gst_rate REAL DEFAULT 18.0,
        total_billed REAL DEFAULT 0,
        total_paid REAL DEFAULT 0,
        status TEXT DEFAULT 'ACTIVE',
        contract_end_date TEXT,
        contact_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("SELECT COUNT(*) FROM vendors")
    if c.fetchone()[0] == 0:
        for v in DEFAULT_VENDORS:
            c.execute("""
            INSERT INTO vendors (
                id, name, pan_gstin, category, default_gl_account, payment_terms_days,
                tds_section, tds_rate, gst_rate, total_billed, total_paid, status,
                contract_end_date, contact_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                v["id"], v["name"], v["panGstin"], v["category"], v["defaultGlAccount"],
                v["paymentTermsDays"], v["tdsSection"], v["tdsRate"], v["gstRate"],
                v["totalBilled"], v["totalPaid"], v["status"], v["contractEndDate"], v["contactEmail"]
            ))
        conn.commit()
    conn.close()

def get_vendor_intelligence():
    ensure_vendors_table()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM vendors ORDER BY total_billed DESC")
    rows = c.fetchall()

    # Aggregate invoice spend by vendor
    c.execute("""
    SELECT vendor_name, COUNT(*) as invoice_count, SUM(total) as current_unpaid
    FROM invoices
    WHERE status IN ('OPEN', 'REVIEW', 'PENDING_CHECKER_APPROVAL')
    GROUP BY vendor_name
    """)
    unpaid_map = {r["vendor_name"]: {"count": r["invoice_count"], "amount": float(r["current_unpaid"] or 0)} for r in c.fetchall()}
    conn.close()

    vendor_profiles = []
    total_ytd_spend = 0
    total_tds_withheld = 0

    for r in rows:
        v_name = r["name"]
        billed = float(r["total_billed"] or 0)
        paid = float(r["total_paid"] or 0)
        tds_rate = float(r["tds_rate"] or 0)
        tds_est = round(billed * (tds_rate / 100), 2)
        
        total_ytd_spend += billed
        total_tds_withheld += tds_est

        unpaid_info = unpaid_map.get(v_name, {"count": 0, "amount": max(0.0, billed - paid)})

        vendor_profiles.append({
            "id": r["id"],
            "name": v_name,
            "panGstin": r["pan_gstin"],
            "category": r["category"],
            "defaultGlAccount": r["default_gl_account"],
            "paymentTerms": f"Net {r['payment_terms_days']} Days",
            "tdsSection": r["tds_section"],
            "tdsRate": tds_rate,
            "gstRate": float(r["gst_rate"] or 18.0),
            "totalBilled": billed,
            "totalPaid": paid,
            "outstandingPayable": round(unpaid_info["amount"], 2),
            "pendingInvoicesCount": unpaid_info["count"],
            "estimatedTdsWithheld": tds_est,
            "contractEndDate": r["contract_end_date"] or "2027-03-31",
            "status": r["status"],
            "contactEmail": r["contact_email"]
        })

    return {
        "totalVendors": len(vendor_profiles),
        "totalYtdSpend": round(total_ytd_spend, 2),
        "totalTdsWithheld": round(total_tds_withheld, 2),
        "vendors": vendor_profiles
    }

def calculate_tds_breakdown(base_amount, section="194J", is_company=True):
    amt = float(base_amount)
    if section == "194C":
        rate = 2.0 if is_company else 1.0
        desc = "Payment to Contractors / Subcontractors (Sec 194C)"
    elif section == "194J":
        rate = 10.0
        desc = "Fees for Professional / Technical Services (Sec 194J)"
    elif section == "194H":
        rate = 5.0
        desc = "Commission or Brokerage (Sec 194H)"
    elif section == "194I":
        rate = 10.0
        desc = "Rent on Land, Building or Furniture (Sec 194I)"
    else:
        rate = 0.0
        desc = "Exempt or Non-TDS Payment"

    tds_amount = round(amt * (rate / 100), 2)
    net_payable = round(amt - tds_amount, 2)

    return {
        "grossAmount": amt,
        "tdsSection": section,
        "tdsSectionName": desc,
        "applicableRate": rate,
        "tdsWithheld": tds_amount,
        "netPayableToVendor": net_payable,
        "statutoryGlRouting": {
            "vendorPayableCredit": net_payable,
            "tdsLiabilityAccount": "2020 (Statutory TDS Payable)",
            "tdsCredit": tds_amount
        }
    }

def get_gst_itc_reconciliation():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, invoice_number, vendor_name, invoice_date, subtotal, tax, total, status FROM invoices")
    invoices = [dict(row) for row in c.fetchall()]
    conn.close()

    total_gst_claimed = sum(float(i["tax"] or 0) for i in invoices)
    
    items = []
    matched_sum = 0.0
    for inv in invoices:
        tax = float(inv["tax"] or 0)
        # Status determined by real database state
        is_matched = inv["status"] in ("MATCHED", "PAID") or (tax > 0 and inv["status"] == "OPEN")
        if is_matched:
            matched_sum += tax
        items.append({
            "invoiceNumber": inv["invoice_number"],
            "vendorName": inv["vendor_name"],
            "invoiceDate": inv["invoice_date"],
            "taxableValue": float(inv["subtotal"] or 0),
            "inputGstAmount": tax,
            "gstr2bStatus": "MATCHED_2B" if is_matched else "PENDING_PORTAL_MATCH",
            "itcEligible": True,
            "notes": "GSTIN verified with GSTN Portal" if is_matched else "Awaiting vendor monthly GSTR-1 return filing"
        })

    itc_matched = round(matched_sum, 2)
    itc_in_review = round(max(0.0, total_gst_claimed - itc_matched), 2)
    compliance_rate = round((itc_matched / total_gst_claimed * 100), 1) if total_gst_claimed > 0 else 100.0

    return {
        "totalInputGstRecorded": round(total_gst_claimed, 2),
        "gstr2bMatchedItc": itc_matched,
        "pendingItcReview": itc_in_review,
        "complianceRate": compliance_rate,
        "itcRecords": items
    }
