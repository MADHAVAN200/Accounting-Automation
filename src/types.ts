export type TransactionStatus = "categorized" | "review" | "matched" | "unmatched";
export type TransactionType = "expense" | "revenue" | "transfer";
export type InvoiceStatus = "OPEN" | "MATCHED" | "PAID" | "REVIEW";
export type JournalEntryStatus = "DRAFT" | "POSTED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  balance: number;
  currency: string;
  description?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  rawText?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  vendor?: string;
  customer?: string;
  category: string;
  glAccount: string;
  glAccountName?: string;
  confidence: number;
  aiExplanation?: string[];
  suggestedDebitAccount: string;
  suggestedDebitAccountName?: string;
  suggestedCreditAccount: string;
  suggestedCreditAccountName?: string;
  paymentMethod: string;
  matchedInvoiceId?: string;
  matchedInvoiceNumber?: string;
  journalEntryId?: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccount?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId?: string;
  vendorName: string;
  customerName?: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  pdfFilename?: string;
  lineItems?: InvoiceItem[];
  matchedTransactionId?: string;
  matchScore?: number;
  notes?: string;
  createdAt?: string;
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  sourceType: "TRANSACTION" | "INVOICE" | "MANUAL";
  sourceId?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export interface ReconciliationMatch {
  id: string;
  transactionId: string;
  transaction: Transaction;
  invoiceId: string;
  invoice: Invoice;
  overallScore: number;
  vendorScore: number;
  amountScore: number;
  dateScore: number;
  referenceScore: number;
  currencyScore: number;
  semanticScore: number;
  status: "AUTO_MATCHED" | "NEEDS_REVIEW" | "UNMATCHED" | "CONFIRMED";
  reasons: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  prevState?: string;
  newState?: string;
}

export interface DashboardSummary {
  revenue: number;
  revenueGrowth: number;
  expenses: number;
  expensesGrowth: number;
  cash: number;
  cashGrowth: number;
  totalTransactionsProcessed: number;
  aiCategorizedCount: number;
  autoMatchedCount: number;
  automationRate: number;
  attentionCounts: {
    transactionsReview: number;
    invoiceMismatches: number;
    unmatchedPayments: number;
  };
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    cashFlow: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  data?: {
    type?: "breakdown" | "transactions" | "summary" | "sql";
    title?: string;
    metrics?: Array<{ label: string; value: string; change?: string; highlight?: boolean }>;
    transactions?: Partial<Transaction>[];
    chartData?: Array<{ name: string; value: number }>;
    sqlQuery?: string;
    actionLink?: {
      label: string;
      path: string;
    };
  };
}

// 1. Financial Statements
export interface IncomeStatement {
  period: string;
  fiscalYear: string;
  currency: string;
  generatedAt: string;
  revenue: {
    totalRevenue: number;
    lineItems: Array<{ accountCode: string; name: string; amount: number; pctOfRevenue: number }>;
  };
  cogs: {
    totalCogs: number;
    grossProfit: number;
    grossMarginPct: number;
    lineItems: Array<{ accountCode: string; name: string; amount: number; pctOfRevenue: number }>;
  };
  operatingExpenses: {
    totalOpex: number;
    ebitda: number;
    operatingMarginPct: number;
    lineItems: Array<{ accountCode: string; name: string; amount: number; pctOfRevenue: number }>;
  };
  taxesAndNet: {
    statutoryTaxes: number;
    netIncome: number;
    netMarginPct: number;
  };
}

export interface BalanceSheet {
  asOfDate: string;
  currency: string;
  isBalanced: boolean;
  variance: number;
  assets: {
    totalAssets: number;
    currentAssets: {
      total: number;
      lineItems: Array<{ code: string; name: string; amount: number }>;
    };
    nonCurrentAssets: {
      total: number;
      lineItems: Array<{ code: string; name: string; amount: number }>;
    };
  };
  liabilities: {
    totalLiabilities: number;
    currentLiabilities: {
      total: number;
      lineItems: Array<{ code: string; name: string; amount: number }>;
    };
    longTermLiabilities: {
      total: number;
      lineItems: Array<{ code: string; name: string; amount: number }>;
    };
  };
  equity: {
    totalEquity: number;
    lineItems: Array<{ code: string; name: string; amount: number }>;
  };
  summaryIdentity: {
    totalAssets: number;
    totalLiabilitiesAndEquity: number;
    difference: number;
    equation: string;
  };
}

