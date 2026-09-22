import sqlite3
import os
import json
from datetime import datetime, timedelta
import random

DB_PATH = os.environ.get("LEDGER_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "ledger.db"))

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys and WAL mode for high concurrency
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db(force_reseed=False):
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        currency TEXT DEFAULT 'INR',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'Finance Admin',
        avatar_url TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0,
        currency TEXT DEFAULT 'INR',
        description TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        raw_text TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'INR',
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        vendor TEXT,
        customer TEXT,
        category TEXT NOT NULL,
        gl_account TEXT NOT NULL,
        confidence REAL DEFAULT 0.95,
        ai_explanation TEXT,
        suggested_debit_account TEXT,
        suggested_credit_account TEXT,
        payment_method TEXT DEFAULT 'Bank Transfer',
        matched_invoice_id TEXT,
        journal_entry_id TEXT,
        is_anomaly INTEGER DEFAULT 0,
        anomaly_reason TEXT,
        approved_at TEXT,
        approved_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        customer_name TEXT,
        invoice_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        currency TEXT DEFAULT 'INR',
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        pdf_filename TEXT,
        matched_transaction_id TEXT,
        match_score REAL DEFAULT 0,
        notes TEXT,
        line_items TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        entry_number TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_id TEXT,
        total_debit REAL NOT NULL,
        total_credit REAL NOT NULL,
        is_balanced INTEGER DEFAULT 1,
        created_by TEXT NOT NULL,
        approved_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id TEXT PRIMARY KEY,
        journal_entry_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        account_code TEXT NOT NULL,
        account_name TEXT NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        description TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS reconciliation_records (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        invoice_id TEXT NOT NULL,
        overall_score REAL NOT NULL,
        vendor_score REAL NOT NULL,
        amount_score REAL NOT NULL,
        date_score REAL NOT NULL,
        reference_score REAL NOT NULL,
        currency_score REAL NOT NULL,
        semantic_score REAL NOT NULL,
        status TEXT NOT NULL,
        reasons TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_name TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT,
        prev_state TEXT,
        new_state TEXT
    )""")

    # Check if data already exists
    c.execute("SELECT COUNT(*) FROM transactions")
    tx_count = c.fetchone()[0]

    if tx_count == 0 or force_reseed:
        seed_data(conn)

    conn.commit()
    conn.close()

def seed_data(conn):
    c = conn.cursor()

    # Clean existing
    c.execute("DELETE FROM organizations")
    c.execute("DELETE FROM users")
    c.execute("DELETE FROM accounts")
    c.execute("DELETE FROM transactions")
    c.execute("DELETE FROM invoices")
    c.execute("DELETE FROM journal_entries")
    c.execute("DELETE FROM journal_entry_lines")
    c.execute("DELETE FROM reconciliation_records")
    c.execute("DELETE FROM audit_logs")

    # 1. Organization & User
    c.execute("INSERT INTO organizations (id, name, currency) VALUES ('org-1', 'LedgerAI Technologies Inc.', 'INR')")
    c.execute("INSERT INTO users (id, organization_id, name, email, role) VALUES ('usr-1', 'org-1', 'Madhavan Nadar', 'madhavan@ledgerai.com', 'VP of Finance')")

    # 2. Chart of Accounts
    accounts = [
        ("acc-1010", "1010", "HDFC Bank Operating", "ASSET", 8932066.42, "Primary checking account"),
        ("acc-1020", "1020", "ICICI Treasury Reserve", "ASSET", 14500000.0, "Interest-bearing deposit"),
        ("acc-1200", "1200", "Accounts Receivable", "ASSET", 1840000.0, "Customer unpaid invoices"),
        ("acc-1500", "1500", "Security Deposits & Infrastructure", "ASSET", 380000.0, "Security deposits & long-term lease assets"),
        ("acc-2010", "2010", "Accounts Payable", "LIABILITY", 945000.0, "Vendor pending bills"),
        ("acc-2020", "2020", "Statutory TDS Withholding Payable", "LIABILITY", 125000.0, "Section 194C/J statutory tax withholding"),
        ("acc-2030", "2030", "GST Input Tax Credit (ITC) Receivable", "ASSET", 280000.0, "Recoverable input GST credit asset"),
        ("acc-2040", "2040", "Accrued Operating Expenses", "LIABILITY", 92000.0, "Accruals for month-end payroll and utilities"),
        ("acc-3010", "3010", "Common Stock & Contributed Capital", "EQUITY", 15000000.0, "Common share capital"),
        ("acc-3020", "3020", "Retained Earnings", "EQUITY", 6797483.14, "Accumulated prior earnings"),
        ("acc-4000", "4000", "SaaS Subscription Revenue", "REVENUE", 4820000.0, "Platform subscriptions"),
        ("acc-4100", "4100", "Professional Services Revenue", "REVENUE", 640000.0, "Consulting & enterprise onboarding"),
        ("acc-5000", "5000", "Direct Hosting & Compute (COGS)", "EXPENSE", 320000.0, "Direct production cloud hosting"),
        ("acc-6100", "6100", "Cloud Infrastructure", "EXPENSE", 375472.0, "AWS, GCP, Azure servers"),
        ("acc-6200", "6200", "Software & Subscriptions", "EXPENSE", 257244.72, "SaaS tools & dev seats"),
        ("acc-6300", "6300", "Marketing & Advertising", "EXPENSE", 290000.0, "Google Ads, Meta, LinkedIn"),
        ("acc-7100", "7100", "Payroll & Contractors", "EXPENSE", 820000.0, "Salaries and engineer stipends"),
        ("acc-7200", "7200", "Travel & Transportation", "EXPENSE", 44200.0, "Uber, flights, client visits"),
        ("acc-7300", "7300", "Office & Utilities", "EXPENSE", 85000.0, "Coworking & internet"),
        ("acc-8000", "8000", "Taxes & Statutory Duties", "EXPENSE", 310000.0, "GST & statutory taxes"),
        ("acc-8100", "8100", "Realized Foreign Exchange Gain", "REVENUE", 14500.0, "Realized foreign exchange gain"),
    ]
    for acc in accounts:
        c.execute("INSERT INTO accounts (id, organization_id, code, name, type, balance, description) VALUES (?, 'org-1', ?, ?, ?, ?, ?)", acc)

    # 3. Seed Realistic Multi-Month Transactions for dynamic trends
    # Months: Apr 2026 to Sep 2026
    monthly_data = [
        # month, revenue_sum, expense_sum
        ("2026-04", 3820000, 1940000),
        ("2026-05", 4150000, 2050000),
        ("2026-06", 4420000, 2180000),
        ("2026-07", 4680000, 1980000),
        ("2026-08", 4750000, 2270000),
    ]

    tx_id_counter = 1
    for ym, rev_target, exp_target in monthly_data:
        # Inflow transaction
        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, customer, category, gl_account, confidence, ai_explanation,
            suggested_debit_account, suggested_credit_account, payment_method, approved_at, approved_by
        ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', 'revenue', 'categorized', NULL, 'Stripe Gateway Monthly', 'SaaS Subscription Revenue', '4000', 0.99, ?, '1010', '4000', 'NEFT Settlement', ?, 'Auto-Post Engine')
        """, (
            f"tx-hist-{tx_id_counter}",
            f"{ym}-15",
            f"STRIPE SETTLEMENT MONTHLY {ym}",
            f"NEFT INFLOW STRIPE PAYMENTS INDIA PVT LTD {ym}",
            float(rev_target),
            json.dumps(["Payment gateway monthly settlement", "Directly mapped to SaaS Subscription Revenue (GL 4000)"]),
            f"{ym}-15 12:00:00"
        ))
        tx_id_counter += 1

        # Several expense transactions to total exp_target
        cloud_amt = round(exp_target * 0.38, 2)
        mktg_amt = round(exp_target * 0.28, 2)
        soft_amt = round(exp_target * 0.24, 2)
        misc_amt = round(exp_target - (cloud_amt + mktg_amt + soft_amt), 2)

        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, customer, category, gl_account, confidence, ai_explanation,
            suggested_debit_account, suggested_credit_account, payment_method, approved_at, approved_by
        ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', 'expense', 'categorized', 'Amazon Web Services', NULL, 'Cloud Infrastructure', '6100', 0.98, ?, '6100', '1010', 'Card', ?, 'Auto-Post Engine')
        """, (
            f"tx-hist-{tx_id_counter}", f"{ym}-02", f"AWS WEB SERVICES {ym}", f"POS DEBIT AWS SERVICES {ym}", cloud_amt,
            json.dumps(["Recognized AWS monthly hosting", "GL 6100 Cloud Infrastructure"]), f"{ym}-02 09:00:00"
        ))
        tx_id_counter += 1

        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, customer, category, gl_account, confidence, ai_explanation,
            suggested_debit_account, suggested_credit_account, payment_method, approved_at, approved_by
        ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', 'expense', 'categorized', 'Google Ads', NULL, 'Marketing & Advertising', '6300', 0.95, ?, '6300', '1010', 'Card', ?, 'Auto-Post Engine')
        """, (
            f"tx-hist-{tx_id_counter}", f"{ym}-10", f"GOOGLE ADS CC{ym}", f"AUTO CHARGE GOOGLE ADS {ym}", mktg_amt,
            json.dumps(["Google AdWords campaign spend", "GL 6300 Marketing"]), f"{ym}-10 10:00:00"
        ))
        tx_id_counter += 1

        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, customer, category, gl_account, confidence, ai_explanation,
            suggested_debit_account, suggested_credit_account, payment_method, approved_at, approved_by
        ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', 'expense', 'categorized', 'SaaS Tools', NULL, 'Software & Subscriptions', '6200', 0.96, ?, '6200', '1010', 'Card', ?, 'Auto-Post Engine')
        """, (
            f"tx-hist-{tx_id_counter}", f"{ym}-20", f"SAAS TOOLS BUNDLE {ym}", f"DIRECT DEBIT DEV SOFTWARE {ym}", soft_amt,
            json.dumps(["Developer subscription tools", "GL 6200 Software"]), f"{ym}-20 11:00:00"
        ))
        tx_id_counter += 1

        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, customer, category, gl_account, confidence, ai_explanation,
            suggested_debit_account, suggested_credit_account, payment_method, approved_at, approved_by
        ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', 'expense', 'categorized', 'Uber & Office', NULL, 'Travel & Transportation', '7200', 0.92, ?, '7200', '1010', 'UPI', ?, 'Auto-Post Engine')
        """, (
            f"tx-hist-{tx_id_counter}", f"{ym}-25", f"TRAVEL & OPERATIONS {ym}", f"UPI TRANSFER TRAVEL {ym}", misc_amt,
            json.dumps(["Local transport and facilities", "GL 7200 Travel"]), f"{ym}-25 15:00:00"
        ))
        tx_id_counter += 1

    # Current Month (September 2026) Transactions
    sept_transactions = [
        ("tx-101", "2026-09-01", "AWS WEB SERVICES*1234 MUMBAI", "POS DEBIT 2026-09-01 AWS WEB SERVICES*1234 MUMBAI IN CARD#9012", 108432.0, "expense", "categorized", "Amazon Web Services", "Cloud Infrastructure", "6100", 0.974, json.dumps(["Vendor recognized as Amazon Web Services (AWS)", "Historical AWS recurring transactions classified as Cloud Infrastructure (GL 6100)", "Amount matches monthly server baseline"]), "6100", "1010", "Bank Transfer / Card", "inv-1001", "JE-10021", 0, None, "2026-09-01 10:14:00", "Madhavan (Auto-Post Rule)"),
        ("tx-102", "2026-09-01", "UBER *TRIP HELP.UBER.COM", "UPI DEBIT 2026-09-01 UBER *TRIP HELP.UBER.COM REF#882103", 1240.0, "expense", "categorized", "Uber", "Travel & Transportation", "7200", 0.942, json.dumps(["Merchant mapped to Uber mobility services", "Classified under Travel & Transportation (GL 7200)"]), "7200", "1010", "UPI Transfer", None, None, 0, None, "2026-09-01 11:30:00", "Madhavan (Auto-Post Rule)"),
        ("tx-103", "2026-09-02", "ADOBE SYSTEMS CREATIVE CLOUD", "DIRECT DEBIT ADOBE SYSTEMS CREATIVE CLOUD IRELAND", 5600.0, "expense", "matched", "Adobe", "Software & Subscriptions", "6200", 0.981, json.dumps(["Vendor matched with Adobe Creative Cloud monthly license", "Linked to vendor invoice INV-1002"]), "6200", "1010", "Bank Transfer", "inv-1002", "JE-10022", 0, None, "2026-09-02 09:12:00", "System Matching Engine"),
        ("tx-104", "2026-09-02", "GOOGLE ADS*CC5829103", "AUTO CHARGE GOOGLE ADS*CC5829103 G.CO/HELPPAY", 28900.0, "expense", "categorized", "Google Ads", "Marketing & Advertising", "6300", 0.912, json.dumps(["Merchant identified as Google Ads", "Assigned to GL 6300 Marketing & Advertising"]), "6300", "1010", "Corporate Credit Card", "inv-1004", None, 0, None, None, None),
        ("tx-105", "2026-09-02", "UNKWN PYMT *892019 TECH SERVICES", "IMPS P2A TRANSFER UNKWN PYMT *892019 TECH SERVICES REF 99018", 8920.0, "expense", "review", "Unknown Vendor", "Uncategorized Expense", "6200", 0.614, json.dumps(["Low confidence score (61.4%) due to ambiguous descriptor", "Requires human review"]), "6200", "1010", "IMPS Bank Transfer", None, None, 1, "New vendor descriptor with low similarity match", None, None),
        ("tx-106", "2026-09-03", "MICROSOFT AZURE SERVIC CLOUD", "POS DEBIT MICROSOFT AZURE SERVIC CLOUD SINGAPORE", 72920.0, "expense", "categorized", "Microsoft Azure", "Cloud Infrastructure", "6100", 0.958, json.dumps(["Identified as Azure Kubernetes & Database instances", "Classified under GL 6100 Cloud Infrastructure"]), "6100", "1010", "Bank Transfer", "inv-1005", "JE-10023", 0, None, None, None),
        ("tx-107", "2026-09-04", "FIGMA INC ANNUAL TEAM LICENSE", "WIRE TRANSFER FIGMA INC ANNUAL TEAM LICENSE SAN FRANCISCO", 6800.0, "expense", "matched", "Figma", "Software & Subscriptions", "6200", 0.992, json.dumps(["High confidence match for design software subscription", "Linked to approved invoice INV-1006"]), "6200", "1010", "Wire Transfer", "inv-1006", "JE-10024", 0, None, None, None),
        ("tx-108", "2026-09-01", "STRIPE PAYOUT STRIPE_PAYOUT_99210", "NEFT INFLOW STRIPE PAYMENTS INDIA PVT LTD SETTLEMENT", 4820000.0, "revenue", "categorized", None, "SaaS Subscription Revenue", "4000", 0.995, json.dumps(["Automated Stripe daily settlement inflow", "Maps to GL 4000 SaaS Subscription Revenue"]), "1010", "4000", "NEFT Inflow", None, "JE-10025", 0, None, "2026-09-01 10:00:00", "Stripe Webhook"),
        ("tx-109", "2026-08-28", "SLACK TECHNOLOGIES ENTERPRISE GRID", "CARD DEBIT SLACK TECHNOLOGIES SAN FRANCISCO US", 12400.0, "expense", "unmatched", "Slack", "Software & Subscriptions", "6200", 0.963, json.dumps(["Identified as Slack enterprise workspace licensing", "Awaiting invoice reconciliation"]), "6200", "1010", "Corporate Card", "inv-1003", None, 0, None, None, None),
        ("tx-110", "2026-09-03", "ZOOM VIDEO COMMUNICATIONS INC", "POS DEBIT ZOOM VIDEO COMMUNICATIONS SAN JOSE US", 3200.0, "expense", "categorized", "Zoom", "Software & Subscriptions", "6200", 0.985, json.dumps(["Recognized recurring video conferencing subscription", "Classified under GL 6200 Software"]), "6200", "1010", "Credit Card", None, None, 0, None, None, None),
    ]

    for tx in sept_transactions:
        c.execute("""
        INSERT INTO transactions (
            id, organization_id, date, description, raw_text, amount, currency, type, status,
            vendor, category, gl_account, confidence, ai_explanation, suggested_debit_account,
            suggested_credit_account, payment_method, matched_invoice_id, journal_entry_id,
            is_anomaly, anomaly_reason, approved_at, approved_by
        ) VALUES (?, 'org-1', ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            tx[0], tx[1], tx[2], tx[3], tx[4], tx[5], tx[6], tx[7], tx[8], tx[9], tx[10],
            tx[11], tx[12], tx[13], tx[14], tx[15], tx[16], tx[17], tx[18], tx[19], tx[20]
        ))

    # 4. Invoices
    invoices = [
        ("inv-1001", "INV-1001", "Amazon Web Services", "LedgerAI Enterprise", "2026-08-31", "2026-09-30", 91892.0, 16540.0, 108432.0, "MATCHED", "AWS_INV_1001.pdf", "tx-101", 0.978, "Monthly production compute cluster + S3 Glacier", json.dumps([
            {"id": "li-1", "description": "Amazon Elastic Compute Cloud (EC2)", "quantity": 1, "unitPrice": 58400, "amount": 58400, "glAccount": "6100"},
            {"id": "li-2", "description": "Amazon Relational Database Service (RDS)", "quantity": 1, "unitPrice": 24200, "amount": 24200, "glAccount": "6100"},
            {"id": "li-3", "description": "Amazon S3 & CloudFront CDN", "quantity": 1, "unitPrice": 9292, "amount": 9292, "glAccount": "6100"},
            {"id": "li-4", "description": "Integrated GST @ 18%", "quantity": 1, "unitPrice": 16540, "amount": 16540, "glAccount": "8000"}
        ])),
        ("inv-1002", "INV-1002", "Adobe Systems", "LedgerAI Enterprise", "2026-09-01", "2026-09-15", 4745.0, 855.0, 5600.0, "PAID", "Adobe_CC_INV_1002.pdf", "tx-103", 0.994, "Design team Creative Cloud (2 seats)", json.dumps([
            {"id": "li-5", "description": "Creative Cloud Team Pro License", "quantity": 2, "unitPrice": 2372.5, "amount": 4745, "glAccount": "6200"},
            {"id": "li-6", "description": "GST (18%)", "quantity": 1, "unitPrice": 855, "amount": 855, "glAccount": "8000"}
        ])),
        ("inv-1003", "INV-1003", "Slack Technologies", "LedgerAI Enterprise", "2026-08-25", "2026-09-25", 10508.0, 1892.0, 12400.0, "OPEN", "Slack_Grid_INV_1003.pdf", "tx-109", 0.884, "Enterprise communication workspace subscription", json.dumps([
            {"id": "li-7", "description": "Slack Business+ Tier (12 Users)", "quantity": 12, "unitPrice": 875.67, "amount": 10508, "glAccount": "6200"},
            {"id": "li-8", "description": "Taxes & Levies (18%)", "quantity": 1, "unitPrice": 1892, "amount": 1892, "glAccount": "8000"}
        ])),
        ("inv-1004", "INV-1004", "Google Ireland Ltd", "LedgerAI Enterprise", "2026-08-31", "2026-09-30", 24491.0, 4409.0, 28900.0, "REVIEW", "Google_Ads_INV_1004.pdf", "tx-104", 0.912, "Search intent CAC campaign August statement", json.dumps([
            {"id": "li-9", "description": "Google Ads Impressions & Click Traffic", "quantity": 1, "unitPrice": 24491, "amount": 24491, "glAccount": "6300"},
            {"id": "li-10", "description": "IGST @ 18%", "quantity": 1, "unitPrice": 4409, "amount": 4409, "glAccount": "8000"}
        ])),
        ("inv-1005", "INV-1005", "Microsoft Regional Sales", "LedgerAI Enterprise", "2026-09-02", "2026-10-02", 61796.0, 11124.0, 72920.0, "OPEN", "Azure_Monthly_INV_1005.pdf", "tx-106", 0.952, "Azure Singapore region backup replication infrastructure", json.dumps([
            {"id": "li-11", "description": "Azure VM Instances & Cosmos DB", "quantity": 1, "unitPrice": 61796, "amount": 61796, "glAccount": "6100"},
            {"id": "li-12", "description": "GST (18%)", "quantity": 1, "unitPrice": 11124, "amount": 11124, "glAccount": "8000"}
        ])),
        ("inv-1006", "INV-1006", "Figma Inc", "LedgerAI Enterprise", "2026-09-03", "2026-09-17", 5762.0, 1038.0, 6800.0, "MATCHED", "Figma_Design_INV_1006.pdf", "tx-107", 0.992, "Figma Enterprise seat renewal", json.dumps([
            {"id": "li-13", "description": "Figma Design & FigJam Annual Seats", "quantity": 1, "unitPrice": 5762, "amount": 5762, "glAccount": "6200"},
            {"id": "li-14", "description": "Tax (18%)", "quantity": 1, "unitPrice": 1038, "amount": 1038, "glAccount": "8000"}
        ])),
    ]

    for inv in invoices:
        c.execute("""
        INSERT INTO invoices (
            id, organization_id, invoice_number, vendor_name, customer_name,
            invoice_date, due_date, subtotal, tax, total, status,
            pdf_filename, matched_transaction_id, match_score, notes, line_items
        ) VALUES (?, 'org-1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, inv)

    # 5. Journal Entries (Strictly Balanced: DR = CR)
    c.execute("""
    INSERT INTO journal_entries (id, organization_id, entry_number, date, description, status, source_type, source_id, total_debit, total_credit, is_balanced, created_by, approved_by, created_at)
    VALUES ('je-10021', 'org-1', 'JE-10021', '2026-09-01', 'AWS Cloud Infrastructure compute charges for August billing cycle', 'POSTED', 'TRANSACTION', 'tx-101', 108432.0, 108432.0, 1, 'AI Automation Engine', 'Madhavan (Auto-Post Rule)', '2026-09-01 10:14:02')
    """)
    c.execute("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, debit, credit, description) VALUES ('jel-1', 'je-10021', 'acc-6100', '6100', 'Cloud Infrastructure', 108432.0, 0.0, 'DR: AWS Compute & Storage infrastructure')")
    c.execute("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, debit, credit, description) VALUES ('jel-2', 'je-10021', 'acc-1010', '1010', 'HDFC Bank Operating', 0.0, 108432.0, 'CR: Automated Bank Settlement')")

    c.execute("""
    INSERT INTO journal_entries (id, organization_id, entry_number, date, description, status, source_type, source_id, total_debit, total_credit, is_balanced, created_by, approved_by, created_at)
    VALUES ('je-10022', 'org-1', 'JE-10022', '2026-09-02', 'Adobe Creative Cloud monthly design license fee', 'POSTED', 'INVOICE', 'inv-1002', 5600.0, 5600.0, 1, 'Reconciliation Engine', 'System Matching Engine', '2026-09-02 09:12:05')
    """)
    c.execute("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, debit, credit, description) VALUES ('jel-3', 'je-10022', 'acc-6200', '6200', 'Software & Subscriptions', 5600.0, 0.0, 'DR: Adobe Creative Cloud license')")
    c.execute("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, debit, credit, description) VALUES ('jel-4', 'je-10022', 'acc-1010', '1010', 'HDFC Bank Operating', 0.0, 5600.0, 'CR: Direct Debit Settlement')")

    c.execute("""
    INSERT INTO journal_entries (id, organization_id, entry_number, date, description, status, source_type, source_id, total_debit, total_credit, is_balanced, created_by, approved_by, created_at)
    VALUES ('je-10025', 'org-1', 'JE-10025', '2026-09-01', 'Stripe daily automated payment gateway settlement', 'POSTED', 'TRANSACTION', 'tx-108', 4820000.0, 4820000.0, 1, 'Payment Gateway Webhook', 'Madhavan', '2026-09-01 10:01:00')
    """)
    c.execute("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, debit, credit, description) VALUES ('jel-5', 'je-10025', 'acc-1010', '1010', 'HDFC Bank Operating', 4820000.0, 0.0, 'DR: Cash Inflow to HDFC Operating')")
    c.execute("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, account_code, account_name, debit, credit, description) VALUES ('jel-6', 'je-10025', 'acc-4000', '4000', 'SaaS Subscription Revenue', 0.0, 4820000.0, 'CR: Earned SaaS Subscription Revenue')")

    # 6. Reconciliation Records
    c.execute("""
    INSERT INTO reconciliation_records (
        id, transaction_id, invoice_id, overall_score, vendor_score, amount_score, date_score, reference_score, currency_score, semantic_score, status, reasons
    ) VALUES (
        'rec-1', 'tx-101', 'inv-1001', 0.978, 0.99, 1.0, 0.96, 0.92, 1.0, 0.95, 'CONFIRMED',
        'Exact Amount Match (₹108,432 = ₹108,432)|Vendor Match: AWS WEB SERVICES ↔ Amazon Web Services|Date Proximity: 1 day window|Currency: INR verified'
    )""")

    c.execute("""
    INSERT INTO reconciliation_records (
        id, transaction_id, invoice_id, overall_score, vendor_score, amount_score, date_score, reference_score, currency_score, semantic_score, status, reasons
    ) VALUES (
        'rec-2', 'tx-103', 'inv-1002', 0.994, 1.0, 1.0, 0.98, 0.96, 1.0, 0.99, 'CONFIRMED',
        'Exact Amount Match (₹5,600 = ₹5,600)|Vendor Match: ADOBE SYSTEMS ↔ Adobe Systems|Date Match: 2026-09-01 / 2026-09-02'
    )""")

    c.execute("""
    INSERT INTO reconciliation_records (
        id, transaction_id, invoice_id, overall_score, vendor_score, amount_score, date_score, reference_score, currency_score, semantic_score, status, reasons
    ) VALUES (
        'rec-4', 'tx-109', 'inv-1003', 0.884, 0.95, 1.0, 0.72, 0.65, 1.0, 0.92, 'NEEDS_REVIEW',
        'Amount matches ₹12,400|Date gap of 3 days (Invoice: Aug 25 ↔ Bank: Aug 28)|Vendor name verified (Slack Technologies)'
    )""")

    # 7. Audit Logs
    c.execute("INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details) VALUES ('al-1', 'AI Automation', 'AUTO_CATEGORIZE', 'TRANSACTION', 'tx-101', 'Classified AWS transaction as Cloud Infrastructure (GL 6100) with 97.4% confidence')")
    c.execute("INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details) VALUES ('al-2', 'Madhavan', 'APPROVE_POST', 'TRANSACTION', 'tx-101', 'Approved transaction classification and generated Journal Entry #JE-10021')")
    c.execute("INSERT INTO audit_logs (id, user_name, action, entity_type, entity_id, details) VALUES ('al-3', 'Reconciliation Engine', 'CONFIRM_MATCH', 'RECONCILIATION', 'rec-1', 'Confirmed 97.8% match for AWS INV-1001')")

if __name__ == "__main__":
    init_db(force_reseed=True)
    print("Database initialized successfully at", DB_PATH)
