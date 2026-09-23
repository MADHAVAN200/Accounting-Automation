import {
  Account,
  CopilotMessage,
  DashboardSummary,
  Invoice,
  JournalEntry,
  ReconciliationMatch,
  Transaction,
  User,
  IncomeStatement,
  BalanceSheet,
  PostingRule,
  ConfidencePolicy,
  RuleSimulationResult,
  AnomalyReport,
  ExchangeRate,
  FxGainLossCalculation,
  AuditTimelineRecord,
  VendorProfile,
  TdsCalculationResult,
  GstItcSummary,
} from "../types";

/**
 * Safe JSON fetch utility that prevents SyntaxError: Unexpected token '<'
 * when an endpoint or proxy returns HTML.
 */
async function safeJsonFetch<T = any>(
  input: string,
  init?: RequestInit,
  fallbackErrMsg: string = "Request failed"
): Promise<T> {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.toLowerCase().includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `${fallbackErrMsg}: HTTP ${res.status}`);
    }
    await res.text().catch(() => "");
    throw new Error(`${fallbackErrMsg}: HTTP ${res.status}`);
  }

  if (!isJson) {
    await res.text().catch(() => "");
    throw new Error(`${fallbackErrMsg}: Expected JSON response from server`);
  }

  return await res.json();
}

function buildQueryUrl(path: string, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      sp.set(k, v);
    }
  }
  const q = sp.toString();
  return q ? `${path}?${q}` : path;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return safeJsonFetch<DashboardSummary>("/api/dashboard/summary", undefined, "Failed to fetch dashboard summary");
}

export async function fetchTransactions(params?: {
  status?: string;
  type?: string;
  search?: string;
}): Promise<Transaction[]> {
  const url = buildQueryUrl("/api/transactions", {
    status: params?.status,
    type: params?.type,
    search: params?.search,
  });
  return safeJsonFetch<Transaction[]>(url, undefined, "Failed to fetch transactions");
}

export async function fetchTransactionById(id: string): Promise<Transaction | null> {
  try {
    return await safeJsonFetch<Transaction>(`/api/transactions/${encodeURIComponent(id)}`, undefined, "Failed to retrieve transaction");
  } catch (err: any) {
    if (err.message?.includes("HTTP 404")) return null;
    throw err;
  }
}

export async function importCsvTransactions(
  csvRows: Array<{ date: string; description: string; amount: number | string; currency?: string }>
): Promise<{ importedCount: number; duplicatesSkipped: number; transactions: any[] }> {
  return safeJsonFetch(
    "/api/transactions/import",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvRows }),
    },
    "Failed to import CSV"
  );
}

export async function approveTransaction(id: string): Promise<{ success: boolean; journalEntryId: string }> {
  return safeJsonFetch(
    `/api/transactions/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
    "Approval failed"
  );
}

export async function editTransaction(
  id: string,
  payload: { vendor: string; category: string; glAccount: string }
): Promise<{ success: boolean }> {
  return safeJsonFetch(
    `/api/transactions/${encodeURIComponent(id)}/edit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Edit failed"
  );
}

export async function rejectTransaction(id: string): Promise<{ success: boolean }> {
  return safeJsonFetch(
    `/api/transactions/${encodeURIComponent(id)}/reject`,
    { method: "POST" },
    "Reject failed"
  );
}

export async function addTransaction(payload: {
  date: string;
  description: string;
  amount: number;
  currency?: string;
  type?: string;
  paymentMethod?: string;
}): Promise<{ id: string; status: string; transaction: Transaction }> {
  return safeJsonFetch(
    "/api/transactions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to add transaction"
  );
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const data = await safeJsonFetch<any[]>("/api/invoices", undefined, "Failed to fetch invoices");
  if (!Array.isArray(data)) return [];
  return data.map((inv: any) => ({
    ...inv,
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || inv.invoice_number || "",
    vendorName: inv.vendorName || inv.vendor_name || "Unknown Vendor",
    customerName: inv.customerName || inv.customer_name || "LedgerAI Tech",
    invoiceDate: inv.invoiceDate || inv.invoice_date || "",
    dueDate: inv.dueDate || inv.due_date || "",
    currency: inv.currency || "INR",
    subtotal: Number(inv.subtotal || 0),
    tax: Number(inv.tax || 0),
    total: Number(inv.total || 0),
    status: inv.status || "OPEN",
    lineItems: Array.isArray(inv.lineItems) ? inv.lineItems : [],
  }));
}

