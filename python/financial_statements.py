import json
from datetime import datetime
from db import get_connection

def get_income_statement(period="FY2026"):
    conn = get_connection()
    c = conn.cursor()

    # Query all accounts directly from SQLite
    c.execute("SELECT code, name, type, balance FROM accounts")
    rows = c.fetchall()
    acc_map = {row["code"]: float(row["balance"] or 0) for row in rows}
    name_map = {row["code"]: row["name"] for row in rows}

    # Revenue accounts (type = 'REVENUE')
    saas_rev = acc_map.get("4000", 0.0)
    prof_services = acc_map.get("4100", 0.0)
    fx_gain = acc_map.get("8100", 0.0)
    total_revenue = saas_rev + prof_services + (fx_gain if fx_gain > 0 else 0)

    # Cost of Goods Sold (COGS)
    cogs_hosting = acc_map.get("5000", 0.0)
    total_cogs = cogs_hosting
    gross_profit = total_revenue - total_cogs
    gross_margin_pct = round((gross_profit / total_revenue * 100), 1) if total_revenue > 0 else 0.0

    # Operating Expenses (OPEX)
    cloud_infra = acc_map.get("6100", 0.0)
    software_subs = acc_map.get("6200", 0.0)
    marketing = acc_map.get("6300", 0.0)
    payroll = acc_map.get("7100", 0.0)
    travel = acc_map.get("7200", 0.0)
    office_utils = acc_map.get("7300", 0.0)
    
    total_opex = cloud_infra + software_subs + marketing + payroll + travel + office_utils
    ebitda = gross_profit - total_opex
    operating_margin_pct = round((ebitda / total_revenue * 100), 1) if total_revenue > 0 else 0.0

    # Taxes
    taxes = acc_map.get("8000", 0.0)
    net_income = ebitda - taxes
    net_margin_pct = round((net_income / total_revenue * 100), 1) if total_revenue > 0 else 0.0

    conn.close()

    rev_divisor = total_revenue if total_revenue > 0 else 1.0

    return {
        "period": period,
        "fiscalYear": "2026-2027",
        "currency": "INR",
        "generatedAt": datetime.now().isoformat(),
        "revenue": {
            "totalRevenue": round(total_revenue, 2),
            "lineItems": [
                {"accountCode": "4000", "name": name_map.get("4000", "SaaS Subscription Revenue"), "amount": round(saas_rev, 2), "pctOfRevenue": round(saas_rev / rev_divisor * 100, 1)},
                {"accountCode": "4100", "name": name_map.get("4100", "Professional Services Revenue"), "amount": round(prof_services, 2), "pctOfRevenue": round(prof_services / rev_divisor * 100, 1)},
                {"accountCode": "8100", "name": name_map.get("8100", "Realized Foreign Exchange Gain"), "amount": round(fx_gain, 2), "pctOfRevenue": round(fx_gain / rev_divisor * 100, 1)}
            ]
        },
        "cogs": {
            "totalCogs": round(total_cogs, 2),
            "grossProfit": round(gross_profit, 2),
            "grossMarginPct": gross_margin_pct,
            "lineItems": [
                {"accountCode": "5000", "name": name_map.get("5000", "Direct Hosting & Infrastructure Compute"), "amount": round(cogs_hosting, 2), "pctOfRevenue": round(cogs_hosting / rev_divisor * 100, 1)}
            ]
        },
        "operatingExpenses": {
            "totalOpex": round(total_opex, 2),
            "ebitda": round(ebitda, 2),
            "operatingMarginPct": operating_margin_pct,
            "lineItems": [
                {"accountCode": "6100", "name": name_map.get("6100", "Cloud Infrastructure"), "amount": round(cloud_infra, 2), "pctOfRevenue": round(cloud_infra / rev_divisor * 100, 1)},
                {"accountCode": "6200", "name": name_map.get("6200", "Software Tools & Subscriptions"), "amount": round(software_subs, 2), "pctOfRevenue": round(software_subs / rev_divisor * 100, 1)},
                {"accountCode": "6300", "name": name_map.get("6300", "Marketing & Customer Acquisition"), "amount": round(marketing, 2), "pctOfRevenue": round(marketing / rev_divisor * 100, 1)},
                {"accountCode": "7100", "name": name_map.get("7100", "Payroll, Engineering Stipends & Contractors"), "amount": round(payroll, 2), "pctOfRevenue": round(payroll / rev_divisor * 100, 1)},
                {"accountCode": "7200", "name": name_map.get("7200", "Travel & Transportation"), "amount": round(travel, 2), "pctOfRevenue": round(travel / rev_divisor * 100, 1)},
                {"accountCode": "7300", "name": name_map.get("7300", "Office Facilities & High-Speed Utilities"), "amount": round(office_utils, 2), "pctOfRevenue": round(office_utils / rev_divisor * 100, 1)}
            ]
        },
        "taxesAndNet": {
            "statutoryTaxes": round(taxes, 2),
            "netIncome": round(net_income, 2),
            "netMarginPct": net_margin_pct
        }
    }

