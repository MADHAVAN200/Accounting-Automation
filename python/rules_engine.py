import json
import uuid
from datetime import datetime, timedelta
from db import get_connection

def ensure_rules_tables():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS posting_rules (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT 'org-1',
        name TEXT NOT NULL,
        condition_field TEXT NOT NULL,
        condition_operator TEXT NOT NULL,
        condition_value TEXT NOT NULL,
        min_amount REAL DEFAULT 0,
        max_amount REAL DEFAULT 999999999,
        target_category TEXT NOT NULL,
        target_gl_account TEXT NOT NULL,
        auto_approve INTEGER DEFAULT 1,
        priority INTEGER DEFAULT 10,
        is_active INTEGER DEFAULT 1,
        match_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS confidence_policies (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT 'org-1',
        auto_post_threshold REAL DEFAULT 0.95,
        review_threshold REAL DEFAULT 0.80,
        dual_approval_threshold REAL DEFAULT 100000.0,
        is_dual_approval_enabled INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Seed default policy if missing
    c.execute("SELECT COUNT(*) FROM confidence_policies")
    if c.fetchone()[0] == 0:
        c.execute("""
        INSERT INTO confidence_policies (id, auto_post_threshold, review_threshold, dual_approval_threshold, is_dual_approval_enabled)
        VALUES ('policy-default', 0.95, 0.80, 100000.0, 1)
        """)

    # Seed initial useful deterministic rules if missing
    c.execute("SELECT COUNT(*) FROM posting_rules")
    if c.fetchone()[0] == 0:
        default_rules = [
            ("rule-1", "GitHub Dev Tooling", "description", "contains", "GitHub", 0, 50000, "Software & Subscriptions", "6200", 1, 10),
            ("rule-2", "AWS Cloud Compute Hosting", "description", "contains", "AWS", 0, 150000, "Cloud Infrastructure", "6100", 1, 20),
            ("rule-3", "Google Cloud Platform Services", "description", "contains", "Google Cloud", 0, 100000, "Cloud Infrastructure", "6100", 1, 30),
            ("rule-4", "Uber Client Travel", "description", "contains", "Uber", 0, 25000, "Travel & Transportation", "7200", 1, 40),
            ("rule-5", "High Value Capital Inflow", "amount", "greater_than", "1000000", 1000000, 999999999, "SaaS Subscription Revenue", "4000", 0, 50),
        ]
        for r in default_rules:
            c.execute("""
            INSERT INTO posting_rules (id, name, condition_field, condition_operator, condition_value, min_amount, max_amount, target_category, target_gl_account, auto_approve, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, r)

    conn.commit()
    conn.close()

def get_rules():
    ensure_rules_tables()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM posting_rules ORDER BY priority ASC, created_at DESC")
    rows = c.fetchall()
    rules = []
    for r in rows:
        rules.append({
            "id": r["id"],
            "name": r["name"],
            "conditionField": r["condition_field"],
            "conditionOperator": r["condition_operator"],
            "conditionValue": r["condition_value"],
            "minAmount": float(r["min_amount"] or 0),
            "maxAmount": float(r["max_amount"] or 999999999),
            "targetCategory": r["target_category"],
            "targetGlAccount": r["target_gl_account"],
            "autoApprove": bool(r["auto_approve"]),
            "priority": int(r["priority"] or 10),
            "isActive": bool(r["is_active"]),
            "matchCount": int(r["match_count"] or 0),
            "createdAt": r["created_at"]
        })
    conn.close()
    return rules

def create_rule(data):
    ensure_rules_tables()
    conn = get_connection()
    c = conn.cursor()
    rule_id = f"rule-{uuid.uuid4().hex[:8]}"
    c.execute("""
    INSERT INTO posting_rules (
        id, name, condition_field, condition_operator, condition_value,
        min_amount, max_amount, target_category, target_gl_account, auto_approve, priority, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        rule_id,
        data.get("name", "Custom Rule"),
        data.get("conditionField", "description"),
        data.get("conditionOperator", "contains"),
        data.get("conditionValue", ""),
        float(data.get("minAmount") or 0),
        float(data.get("maxAmount") or 999999999),
        data.get("targetCategory", "Software & Subscriptions"),
        data.get("targetGlAccount", "6200"),
        1 if data.get("autoApprove", True) else 0,
        int(data.get("priority", 10))
    ))
    conn.commit()
    conn.close()
    return {"success": True, "id": rule_id, "message": "Rule successfully saved"}

def delete_rule(rule_id):
    ensure_rules_tables()
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM posting_rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Rule deleted"}

def toggle_rule(rule_id, is_active):
    ensure_rules_tables()
    conn = get_connection()
    c = conn.cursor()
    c.execute("UPDATE posting_rules SET is_active = ? WHERE id = ?", (1 if is_active else 0, rule_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Rule {'activated' if is_active else 'deactivated'}"}

def get_confidence_policies():
    ensure_rules_tables()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM confidence_policies LIMIT 1")
    row = c.fetchone()
    conn.close()
    if not row:
        return {
            "autoPostThreshold": 0.95,
            "reviewThreshold": 0.80,
            "dualApprovalThreshold": 100000.0,
            "isDualApprovalEnabled": True
        }
    return {
        "autoPostThreshold": float(row["auto_post_threshold"]),
        "reviewThreshold": float(row["review_threshold"]),
        "dualApprovalThreshold": float(row["dual_approval_threshold"]),
        "isDualApprovalEnabled": bool(row["is_dual_approval_enabled"])
    }

def update_confidence_policies(data):
    ensure_rules_tables()
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    UPDATE confidence_policies
    SET auto_post_threshold = ?, review_threshold = ?, dual_approval_threshold = ?, is_dual_approval_enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 'policy-default'
    """, (
        float(data.get("autoPostThreshold", 0.95)),
        float(data.get("reviewThreshold", 0.80)),
        float(data.get("dualApprovalThreshold", 100000.0)),
        1 if data.get("isDualApprovalEnabled", True) else 0
    ))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Automation policies updated successfully"}

def simulate_rules(days=90):
    ensure_rules_tables()
    rules = get_rules()
    active_rules = [r for r in rules if r["isActive"]]
    policies = get_confidence_policies()

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT id, date, description, amount, category, gl_account, confidence, status, vendor FROM transactions ORDER BY date DESC")
    tx_rows = c.fetchall()
    conn.close()

    total_evaluated = len(tx_rows)
    auto_post_count = 0
    review_count = 0
    matched_by_rules_count = 0
    simulated_matches = []

    for tx in tx_rows:
        matched_rule = None
        desc = (tx["description"] or "").lower()
        vendor = (tx["vendor"] or "").lower()
        amt = float(tx["amount"] or 0)

        for r in active_rules:
            # Check amount bounds
            if amt < r["minAmount"] or amt > r["maxAmount"]:
                continue

            field_val = desc if r["conditionField"] == "description" else (vendor if r["conditionField"] == "vendor" else str(amt))
            c_val = r["conditionValue"].lower()
            op = r["conditionOperator"]

            matched = False
            if op == "contains" and c_val in field_val:
                matched = True
            elif op == "equals" and field_val == c_val:
                matched = True
            elif op == "starts_with" and field_val.startswith(c_val):
                matched = True
            elif op == "greater_than":
                try:
                    matched = amt > float(c_val)
                except:
                    pass
            elif op == "less_than":
                try:
                    matched = amt < float(c_val)
                except:
                    pass

            if matched:
                matched_rule = r
                break

        if matched_rule:
            matched_by_rules_count += 1
            is_auto = matched_rule["autoApprove"]
            if is_auto:
                auto_post_count += 1
            else:
                review_count += 1
            simulated_matches.append({
                "transactionId": tx["id"],
                "date": tx["date"],
                "description": tx["description"],
                "amount": amt,
                "previousCategory": tx["category"],
                "newCategory": matched_rule["targetCategory"],
                "ruleName": matched_rule["name"],
                "action": "AUTO_APPROVE" if is_auto else "ROUTE_TO_REVIEW"
            })
        else:
            # Check AI confidence policies
            conf = float(tx["confidence"] or 0.95)
            if conf >= policies["autoPostThreshold"]:
                auto_post_count += 1
            elif conf >= policies["reviewThreshold"]:
                review_count += 1

    return {
        "daysSimulated": days,
        "totalTransactions": total_evaluated,
        "activeRulesCount": len(active_rules),
        "rulesMatchedCount": matched_by_rules_count,
        "projectedAutoApproved": auto_post_count,
        "projectedReviewQueue": review_count,
        "automationRate": round((auto_post_count / total_evaluated * 100), 1) if total_evaluated > 0 else 100.0,
        "sampleMatches": simulated_matches[:12]
    }