export async function uploadInvoice(payload: {
  rawText?: string;
  filename?: string;
  customVendor?: string;
  customTotal?: number;
}): Promise<{ id: string; extractedData: any; message: string }> {
  return safeJsonFetch(
    "/api/invoices/upload",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to upload invoice"
  );
}

export async function fetchReconciliation(): Promise<{
  totalBankTransactions: number;
  automaticallyMatched: number;
  automationRate: number;
  needsReview: number;
  unmatched: number;
  matches: ReconciliationMatch[];
}> {
  return safeJsonFetch("/api/reconciliation", undefined, "Failed to fetch reconciliation");
}

export async function confirmReconciliationMatch(id: string): Promise<{ success: boolean }> {
  return safeJsonFetch(
    `/api/reconciliation/${encodeURIComponent(id)}/confirm`,
    { method: "POST" },
    "Match confirmation failed"
  );
}

export async function autoRunReconciliation(): Promise<{ success: boolean; newMatchesFound: number }> {
  return safeJsonFetch(
    "/api/reconciliation/auto-run",
    { method: "POST" },
    "Auto match execution failed"
  );
}

export async function fetchAccounts(): Promise<Account[]> {
  return safeJsonFetch<Account[]>("/api/accounts", undefined, "Failed to fetch accounts");
}

export async function fetchGeneralLedger(accountCode?: string): Promise<{
  accountCode: string;
  lines: any[];
  journalEntries: JournalEntry[];
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
  isBalanced: boolean;
}> {
  const url = buildQueryUrl("/api/ledger", { accountCode });
  return safeJsonFetch(url, undefined, "Failed to fetch general ledger");
}

export async function createJournalEntry(payload: {
  date: string;
  description: string;
  lines: Array<{ accountCode: string; accountName?: string; debit: number; credit: number; description?: string }>;
}): Promise<{ success: boolean; entryNumber: string; message: string }> {
  return safeJsonFetch(
    "/api/ledger/journal-entries",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to create journal entry"
  );
}

export async function triggerRealtimeFeed(count: number = 1): Promise<any> {
  return safeJsonFetch(
    "/api/realtime/feed",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    },
    "Failed to trigger real-time feed"
  );
}

export async function fetchRealtimeStatus(): Promise<any> {
  return safeJsonFetch("/api/realtime/status", undefined, "Failed to fetch realtime status");
}

export async function sendCopilotChat(question: string): Promise<CopilotMessage> {
  const data = await safeJsonFetch<{ content: string; data?: any }>(
    "/api/ai/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    },
    "AI query failed"
  );
  return {
    id: `cop-${Date.now()}`,
    role: "assistant",
    content: data.content,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    data: data.data,
  };
}

export async function fetchCopilotContext(): Promise<any> {
  return safeJsonFetch("/api/ai/context", undefined, "Failed to fetch copilot context");
}

export async function resetApplication(): Promise<{ success: boolean; message: string }> {
  return safeJsonFetch(
    "/api/system/reset",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    "Failed to reset application"
  );
}

// 1. Financial Statements
export async function fetchIncomeStatement(period: string = "FY2026"): Promise<IncomeStatement> {
  const url = `/api/statements/income?period=${encodeURIComponent(period)}`;
  return safeJsonFetch<IncomeStatement>(url, undefined, "Failed to fetch income statement");
}

