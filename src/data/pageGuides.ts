export interface PageGuideMetric {
  label: string;
  description: string;
  formula?: string;
}

export interface PageGuideWorkflow {
  step: string;
  description: string;
}

export interface PageGuide {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  overview: string;
  keyMetrics?: PageGuideMetric[];
  workflows?: PageGuideWorkflow[];
  accountingInvariants?: string[];
  tips?: string[];
}

export const PAGE_GUIDES: Record<string, PageGuide> = {
  dashboard: {
    id: "dashboard",
    title: "Executive Financial Command Dashboard",
    badge: "Live Ledger Pulse",
    subtitle: "Real-time treasury liquidity, monthly burn, runway, and automated transaction feed",
    overview:
      "The Dashboard provides an executive-level view of your business's financial health by querying the underlying double-entry SQLite database in real time. It calculates live cash balances across connected accounts, monitors monthly net burn, predicts operational runway, and highlights transactions requiring controller attention.",
    keyMetrics: [
      {
        label: "Liquid Treasury Cash",
        description: "Combined balance of all liquid operating and treasury bank accounts (HDFC + ICICI).",
        formula: "Liquid Cash = HDFC Operating (₹89.08L) + ICICI Treasury (₹1.45 Cr)",
      },
      {
        label: "Monthly Net Burn",
        description: "Net cash outflow calculated as total operating debits minus operating credits over the trailing 30 days.",
        formula: "Net Burn = Operating Expenses (Debits) - Operating Inflows (Credits)",
      },
      {
        label: "Runway (Months)",
        description: "Projected operational runway before requiring additional capital, based on trailing net burn.",
        formula: "Runway = Total Liquid Cash / Trailing 30-Day Net Burn",
      },
      {
        label: "Automated Categorization Rate",
        description: "Percentage of ingested bank statement transactions categorized by the AI engine with confidence >= 70%.",
        formula: "Automation % = (Categorized Tx Count / Total Ingested Tx Count) * 100",
      },
    ],
    workflows: [
      {
        step: "1. Monitor Real-Time Inflows/Outflows",
        description: "Review live bank cards and chart distributions to spot immediate treasury shifts.",
      },
      {
        step: "2. Ingest Bank Feeds & Statements",
        description: "Click 'Import Statement' to upload bank CSV/Excel files, or click 'Simulate Live Bank Stream' to inject mock live webhook feeds.",
      },
      {
        step: "3. Address Maker-Checker Approvals",
        description: "Any transaction with amount >= ₹1,00,000 requires secondary controller sign-off before posting to the ledger.",
      },
      {
        step: "4. Ask the AI Financial Copilot",
        description: "Type queries into the Quick Copilot box to query the SQLite ledger with zero hallucination.",
      },
    ],
    accountingInvariants: [
      "Zero Mock Math: All metrics derive directly from real transactions in SQLite.",
      "Dual Bank Segregation: HDFC handles operating payroll and software; ICICI holds reserve capital.",
      "Maker-Checker Threshold: Mandatory sign-off enforced on all single transactions >= ₹1,00,000.",
    ],
    tips: [
      "Press Cmd+K / Ctrl+K anytime to open the global Command Palette.",
      "Click 'Download Sample Excel' to get a pre-formatted statement template ready for import.",
    ],
  },

  transactions: {
    id: "transactions",
    title: "Bank Transactions & Categorization Ledger",
    badge: "Multi-Source Ingestion",
    subtitle: "Raw bank feed ingestion, automated chart-of-accounts mapping, and dual approval controls",
    overview:
      "The Transactions module manages all bank statement feeds imported via CSV, Excel, or real-time simulation. The system automatically computes SHA-256 deduplication hashes, classifies memos against your Chart of Accounts, applies tax rules, and holds high-value transactions in escrow for secondary maker-checker sign-off.",
    keyMetrics: [
      {
        label: "AI Categorization Confidence",
        description: "Machine learning score evaluating merchant text similarity, vendor history, and transaction keywords against known expense categories.",
        formula: "Confidence >= 70% auto-approves; < 70% flags for accountant review.",
      },
      {
        label: "Maker-Checker Sign-off Threshold",
        description: "Statutory internal control policy requiring transactions >= ₹1,00,000 to be approved by a secondary controller.",
        formula: "Dual Approval Required if Transaction Amount >= ₹1,00,000 INR",
      },
      {
        label: "SHA-256 Deduplication Hash",
        description: "Unique cryptographic hash generated from date, amount, account, and reference to guarantee zero duplicate bank postings.",
        formula: "Hash = SHA-256(Date + Account + Amount + Description + Ref)",
      },
    ],
    workflows: [
      {
        step: "1. Import Bank Records",
        description: "Upload your bank statements in CSV or XLSX format. The parser automatically detects column headers and rejects duplicates.",
      },
      {
        step: "2. Review AI Categorization",
        description: "Inspect confidence scores and assigned GL accounts. Override categories or vendors directly if needed.",
      },
      {
        step: "3. Dual Controller Sign-Off",
        description: "For high-value items (>= ₹1,00,000), a secondary controller must review and click 'Dual Approve' to post the journal voucher.",
      },
      {
        step: "4. Drill into Forensics",
        description: "Click any transaction row to open its forensic detail view, showing balanced debit/credit splits and chained audit hashes.",
      },
    ],
    accountingInvariants: [
      "Every posted transaction creates a balanced journal entry where Total Debits == Total Credits.",
      "Maker-Checker Segregation of Duties: The user who created or imported a high-value item cannot be the sole approver.",
      "Immutable Audit Log: All category edits and approvals write sequential chained SHA-256 audit blocks.",
    ],
    tips: [
      "Filter by 'Needs Approval' to quickly clear pending maker-checker transactions.",
      "Export filtered transaction sets to Excel with full GL account codes at any time.",
    ],
  },

  transactionDetails: {
    id: "transactionDetails",
    title: "Transaction Forensic & Audit Inspection",
    badge: "Double-Entry Verification",
    subtitle: "Complete forensic analysis of bank memo, GL voucher splits, and cryptographic audit trail",
    overview:
      "This view breaks down an individual financial transaction into its fundamental accounting components. You can verify how the raw bank memo was parsed, inspect the balanced debit/credit voucher lines, test against automated rules, and verify the cryptographic integrity of the chained audit log.",
    keyMetrics: [
      {
        label: "Journal Voucher Invariant",
        description: "Fundamental rule of double-entry bookkeeping: every transaction must have equal debit and credit sums.",
        formula: "Sum of Debits - Sum of Credits = ₹0.00 (Zero Variance)",
      },
      {
        label: "Chained Audit Hash",
        description: "Cryptographic proof that this record has not been altered or tampered with since creation.",
        formula: "Block[N] Hash = SHA-256(PrevHash + EntityID + Action + Timestamp + User)",
      },
    ],
    workflows: [
      {
        step: "1. Inspect Bank Payload",
        description: "Examine the raw bank memo, value date, transaction reference number, and payment channel.",
      },
      {
        step: "2. Verify Balanced Double-Entry Lines",
        description: "Ensure the debit leg (e.g. 6100 - Software Expense) matches the credit leg (e.g. 1010 - Operating Bank Account).",
      },
      {
        step: "3. Manual Re-Classification",
        description: "Click 'Edit Classification' to adjust vendor name, expense category, or Chart of Accounts code.",
      },
      {
        step: "4. Cryptographic Audit Chain",
        description: "Verify the sequential timeline of creation, rule application, dual sign-offs, and ledger posting.",
      },
    ],
    accountingInvariants: [
      "Balanced Vouchers Only: Unbalanced debit/credit allocations are rejected by database constraints.",
      "Immutable History: Previous audit blocks cannot be edited without invalidating subsequent SHA-256 hashes.",
    ],
    tips: [
      "Click 'View Full Audit Timeline' to see all related events across the ledger ecosystem.",
    ],
  },

  invoices: {
    id: "invoices",
    title: "Accounts Payable & OCR Invoice Extraction",
    badge: "AP Sub-Ledger",
    subtitle: "Vendor invoice OCR parsing, automated GST breakdown, payment status, and 3-way matching",
    overview:
      "The Invoices module acts as your Accounts Payable (AP) sub-ledger. Upload vendor invoices in PDF or image format to automatically extract vendor entities, GSTIN, line items, and tax breakdowns. Invoices are queued for settlement against corresponding bank debit transactions.",
    keyMetrics: [
      {
        label: "Accounts Payable Balance",
        description: "Total open liability owed to vendors for goods and services received but not yet cleared.",
        formula: "Open AP = Sum of all Unpaid and Overdue invoice totals",
      },
      {
        label: "GST Tax Breakdown",
        description: "Segregated Goods and Services Tax (CGST + SGST or IGST) eligible for Input Tax Credit (ITC).",
        formula: "Total Invoice = Subtotal (Base Cost) + Applicable GST (18% / 12% / 5%)",
      },
      {
        label: "Maker-Checker Sign-off Threshold",
        description: "Mandatory secondary review for any invoice exceeding ₹1,00,000 before disbursement authorization.",
        formula: "Dual Sign-off required if Invoice Total >= ₹1,00,000 INR",
      },
    ],
    workflows: [
      {
        step: "1. Upload Vendor Invoice",
        description: "Click 'Upload Invoice (PDF/OCR)' to drag-and-drop or select an invoice document. The OCR parser extracts all data fields.",
      },
      {
        step: "2. Review Extracted Line Items & Tax",
        description: "Verify vendor name, invoice reference number, due date, line item descriptions, and GST amounts.",
      },
      {
        step: "3. Dual Approval for High Value",
        description: "Invoices >= ₹1,00,000 require maker-checker approval before payment can be scheduled.",
      },
      {
        step: "4. Settle Against Bank Payment",
        description: "Head to the Reconciliation module or click 'Reconcile' to match the invoice with the clearing bank debit.",
      },
    ],
    accountingInvariants: [
      "Accounts Payable Recognition: Credited to 2010 (Accounts Payable) upon receipt; debited upon bank settlement.",
      "Input Tax Credit (ITC): GST is recorded under 1400 (Input Tax Credit Receivable) for tax offset.",
    ],
    tips: [
      "Try uploading sample AWS or Adobe invoices to see instant OCR parsing in action.",
      "Export the Accounts Payable aging schedule to Excel to optimize cash disbursements.",
    ],
  },

  reconciliation: {
    id: "reconciliation",
    title: "3-Way Fuzzy Bank & Invoice Reconciliation",
    badge: "Variance Zero Matcher",
    subtitle: "Multi-factor algorithm pairing bank debits with unpaid vendor invoices to eliminate orphan payables",
    overview:
      "The Reconciliation module pairs bank statement debit lines with open vendor invoices using a 4-factor weighted scoring algorithm. This verifies that money leaving your bank corresponds to a verified business invoice, settling the liability and ensuring zero variance across your sub-ledger and general ledger.",
    keyMetrics: [
      {
        label: "Composite Match Score Formula",
        description: "Multi-factor weighted confidence score evaluated across four distinct attributes.",
        formula: "Score = (0.35 * Amount) + (0.25 * Vendor) + (0.25 * RefCode) + (0.15 * DateWindow)",
      },
      {
        label: "Auto-Match Threshold (>= 85%)",
        description: "Matches with composite score >= 85% can be auto-cleared in bulk with zero manual intervention.",
        formula: "Score >= 85%: Auto-Matched; Score < 85%: Requires Controller Review",
      },
      {
        label: "Automation Rate",
        description: "Proportion of total bank debits successfully paired and settled against invoices without manual data entry.",
        formula: "Rate = (Auto-Matched Transactions / Total Bank Transactions) * 100",
      },
    ],
    workflows: [
      {
        step: "1. Run Auto-Reconciliation",
        description: "Click 'Run Auto-Reconciliation' to evaluate all unmatched bank debits against open vendor invoices.",
      },
      {
        step: "2. Inspect Match Candidates",
        description: "Review side-by-side factor breakdowns: Amount equality, Vendor name similarity, PO/Invoice reference match, and Date proximity.",
      },
      {
        step: "3. One-Click Confirmation",
        description: "Click 'Confirm Match' on review candidates to mark the invoice as Paid, reconcile the bank line, and post the clearing voucher.",
      },
      {
        step: "4. Export Reconciliation Report",
        description: "Generate a comprehensive audit report in Excel documenting all cleared matches and residual variances.",
      },
    ],
    accountingInvariants: [
      "Settlement Voucher: Debits Accounts Payable (2010) and Credits Cash at Bank (1010/1020).",
      "Variance Invariant: Reconciled transactions must have 0.00 delta between invoice net pay and bank debit.",
    ],
    tips: [
      "Matches with a green 95%+ badge represent exact amount and entity matches with matching invoice numbers.",
      "Click 'View Details' on any match row to inspect the full factor evaluation matrix.",
    ],
  },

  ledger: {
    id: "ledger",
    title: "General Ledger Core & Chart of Accounts",
    badge: "Double-Entry Invariant",
    subtitle: "Complete accounting engine: Journal Vouchers, Chart of Accounts, Trial Balance, P&L, Balance Sheet, Rules, and TDS",
    overview:
      "The General Ledger is the authoritative source of financial truth for the enterprise. Every transaction posts as a balanced journal voucher adhering strictly to Luca Pacioli's double-entry invariant: Assets = Liabilities + Equity, and Total Debits = Total Credits. Includes full Chart of Accounts, financial reporting, transaction routing rules, and vendor tax compliance.",
    keyMetrics: [
      {
        label: "General Ledger Equilibrium (Delta = ₹0.00)",
        description: "Mathematical requirement that the sum of all debit balances must equal the sum of all credit balances.",
        formula: "Sum(All Debits) - Sum(All Credits) = ₹0.0000 (Exact Zero)",
      },
      {
        label: "Accounting Equation",
        description: "Core balance sheet equation governing all balance sheet accounts.",
        formula: "Total Assets = Total Liabilities + Total Shareholders' Equity",
      },
      {
        label: "EBITDA & Net Profit",
        description: "Income statement performance: Total Operating Revenue minus Operating Expenses and Taxes.",
        formula: "Net Profit = Total Revenue (4000s) - Total Expenses (5000s, 6000s)",
      },
    ],
    workflows: [
      {
        step: "1. Sub-Tab Navigation",
        description: "Switch between Journal Entries, Chart of Accounts, Financial Statements, Rules Engine, and Vendor Tax / TDS.",
      },
      {
        step: "2. Create Manual Journal Vouchers",
        description: "Click 'New Journal Entry' to post adjusting or depreciation entries with multi-line debit/credit validation.",
      },
      {
        step: "3. Audit Trial Balance & Financials",
        description: "Verify that Trial Balance variance is ₹0.00, review the Income Statement (P&L), and audit the Balance Sheet.",
      },
      {
        step: "4. Configure Automated Rules & Tax",
        description: "Define pattern-based rules to auto-route recurring vendors, and track TDS Section 194C / 194J withholdings.",
      },
    ],
    accountingInvariants: [
      "Strict Invariance: Vouchers where Total Debits != Total Credits cannot be committed to SQLite.",
      "Standard COA Ranges: 1000s (Assets), 2000s (Liabilities), 3000s (Equity), 4000s (Revenue), 5000s/6000s (Expenses).",
      "TDS Compliance: Section 194C (1-2% contractor withholding), Section 194J (10% professional services withholding).",
    ],
    tips: [
      "Use the 'Financial Statements' tab to generate official auditor-ready Trial Balance and P&L statements.",
      "Export any view to Excel with structured formulas and formatting.",
    ],
  },

  copilot: {
    id: "copilot",
    title: "AI Financial Copilot & NL Query Engine",
    badge: "Zero-Hallucination AI",
    subtitle: "Conversational financial intelligence querying real-time SQLite database with verified invariants",
    overview:
      "The AI Financial Copilot connects advanced language models directly to the live SQLite ledger via a Python analytical engine. It converts natural language queries into exact database queries, verifying cash balances, vendor spend, tax obligations, and trial balance equilibrium with real figures and zero hallucination.",
    keyMetrics: [
      {
        label: "Minute-Synced Database State",
        description: "Every query accesses the latest committed transaction state from ledger.db with zero cached delay.",
        formula: "Live Context = Real-time SQLite snapshot (/api/ai/context)",
      },
      {
        label: "Double-Entry Invariant Guardrail",
        description: "The Copilot continuously validates that Total Debits equal Total Credits before answering financial questions.",
        formula: "Verified Invariant: Abs(Total_Debits - Total_Credits) < 0.01",
      },
    ],
    workflows: [
      {
        step: "1. Monitor Live Pulse Cards",
        description: "Check the top 4 status cards for instant liquidity, balance verification, unpaid bills, and transaction count.",
      },
      {
        step: "2. Select Instant Prompts",
        description: "Click any prompt chip (e.g. 'Liquid Cash', 'Runway', 'SaaS Spend', 'Unpaid Bills') for immediate structured analysis.",
      },
      {
        step: "3. Ask Custom Accounting Queries",
        description: "Ask detailed questions like 'What did we spend on AWS last month?' or 'Show all transactions requiring dual approval'.",
      },
      {
        step: "4. Sync Database or Reset Context",
        description: "Click 'Sync' after importing new statements to immediately refresh the Copilot's working memory.",
      },
    ],
    accountingInvariants: [
      "Zero Mock Data: Answers strictly cite real records from the SQLite database.",
      "Formatting Rule: Financial figures are rendered in bold markdown with standard INR currency notation.",
      "Invariant Enforcement: Answers proactively highlight any ledger variance if mathematical equilibrium is broken.",
    ],
    tips: [
      "Click any suggested prompt chip for an instant query without typing.",
      "Use the trash icon in the prompt bar to clear your conversation history at any time.",
    ],
  },
};
