import json
from datetime import datetime
from db import get_connection

DEFAULT_RATES = {
    "USD": {"rate": 83.54, "symbol": "$", "name": "US Dollar", "spread": "+0.12%"},
    "EUR": {"rate": 90.45, "symbol": "€", "name": "Euro", "spread": "-0.08%"},
    "GBP": {"rate": 106.12, "symbol": "£", "name": "British Pound", "spread": "+0.25%"},
    "AED": {"rate": 22.74, "symbol": "د.إ", "name": "UAE Dirham", "spread": "0.00%"},
    "SGD": {"rate": 62.40, "symbol": "S$", "name": "Singapore Dollar", "spread": "+0.05%"},
    "JPY": {"rate": 0.56, "symbol": "¥", "name": "Japanese Yen", "spread": "-0.15%"},
    "INR": {"rate": 1.00, "symbol": "₹", "name": "Indian Rupee", "spread": "0.00%"}
}

def get_exchange_rates():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS exchange_rates (
        currency TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        rate_to_inr REAL NOT NULL,
        spread TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Ensure seeded
    c.execute("SELECT COUNT(*) FROM exchange_rates")
    if c.fetchone()[0] == 0:
        for curr, data in DEFAULT_RATES.items():
            c.execute("""
            INSERT INTO exchange_rates (currency, symbol, rate_to_inr, spread)
            VALUES (?, ?, ?, ?)
            """, (curr, data["symbol"], data["rate"], data["spread"]))
        conn.commit()

    c.execute("SELECT currency, symbol, rate_to_inr, spread, last_updated FROM exchange_rates")
    rows = c.fetchall()
    conn.close()

    return [
        {
            "currency": r["currency"],
            "symbol": r["symbol"],
            "rateToInr": float(r["rate_to_inr"]),
            "spread": r["spread"] or "0.00%",
            "lastUpdated": r["last_updated"] or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        for r in rows
    ]

def calculate_fx_gain_loss(invoice_id, settlement_rate=None, settlement_inr=None):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    inv = c.fetchone()
    conn.close()

    if not inv:
        return {"error": f"Invoice {invoice_id} not found"}

    curr = inv["currency"]
    original_total = float(inv["total"])
    
    # If already INR, no FX variance
    if curr == "INR":
        return {
            "invoiceId": invoice_id,
            "currency": "INR",
            "isFxApplicable": False,
            "message": "Invoice is already in base currency (INR)"
        }

    rates = {r["currency"]: r["rateToInr"] for r in get_exchange_rates()}
    booking_rate = rates.get(curr, 83.50)
    actual_settlement_rate = float(settlement_rate) if settlement_rate else rates.get(curr, 83.50)

    booked_inr = round(original_total * booking_rate, 2)
    settled_inr = round(settlement_inr if settlement_inr else (original_total * actual_settlement_rate), 2)
    
    # Gain or Loss
    fx_variance = round(booked_inr - settled_inr, 2)
    is_gain = fx_variance > 0
    gain_loss_amount = abs(fx_variance)

    journal_legs = [
        {"accountCode": "2010", "accountName": "Accounts Payable", "debit": booked_inr, "credit": 0.0, "note": "Clear original invoice AP liability"},
        {"accountCode": "1010", "accountName": "HDFC Bank Operating", "debit": 0.0, "credit": settled_inr, "note": "Actual bank disbursement"},
    ]

    if is_gain:
        journal_legs.append({
            "accountCode": "8100",
            "accountName": "Foreign Exchange Gain / Loss",
            "debit": 0.0,
            "credit": gain_loss_amount,
            "note": f"Realized FX Gain on {curr} settlement"
        })
    else:
        journal_legs.append({
            "accountCode": "8100",
            "accountName": "Foreign Exchange Gain / Loss",
            "debit": gain_loss_amount,
            "credit": 0.0,
            "note": f"Realized FX Loss on {curr} settlement"
        })

    return {
        "invoiceId": invoice_id,
        "invoiceNumber": inv["invoice_number"],
        "vendorName": inv["vendor_name"],
        "foreignCurrency": curr,
        "foreignAmount": original_total,
        "bookingExchangeRate": booking_rate,
        "bookedInr": booked_inr,
        "settlementExchangeRate": actual_settlement_rate,
        "settledInr": settled_inr,
        "isFxGain": is_gain,
        "fxVariance": gain_loss_amount,
        "glRouting": "8100 (Foreign Exchange Gain/Loss)",
        "balancingJournalLegs": journal_legs
    }