export async function fetchBalanceSheet(): Promise<BalanceSheet> {
  return safeJsonFetch<BalanceSheet>("/api/statements/balance", undefined, "Failed to fetch balance sheet");
}

// 2. Posting Rules & Simulation
export async function fetchPostingRules(): Promise<PostingRule[]> {
  return safeJsonFetch<PostingRule[]>("/api/rules", undefined, "Failed to fetch posting rules");
}

export async function createPostingRule(rule: Partial<PostingRule>): Promise<{ success: boolean; id: string; message: string }> {
  return safeJsonFetch(
    "/api/rules",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    },
    "Failed to create rule"
  );
}

export async function deletePostingRule(id: string): Promise<{ success: boolean; message: string }> {
  return safeJsonFetch(
    `/api/rules/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete rule"
  );
}

export async function togglePostingRule(id: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
  return safeJsonFetch(
    `/api/rules/${encodeURIComponent(id)}/toggle`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    },
    "Failed to toggle rule"
  );
}

export async function simulatePostingRules(days: number = 90): Promise<RuleSimulationResult> {
  return safeJsonFetch(
    "/api/rules/simulate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    },
    "Failed to simulate rules"
  );
}

export async function fetchConfidencePolicies(): Promise<ConfidencePolicy> {
  return safeJsonFetch<ConfidencePolicy>("/api/policies", undefined, "Failed to fetch confidence policies");
}

export async function updateConfidencePolicies(data: Partial<ConfidencePolicy>): Promise<{ success: boolean; message: string }> {
  return safeJsonFetch(
    "/api/policies",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to update policies"
  );
}

// 3. Anomaly & Duplicate Expense Detection
export async function fetchAnomaliesReport(): Promise<AnomalyReport> {
  return safeJsonFetch<AnomalyReport>("/api/anomalies", undefined, "Failed to fetch anomaly report");
}

// 4. Multi-Currency & FX
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  return safeJsonFetch<ExchangeRate[]>("/api/currency/rates", undefined, "Failed to fetch exchange rates");
}

export async function calculateFxGainLoss(data: {
  invoiceId: string;
  settlementRate?: number;
  settlementInr?: number;
}): Promise<FxGainLossCalculation> {
  return safeJsonFetch(
    "/api/currency/fx-calc",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to calculate FX variance"
  );
}

// 5. Maker-Checker & Dual Approval & Audit Timeline
export async function processDualApproval(data: {
  entityType: "TRANSACTION" | "INVOICE";
  entityId: string;
  userName?: string;
  userRole?: string;
  threshold?: number;
}): Promise<{ success: boolean; newStatus: string; message: string }> {
  return safeJsonFetch(
    "/api/approvals/process",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to process dual approval"
  );
}

export async function fetchAuditTimeline(entityId?: string): Promise<AuditTimelineRecord[]> {
  const url = entityId && entityId !== "ALL"
    ? `/api/approvals/timeline?entityId=${encodeURIComponent(entityId)}`
    : "/api/approvals/timeline";
  return safeJsonFetch<AuditTimelineRecord[]>(url, undefined, "Failed to fetch audit timeline");
}

// 6. Vendor Intelligence & Tax Withholding
export async function fetchVendorIntelligence(): Promise<{
  totalVendors: number;
  totalYtdSpend: number;
  totalTdsWithheld: number;
  vendors: VendorProfile[];
}> {
  return safeJsonFetch("/api/vendors", undefined, "Failed to fetch vendor intelligence");
}

export async function calculateTds(data: {
  amount: number;
  section?: string;
  isCompany?: boolean;
}): Promise<TdsCalculationResult> {
  return safeJsonFetch(
    "/api/tax/tds-calc",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to calculate TDS"
  );
}

export async function fetchGstItcSummary(): Promise<GstItcSummary> {
  return safeJsonFetch<GstItcSummary>("/api/tax/gst-itc", undefined, "Failed to fetch GST ITC summary");
}