// 2. Custom Posting Rules & Policies
export interface PostingRule {
  id: string;
  name: string;
  conditionField: "description" | "vendor" | "amount" | "payment_method";
  conditionOperator: "contains" | "equals" | "starts_with" | "greater_than" | "less_than";
  conditionValue: string;
  minAmount: number;
  maxAmount: number;
  targetCategory: string;
  targetGlAccount: string;
  autoApprove: boolean;
  priority: number;
  isActive: boolean;
  matchCount: number;
  createdAt: string;
}

export interface ConfidencePolicy {
  autoPostThreshold: number;
  reviewThreshold: number;
  dualApprovalThreshold: number;
  isDualApprovalEnabled: boolean;
}

export interface RuleSimulationResult {
  daysSimulated: number;
  totalTransactions: number;
  activeRulesCount: number;
  rulesMatchedCount: number;
  projectedAutoApproved: number;
  projectedReviewQueue: number;
  automationRate: number;
  sampleMatches: Array<{
    transactionId: string;
    date: string;
    description: string;
    amount: number;
    previousCategory: string;
    newCategory: string;
    ruleName: string;
    action: string;
  }>;
}

// 3. Anomaly & Duplicate Expense Detection
export interface AnomalyReport {
  healthScore: number;
  totalAnomaliesDetected: number;
  duplicateInvoicesCount: number;
  outlierSpendCount: number;
  offHoursCount: number;
  duplicateInvoices: Array<{
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    invoiceId: string;
    invoiceNumber: string;
    vendorName: string;
    amount: number;
    date: string;
    matchedWithId: string;
    reason: string;
    recommendation: string;
  }>;
  outlierTransactions: Array<{
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    transactionId: string;
    date: string;
    description: string;
    vendor: string;
    amount: number;
    baselineAverage: number;
    variancePercent: number;
    reason: string;
    recommendation: string;
  }>;
  offHourTransactions: Array<{
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    transactionId: string;
    date: string;
    dayOfWeek: string;
    description: string;
    vendor: string;
    amount: number;
    reason: string;
    recommendation: string;
  }>;
  checkedAt: string;
}

// 4. Multi-Currency & FX
export interface ExchangeRate {
  currency: string;
  symbol: string;
  rateToInr: number;
  spread: string;
  lastUpdated: string;
}

export interface FxGainLossCalculation {
  invoiceId: string;
  invoiceNumber: string;
  vendorName: string;
  foreignCurrency: string;
  foreignAmount: number;
  bookingExchangeRate: number;
  bookedInr: number;
  settlementExchangeRate: number;
  settledInr: number;
  isFxGain: boolean;
  fxVariance: number;
  glRouting: string;
  balancingJournalLegs: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    note: string;
  }>;
}

// 5. Maker-Checker & Dual Approval & Audit Timeline
export interface AuditTimelineRecord {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  action: string;
  userName: string;
  userRole: string;
  prevStatus?: string;
  newStatus?: string;
  details: string;
  ipAddress?: string;
  hashChecksum?: string;
}

// 6. Vendor Intelligence & Tax Withholding
export interface VendorProfile {
  id: string;
  name: string;
  panGstin: string;
  category: string;
  defaultGlAccount: string;
  paymentTerms: string;
  tdsSection: string;
  tdsRate: number;
  gstRate: number;
  totalBilled: number;
  totalPaid: number;
  outstandingPayable: number;
  pendingInvoicesCount: number;
  estimatedTdsWithheld: number;
  contractEndDate: string;
  status: string;
  contactEmail: string;
}

export interface TdsCalculationResult {
  grossAmount: number;
  tdsSection: string;
  tdsSectionName: string;
  applicableRate: number;
  tdsWithheld: number;
  netPayableToVendor: number;
  statutoryGlRouting: {
    vendorPayableCredit: number;
    tdsLiabilityAccount: string;
    tdsCredit: number;
  };
}

export interface GstItcSummary {
  totalInputGstRecorded: number;
  gstr2bMatchedItc: number;
  pendingItcReview: number;
  complianceRate: number;
  itcRecords: Array<{
    invoiceNumber: string;
    vendorName: string;
    invoiceDate: string;
    taxableValue: number;
    inputGstAmount: number;
    gstr2bStatus: string;
    itcEligible: boolean;
    notes: string;
  }>;
}