def get_balance_sheet(as_of_date=None):
    conn = get_connection()
    c = conn.cursor()

    c.execute("SELECT code, name, type, balance FROM accounts")
    rows = c.fetchall()
    acc_map = {row["code"]: float(row["balance"] or 0) for row in rows}
    name_map = {row["code"]: row["name"] for row in rows}

    # 1. Assets from SQLite
    bank_hdfc = acc_map.get("1010", 0.0)
    bank_icici = acc_map.get("1020", 0.0)
    ar = acc_map.get("1200", 0.0)
    gst_itc = acc_map.get("2030", 0.0)
    current_assets = bank_hdfc + bank_icici + ar + gst_itc

    non_current_assets = acc_map.get("1500", 0.0)
    total_assets = current_assets + non_current_assets

    # 2. Liabilities from SQLite
    ap = acc_map.get("2010", 0.0)
    tds_payable = acc_map.get("2020", 0.0)
    accrued_expenses = acc_map.get("2040", 0.0)
    current_liabilities = ap + tds_payable + accrued_expenses
    long_term_liabilities = 0.0
    total_liabilities = current_liabilities + long_term_liabilities

    # 3. Income calculation to bridge Equity dynamically
    inc = get_income_statement()
    current_period_net_income = inc["taxesAndNet"]["netIncome"]

    share_capital = acc_map.get("3010", 0.0)
    retained_earnings = acc_map.get("3020", 0.0)
    total_equity = share_capital + retained_earnings + current_period_net_income

    variance = abs(total_assets - (total_liabilities + total_equity))
    is_balanced = variance < 0.01

    conn.close()

    return {
        "asOfDate": as_of_date or datetime.now().strftime("%Y-%m-%d"),
        "currency": "INR",
        "isBalanced": is_balanced,
        "variance": round(variance, 4),
        "assets": {
            "totalAssets": round(total_assets, 2),
            "currentAssets": {
                "total": round(current_assets, 2),
                "lineItems": [
                    {"code": "1010", "name": name_map.get("1010", "HDFC Bank Operating Checking"), "amount": round(bank_hdfc, 2)},
                    {"code": "1020", "name": name_map.get("1020", "ICICI Treasury Reserve Deposit"), "amount": round(bank_icici, 2)},
                    {"code": "1200", "name": name_map.get("1200", "Accounts Receivable"), "amount": round(ar, 2)},
                    {"code": "2030", "name": name_map.get("2030", "GST Input Tax Credit (ITC) Receivable"), "amount": round(gst_itc, 2)}
                ]
            },
            "nonCurrentAssets": {
                "total": round(non_current_assets, 2),
                "lineItems": [
                    {"code": "1500", "name": name_map.get("1500", "Security Deposits & Infrastructure"), "amount": round(non_current_assets, 2)}
                ]
            }
        },
        "liabilities": {
            "totalLiabilities": round(total_liabilities, 2),
            "currentLiabilities": {
                "total": round(current_liabilities, 2),
                "lineItems": [
                    {"code": "2010", "name": name_map.get("2010", "Accounts Payable"), "amount": round(ap, 2)},
                    {"code": "2020", "name": name_map.get("2020", "Statutory TDS Withholding Payable"), "amount": round(tds_payable, 2)},
                    {"code": "2040", "name": name_map.get("2040", "Accrued Operating Expenses"), "amount": round(accrued_expenses, 2)}
                ]
            },
            "longTermLiabilities": {
                "total": 0.0,
                "lineItems": []
            }
        },
        "equity": {
            "totalEquity": round(total_equity, 2),
            "lineItems": [
                {"code": "3010", "name": name_map.get("3010", "Common Stock & Contributed Share Capital"), "amount": round(share_capital, 2)},
                {"code": "3020", "name": name_map.get("3020", "Prior Years Retained Earnings"), "amount": round(retained_earnings, 2)},
                {"code": "3030", "name": "Current Fiscal Year Net Income", "amount": round(current_period_net_income, 2)}
            ]
        },
        "summaryIdentity": {
            "totalAssets": round(total_assets, 2),
            "totalLiabilitiesAndEquity": round(total_liabilities + total_equity, 2),
            "difference": round(variance, 4),
            "equation": "Assets (₹" + f"{total_assets:,.2f}" + ") = Liabilities (₹" + f"{total_liabilities:,.2f}" + ") + Equity (₹" + f"{total_equity:,.2f}" + ")"
        }
    }
