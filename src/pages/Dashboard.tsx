import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Wallet,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Bot,
  RefreshCw,
  Clock,
  Layers,
  Send,
  HelpCircle,
  Database,
  Radio,
  Zap,
  Download,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { DashboardSummary, Transaction } from "../types";
import { fetchDashboardSummary, fetchTransactions, triggerRealtimeFeed } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import { downloadSampleExcelStatement } from "../lib/excel";
import { TransactionAnalysisModal } from "../components/modals/TransactionAnalysisModal";
import { PageInfoButton } from "../components/ui/PageInfoButton";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface DashboardProps {
  onNavigate: (path: string) => void;
  onOpenCsvImport: () => void;
  onOpenInvoiceUpload: () => void;
  onOpenResetModal?: () => void;
  theme?: "dark" | "light";
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenCsvImport,
  onOpenInvoiceUpload,
  onOpenResetModal,
  theme = "dark",
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamMessage, setStreamMessage] = useState<string | null>(null);
  const [copilotQuickQuery, setCopilotQuickQuery] = useState("");
  const [selectedDashboardTx, setSelectedDashboardTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, txRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchTransactions({ status: "ALL" }),
      ]);
      setData(summaryRes);
      setRecentTransactions(Array.isArray(txRes) ? txRes.slice(0, 6) : []);
    } catch (err) {
      console.error(err);
      setRecentTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerLiveFeed = async () => {
    setIsStreaming(true);
    setStreamMessage("Ingesting live bank transaction...");
    try {
      const res = await triggerRealtimeFeed(1);
      setStreamMessage(`Ingested: ${res.description} (₹${res.amount.toLocaleString()}) — Auto-categorized!`);
      // Reload live metrics immediately
      const [summaryRes, txRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchTransactions({ status: "ALL" }),
      ]);
      setData(summaryRes);
      setRecentTransactions(txRes.slice(0, 6));
      setTimeout(() => setStreamMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setStreamMessage("Failed to trigger live feed");
      setTimeout(() => setStreamMessage(null), 3000);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleQuickCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuickQuery.trim()) return;
    onNavigate(`/ai-copilot?q=${encodeURIComponent(copilotQuickQuery.trim())}`);
  };

  if (isLoading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 select-none">
      {/* Live Stream Toast Notification */}
      {streamMessage && (
        <div className="p-2.5 px-4 rounded-lg bg-emerald-950/90 text-emerald-300 border border-emerald-700 text-xs font-medium flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
            <span>{streamMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Header with Breadcrumb & Quick Ingestion Actions */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <PageInfoButton guideKey="dashboard" theme={theme} />
          <span className="text-[#71717a] font-normal text-xs sm:text-sm">/ September 2026</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Real-time Simulator Button */}
          <button
            id="btn-dash-stream-feed"
            onClick={handleTriggerLiveFeed}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${isStreaming ? "animate-spin" : ""}`} />
            <span>{isStreaming ? "Streaming..." : "Stream Live Transaction"}</span>
          </button>

          <button
            id="btn-dash-download-excel"
            onClick={downloadSampleExcelStatement}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] rounded-md text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
            title="Download test Excel statement file (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Sample Excel</span>
          </button>

          <button
            id="btn-dash-import-csv"
            onClick={onOpenCsvImport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] rounded-md text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Import Statement</span>
          </button>

          <button
            id="btn-dash-upload-inv"
            onClick={onOpenInvoiceUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] rounded-md text-xs font-semibold text-white transition-colors shadow-xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Upload Invoice</span>
          </button>

          {onOpenResetModal && (
            <button
              id="btn-dash-reset-app"
              onClick={onOpenResetModal}
              title="Reset Entire Application to Balanced Baseline State"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset System</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Four KPI Cards Row (High Density Metric Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Net Revenue */}
        <div className="bg-[#0c0d11] p-3.5 sm:p-4 rounded-lg border border-[#22242b] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#71717a] mb-1">
              <span>Net Revenue</span>
              <InfoTooltip text="Total recognized operating revenue across invoiced clients and direct bank credits." title="Net Revenue" theme={theme} />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.revenue, "INR")}
            </div>
          </div>
          <div className="text-[11px] text-[#34d399] font-medium flex items-center gap-1 mt-2">
            <span>↑ {data.revenueGrowth}%</span>
            <span className="text-[#71717a]">vs last month</span>
          </div>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-[#0c0d11] p-3.5 sm:p-4 rounded-lg border border-[#22242b] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#71717a] mb-1">
              <span>Total Expenses</span>
              <InfoTooltip text="Sum of all operating outflows (payroll, SaaS subscriptions, infrastructure, taxes)." title="Total Expenses" theme={theme} />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.expenses, "INR")}
            </div>
          </div>
          <div className="text-[11px] text-[#34d399] font-medium flex items-center gap-1 mt-2">
            <span>↓ {Math.abs(data.expensesGrowth)}%</span>
            <span className="text-[#71717a]">MoM reduction</span>
          </div>
        </div>

        {/* Card 3: Cash on Hand */}
        <div className="bg-[#0c0d11] p-3.5 sm:p-4 rounded-lg border border-[#22242b] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#71717a] mb-1">
              <span>Cash on Hand</span>
              <InfoTooltip text="Combined real-time liquid balance across HDFC Operating and ICICI Treasury bank accounts." title="Liquid Cash on Hand" formula="HDFC + ICICI balances" theme={theme} />
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(data.cash, "INR")}
            </div>
          </div>
          <div className="text-[11px] text-[#34d399] font-medium flex items-center gap-1 mt-2">
            <span>↑ {data.cashGrowth}%</span>
            <span className="text-[#71717a]">HDFC & ICICI treasury</span>
          </div>
        </div>

        {/* Card 4: AI Automation Rate */}
        <div className="bg-[#0c0d11] p-3.5 sm:p-4 rounded-lg border border-[#22242b] shadow-xs text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-[#818cf8] mb-1">
              <span>AI Automation Rate</span>
              <InfoTooltip text="Percentage of ingested bank statement transactions categorized by the AI engine with confidence >= 70%." title="Automation Rate" formula="(Auto-Processed Tx / Total Tx) * 100" theme={theme} />
            </div>
            <div className="text-2xl font-bold text-white">{data.automationRate}%</div>
          </div>
          <div>
            <div className="mt-2 h-1.5 w-full bg-[#14151c] rounded-full overflow-hidden border border-[#22242b]">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, data.automationRate))}%` }}
              ></div>
            </div>
            <div className="text-[10px] mt-1.5 text-[#a1a1aa] font-medium">
              {data.totalTransactionsProcessed.toLocaleString()} Transactions Auto-Processed
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 12-Column Grid (8 cols charts/tables + 4 cols Copilot/Needs Attention) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Revenue vs Expenses Chart Card */}
          <div className="bg-[#0c0d11] border border-[#22242b] rounded-lg p-4 flex flex-col shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">
                    Revenue vs Expenses
                  </span>
                  <InfoTooltip text="Monthly comparison of gross operating inflows versus operational debits." title="Operating Comparison" theme={theme} />
                </div>
                <p className="text-[11px] text-[#71717a]">Real-time accounting ledger aggregation (FY 2026)</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#a1a1aa] text-[11px]">
                  <span className="w-2 h-2 rounded bg-[#38bdf8]"></span> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-[#a1a1aa] text-[11px]">
                  <span className={`w-2 h-2 rounded ${theme === "light" ? "bg-slate-400" : "bg-[#3f3f46]"}`}></span> Expenses
                </span>
              </div>
            </div>

            <div className="h-48 sm:h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyTrends || []} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={theme === "light" ? "#e2e8f0" : "#1e2029"} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: theme === "light" ? "#64748b" : "#71717a", fontFamily: 'Poppins, sans-serif' }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: theme === "light" ? "#64748b" : "#71717a", fontFamily: 'Poppins, sans-serif' }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    cursor={{ fill: theme === "light" ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.06)", radius: 4 }}
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value), "INR"),
                      name === "revenue" ? "Revenue" : "Expenses",
                    ]}
                    labelStyle={{ color: theme === "light" ? "#0f172a" : "#ffffff", fontWeight: "600", marginBottom: "4px" }}
                    itemStyle={{ color: theme === "light" ? "#334155" : "#d4d4d8", fontSize: "11px", padding: "2px 0" }}
                    contentStyle={{
                      fontFamily: "Poppins, sans-serif",
                      borderRadius: "8px",
                      backgroundColor: theme === "light" ? "#ffffff" : "#0c0d11",
                      border: theme === "light" ? "1px solid #cbd5e1" : "1px solid #272935",
                      boxShadow: theme === "light" ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
                      color: theme === "light" ? "#0f172a" : "#ffffff",
                      fontSize: "11px",
                      padding: "8px 12px",
                    }}
                  />
                  <Bar dataKey="revenue" fill={theme === "light" ? "#0284c7" : "#38bdf8"} radius={[3, 3, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="expenses" fill={theme === "light" ? "#94a3b8" : "#3f3f46"} radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent High-Confidence Predictions Table Card */}
          <div className="bg-[#0c0d11] border border-[#22242b] rounded-lg overflow-hidden flex flex-col shadow-xs">
            <div className="px-4 py-2.5 border-b border-[#1e2029] flex justify-between items-center bg-[#050507]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  Recent High-Confidence Predictions
                </span>
                <InfoTooltip text="Transactions categorized by the AI classification engine with >= 90% confidence score." title="Auto-Categorized Feed" theme={theme} />
                <span className="text-[10px] text-[#34d399] bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium border border-emerald-500/30">
                  Live Database Stream
                </span>
              </div>
              <button
                onClick={() => onNavigate("/transactions")}
                className="text-[11px] text-[#38bdf8] hover:underline font-medium cursor-pointer flex items-center gap-1"
              >
                <span>View all feed</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-[#71717a] font-medium bg-[#050507] border-b border-[#1e2029]">
                  <tr>
                    <th className="px-3.5 py-2 font-medium">Description</th>
                    <th className="px-3.5 py-2 font-medium">AI Prediction</th>
                    <th className="px-3.5 py-2 font-medium">Confidence</th>
                    <th className="px-3.5 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029]">
                  {recentTransactions.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedDashboardTx(row)}
                      className="hover:bg-[#14151c] transition-colors cursor-pointer"
                      title="Click to inspect AI classification analysis & ledger voucher"
                    >
                      <td className="px-3.5 py-2 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-indigo-500/10 text-[#818cf8] border-indigo-500/30">
                            {row.category || "General"}
                          </span>
                          <span className="truncate max-w-[200px] sm:max-w-md lg:max-w-xl">{row.description}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2 text-[#a1a1aa] font-medium text-[11px]">
                        GL {row.glAccount || "6100"} · {row.vendor || "Verified"}
                      </td>
                      <td className="px-3.5 py-2">
                        <span className="text-[#34d399] bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold text-[10px] border border-emerald-500/30">
                          {Math.round((row.confidence || 0.95) * 100)}%
                        </span>
                      </td>
                      <td className="px-3.5 py-2 font-semibold text-white text-right">
                        {formatCurrency(row.amount, "INR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Needs Attention Card */}
          <div
            className={cn(
              "rounded-lg p-3.5 sm:p-4 flex flex-col gap-2.5 shadow-xs border transition-colors",
              theme === "light"
                ? "bg-amber-50/90 border-amber-200 text-slate-900"
                : "bg-[#181206] border-[#d97706]/30 text-white"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertTriangle
                  className={cn("w-4 h-4", theme === "light" ? "text-amber-600" : "text-[#fbbf24]")}
                />
                <span
                  className={cn(
                    "text-xs font-semibold",
                    theme === "light" ? "text-amber-900" : "text-[#fbbf24]"
                  )}
                >
                  Needs Attention
                </span>
                <InfoTooltip text="Items flagged for controller intervention: maker-checker dual approvals, low AI confidence, or invoice variances." title="Controller Review Queue" theme={theme} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                  theme === "light"
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-amber-500/20 text-[#fbbf24] border-amber-500/30"
                )}
              >
                {data.attentionCounts.transactionsReview + data.attentionCounts.invoiceMismatches} items
              </span>
            </div>

            <div className="space-y-2">
              <div
                onClick={() => onNavigate("/transactions?status=REVIEW")}
                className={cn(
                  "p-2 rounded-md shadow-xs flex justify-between items-center text-[11px] font-medium transition-colors cursor-pointer border",
                  theme === "light"
                    ? "bg-white border-amber-200/90 hover:border-amber-400 text-slate-900"
                    : "bg-[#0c0d11] border-[#2e230d] hover:border-amber-500/50 text-white"
                )}
              >
                <div>
                  <div className={cn("font-medium", theme === "light" ? "text-slate-900" : "text-white")}>
                    Low-Confidence Predictions
                  </div>
                  <div className={cn("text-[10px]", theme === "light" ? "text-slate-500" : "text-[#71717a]")}>
                    {data.attentionCounts.transactionsReview} items require human verification
                  </div>
                </div>
                <button
                  className={cn(
                    "text-[10px] border px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors",
                    theme === "light"
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      : "bg-amber-500/15 text-[#fbbf24] border-amber-500/30 hover:bg-amber-500/25"
                  )}
                >
                  Review
                </button>
              </div>

              <div
                onClick={() => onNavigate("/invoices?status=REVIEW")}
                className={cn(
                  "p-2 rounded-md shadow-xs flex justify-between items-center text-[11px] font-medium transition-colors cursor-pointer border",
                  theme === "light"
                    ? "bg-white border-amber-200/90 hover:border-amber-400 text-slate-900"
                    : "bg-[#0c0d11] border-[#2e230d] hover:border-amber-500/50 text-white"
                )}
              >
                <div>
                  <div className={cn("font-medium", theme === "light" ? "text-slate-900" : "text-white")}>
                    Invoice Discrepancies
                  </div>
                  <div className={cn("text-[10px]", theme === "light" ? "text-slate-500" : "text-[#71717a]")}>
                    {data.attentionCounts.invoiceMismatches} vendor mismatch flagged
                  </div>
                </div>
                <button
                  className={cn(
                    "text-[10px] border px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors",
                    theme === "light"
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      : "bg-amber-500/15 text-[#fbbf24] border-amber-500/30 hover:bg-amber-500/25"
                  )}
                >
                  Review
                </button>
              </div>

              <div
                onClick={() => onNavigate("/reconciliation")}
                className={cn(
                  "p-2 rounded-md shadow-xs flex justify-between items-center text-[11px] font-medium transition-colors cursor-pointer border",
                  theme === "light"
                    ? "bg-white border-amber-200/90 hover:border-amber-400 text-slate-900"
                    : "bg-[#0c0d11] border-[#2e230d] hover:border-amber-500/50 text-white"
                )}
              >
                <div>
                  <div className={cn("font-medium", theme === "light" ? "text-slate-900" : "text-white")}>
                    Unmatched Inflows
                  </div>
                  <div className={cn("text-[10px]", theme === "light" ? "text-slate-500" : "text-[#71717a]")}>
                    {data.attentionCounts.unmatchedPayments} deposits pending match
                  </div>
                </div>
                <button
                  className={cn(
                    "text-[10px] border px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors",
                    theme === "light"
                      ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      : "bg-amber-500/15 text-[#fbbf24] border-amber-500/30 hover:bg-amber-500/25"
                  )}
                >
                  Match
                </button>
              </div>
            </div>
          </div>

          {/* Embedded High-Density Copilot Widget */}
          <div
            className={cn(
              "rounded-lg p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden relative shadow-xs border transition-colors",
              theme === "light"
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-[#0c0d11] border-[#22242b] text-white"
            )}
          >
            <div>
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold mb-2",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>AI Accounting Copilot</span>
              </div>
              <p
                className={cn(
                  "text-[11px] mb-3 leading-relaxed",
                  theme === "light" ? "text-slate-600" : "text-[#a1a1aa]"
                )}
              >
                Ask queries across double-entry general ledger, burn rate, and vendor discrepancies.
              </p>

              {/* Sample Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => onNavigate("/ai-copilot?q=What was our cloud spend growth in Q2?")}
                  className={cn(
                    "text-[10px] border px-2 py-1 rounded-md transition-colors text-left font-normal",
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                      : "bg-[#14151c] hover:bg-[#1e2029] border-[#22242b] text-[#d4d4d8]"
                  )}
                >
                  "Cloud spend growth in Q2?"
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("/ai-copilot?q=Draft an accrual journal entry for prepaid insurance")}
                  className={cn(
                    "text-[10px] border px-2 py-1 rounded-md transition-colors text-left font-normal",
                    theme === "light"
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                      : "bg-[#14151c] hover:bg-[#1e2029] border-[#22242b] text-[#d4d4d8]"
                  )}
                >
                  "Draft accrual journal entry"
                </button>
              </div>
            </div>

            <form onSubmit={handleQuickCopilotSubmit} className="relative mt-1">
              <input
                type="text"
                placeholder="Ask Copilot a question..."
                value={copilotQuickQuery}
                onChange={(e) => setCopilotQuickQuery(e.target.value)}
                className={cn(
                  "w-full rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#3b82f6] pr-8 border font-normal",
                  theme === "light"
                    ? "bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400"
                    : "bg-[#050507] border-[#22242b] text-white placeholder-[#71717a]"
                )}
              />
              <button
                type="submit"
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer",
                  theme === "light" ? "text-slate-500 hover:text-slate-900" : "text-[#71717a] hover:text-white"
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Major Expense Breakdown */}
          <div
            className={cn(
              "rounded-lg p-3.5 sm:p-4 shadow-xs flex flex-col justify-between border transition-colors",
              theme === "light"
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-[#0c0d11] border-[#22242b]"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={cn(
                  "text-xs font-semibold",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}
              >
                Expense Breakdown
              </span>
              <button
                onClick={() => onNavigate("/ledger")}
                className="text-[11px] text-[#38bdf8] hover:underline font-medium cursor-pointer"
              >
                General Ledger →
              </button>
            </div>

            <div className="space-y-2 mt-1">
              {(data?.categoryBreakdown || []).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span
                      className={cn(
                        "font-medium text-[11px]",
                        theme === "light" ? "text-slate-700" : "text-[#d4d4d8]"
                      )}
                    >
                      {cat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px]",
                        theme === "light" ? "text-slate-500" : "text-[#71717a]"
                      )}
                    >
                      {formatCurrency(cat.amount, "INR")}
                    </span>
                    <span
                      className={cn(
                        "font-bold text-[11px] w-8 text-right",
                        theme === "light" ? "text-slate-900" : "text-white"
                      )}
                    >
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive In-Depth Transaction AI Analysis Modal */}
      <TransactionAnalysisModal
        isOpen={Boolean(selectedDashboardTx)}
        transaction={selectedDashboardTx}
        onClose={() => setSelectedDashboardTx(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
};

