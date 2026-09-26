import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  FileSpreadsheet,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Eye,
  Check,
  Building2,
  ChevronRight,
  Radio,
  Download,
  Sliders,
  Shield,
  Globe,
  CreditCard,
} from "lucide-react";
import { Transaction } from "../types";
import { fetchTransactions, approveTransaction, triggerRealtimeFeed, processDualApproval } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import { exportDataToExcel, downloadSampleExcelStatement } from "../lib/excel";
import { CustomSelect } from "../components/ui/CustomSelect";
import { TransactionAnalysisModal } from "../components/modals/TransactionAnalysisModal";
import { RulesBuilderView } from "../components/rules/RulesBuilderView";
import { AnomalyAlertBanner } from "../components/anomalies/AnomalyAlertBanner";
import { AuditTimelineModal } from "../components/modals/AuditTimelineModal";
import { FxCalculationModal } from "../components/modals/FxCalculationModal";
import { ModuleHeader } from "../components/layout/ModuleHeader";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface TransactionsProps {
  onNavigate: (path: string) => void;
  onOpenCsvImport: () => void;
  onOpenAddTransaction: () => void;
  initialStatusFilter?: string;
  initialSearch?: string;
  initialTab?: "transactions" | "rules";
}

export const Transactions: React.FC<TransactionsProps> = ({
  onNavigate,
  onOpenCsvImport,
  onOpenAddTransaction,
  initialStatusFilter = "ALL",
  initialSearch = "",
  initialTab = "transactions",
}) => {
  const [activeTab, setActiveTab] = useState<"transactions" | "rules">(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedTxForAnalysis, setSelectedTxForAnalysis] = useState<Transaction | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedEntityForAudit, setSelectedEntityForAudit] = useState<string>("ALL");
  const [fxModalOpen, setFxModalOpen] = useState(false);
  const [selectedTxForFx, setSelectedTxForFx] = useState<Transaction | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as "transactions" | "rules";
    setActiveTab(nextTab);
    onNavigate(nextTab === "rules" ? "/rules" : "/transactions");
  };

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    loadTransactions();
  }, [statusFilter, typeFilter, search]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTransactions({
        status: statusFilter,
        type: typeFilter,
        search,
      });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamLive = async () => {
    setIsStreaming(true);
    try {
      const newTx = await triggerRealtimeFeed(1);
      setActionSuccess(`Live Transaction Streamed: ${newTx.description} (₹${newTx.amount.toLocaleString()}) — Auto-categorized!`);
      setTimeout(() => setActionSuccess(null), 5000);
      await loadTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleQuickApprove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await approveTransaction(id);
      setActionSuccess(`Transaction approved & Journal Entry #${res.journalEntryId} generated!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadTransactions();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDualApprove = async (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation();
    try {
      const res = await processDualApproval({
        entityType: "TRANSACTION",
        entityId: tx.id,
        userName: "Financial Controller",
        userRole: "CONTROLLER",
        threshold: 100000,
      });
      setActionSuccess(`Dual Sign-off Verified: ${res.message}`);
      setTimeout(() => setActionSuccess(null), 5000);
      loadTransactions();
    } catch (err: any) {
      console.error(err);
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const totalCount = safeTransactions.length;
  const reviewCount = safeTransactions.filter((t) => t.status === "review").length;
  const categorizedCount = safeTransactions.filter((t) => t.status === "categorized" || t.status === "matched").length;
  const categorizedRate = totalCount > 0 ? Math.round((categorizedCount / totalCount) * 100) : 100;
  const netCashFlow = safeTransactions.reduce((acc, t) => acc + (t.type === "revenue" ? (Number(t.amount) || 0) : -(Number(t.amount) || 0)), 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 select-none">
      {/* Top Banner Alert on action */}
      {actionSuccess && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-[#34d399] hover:text-white font-bold px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Module Header without Sub-Navigation Tab Bar */}
      <ModuleHeader
        title={activeTab === "rules" ? "Auto-Posting Rules & Policies" : "Bank Transactions"}
        breadcrumb={activeTab === "rules" ? "Deterministic Rule Engine & Simulator" : "Live Bank Feed"}
        description={
          activeTab === "rules"
            ? "Deterministic classification rules, confidence thresholds, and 90-day simulator backtest"
            : "Multi-bank transaction feeds with automated AI classification and one-click approvals"
        }
        infoGuideKey="transactions"
        actions={
          <>
            <button
              id="btn-stream-live-tx"
              onClick={handleStreamLive}
              disabled={isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isStreaming ? "animate-spin" : ""}`} />
              <span>{isStreaming ? "Streaming..." : "Stream Live Feed"}</span>
            </button>

            <button
              id="btn-import-csv-tx"
              onClick={onOpenCsvImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Import Statement</span>
            </button>

            <button
              id="btn-export-excel-tx"
              onClick={() => exportDataToExcel(transactions, "LedgerAI_Bank_Transactions", "Transactions")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-white rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Export all transactions to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Export</span>
            </button>

            <button
              id="btn-audit-trail-tx"
              onClick={() => {
                setSelectedEntityForAudit("ALL");
                setAuditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-purple-500/30 text-purple-300 rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="View Hash-Chained Cryptographic Audit Trail"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Audit Trail</span>
            </button>

            <button
              id="btn-add-transaction"
              onClick={onOpenAddTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer border border-blue-500/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </>
        }
      />

      {activeTab === "rules" ? (
        <RulesBuilderView />
      ) : (
        <>
          {/* Anomaly Sentinel Banner */}
          <AnomalyAlertBanner
            onInspectTransaction={(id) => onNavigate(`/transactions/${id}`)}
          />

          {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0c0d11] rounded-lg p-3 sm:p-3.5 border border-[#22242b] shadow-xs">
          <div className="text-xs font-medium text-[#71717a]">Total Feed Volume</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">{totalCount} Transactions</div>
          <div className="text-[11px] text-[#38bdf8] mt-0.5 font-medium">HDFC Live & Ingestion</div>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 sm:p-3.5 border border-[#22242b] shadow-xs">
          <div className="text-xs font-medium text-[#71717a]">Needs Review</div>
          <div className="text-lg sm:text-xl font-bold text-[#fbbf24] mt-0.5">{reviewCount} Pending</div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">Confidence &lt; 70% flag</div>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 sm:p-3.5 border border-[#22242b] shadow-xs">
          <div className="text-xs font-medium text-[#71717a]">AI Categorized Rate</div>
          <div className="text-lg sm:text-xl font-bold text-[#34d399] mt-0.5">{categorizedRate}%</div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">{categorizedCount} Auto-classified</div>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 sm:p-3.5 border border-[#22242b] shadow-xs">
          <div className="text-xs font-medium text-[#71717a]">Net Cash Movement</div>
          <div className={cn("text-lg sm:text-xl font-bold mt-0.5", netCashFlow >= 0 ? "text-[#34d399]" : "text-white")}>
            {netCashFlow >= 0 ? "+" : ""}{formatCurrency(netCashFlow, "INR")}
          </div>
          <div className="text-[11px] text-[#71717a] mt-0.5 font-medium">Inflows vs Outflows</div>
        </div>
      </div>

      {/* Filter & Search Bar Toolbar */}
      <div className="bg-[#0c0d11] rounded-lg p-2.5 sm:p-3 border border-[#22242b] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-tx"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, memo, or GL code..."
            className="w-full bg-[#050507] border border-[#22242b] rounded-md pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] transition-all font-normal"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto pb-1 md:pb-0">
          {/* Status Pills */}
          <div className="flex items-center bg-[#050507] p-0.5 rounded-md border border-[#22242b]">
            {["ALL", "categorized", "matched", "review", "unmatched"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded capitalize transition-all cursor-pointer",
                  statusFilter === st
                    ? "bg-[#14151c] text-white font-semibold shadow-xs border border-[#22242b]"
                    : "text-[#71717a] hover:text-white"
                )}
              >
                {st === "ALL" ? "All Feeds" : st === "review" ? "Needs Review" : st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="w-32">
            <CustomSelect
              id="filter-transaction-type"
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { value: "ALL", label: "All Types" },
                { value: "expense", label: "Expenses" },
                { value: "revenue", label: "Revenues" },
              ]}
              size="sm"
              align="right"
              searchable={false}
              ariaLabel="Filter by Transaction Type"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0c0d11] rounded-lg border border-[#22242b] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#38bdf8] animate-spin" />
            <span className="text-xs text-[#71717a] font-medium">Filtering bank transactions...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#14151c] border border-[#22242b] text-[#71717a] flex items-center justify-center mx-auto mb-2.5">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-white">No Transactions Found</h4>
            <p className="text-[11px] text-[#71717a] mt-1 max-w-sm mx-auto">
              No records match the current filter criteria. Try clearing search or importing a new CSV bank feed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#050507] border-b border-[#1e2029] text-[11px] font-medium text-[#71717a]">
                  <th className="py-2.5 px-3.5 font-medium">Date</th>
                  <th className="py-2.5 px-3.5 font-medium">Description / Vendor</th>
                  <th className="py-2.5 px-3.5 font-medium">Category & GL Code</th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Amount</th>
                  <th className="py-2.5 px-3.5 font-medium text-center">
                    <div className="inline-flex items-center gap-1">
                      <span>AI Confidence</span>
                      <InfoTooltip text="Calculated probability that the assigned Chart of Accounts category matches this bank memo. >= 70% auto-approves." title="AI Confidence" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5 font-medium">
                    <div className="inline-flex items-center gap-1">
                      <span>Status</span>
                      <InfoTooltip text="Categorized = Posted to ledger. Needs Review / Pending Approval = Requires secondary Maker-Checker controller sign-off (>= ₹1,00,000)." title="Transaction Status" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2029] text-xs">
                {transactions.map((tx) => {
                  const isHighConf = tx.confidence >= 0.9;
                  const isMedConf = tx.confidence >= 0.7 && tx.confidence < 0.9;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTxForAnalysis(tx)}
                      className="hover:bg-[#14151c] cursor-pointer transition-colors group"
                      title="Click to inspect AI classification analysis & ledger voucher"
                    >
                      {/* Date */}
                      <td className="py-2 px-3.5 text-[#71717a] whitespace-nowrap text-[11px]">
                        {tx.date}
                      </td>

                      {/* Description & Vendor */}
                      <td className="py-2 px-3.5 max-w-sm lg:max-w-md xl:max-w-xl">
                        <div className="font-semibold text-white group-hover:text-[#38bdf8] transition-colors truncate">
                          {tx.vendor || tx.customer || tx.description}
                        </div>
                        <div className="text-[10px] text-[#71717a] truncate">
                          {tx.rawText || tx.description}
                        </div>
                      </td>

                      {/* Category & GL Code */}
                      <td className="py-2 px-3.5">
                        <div className="font-medium text-[#d4d4d8]">{tx.category}</div>
                        <div className="text-[10px] text-[#71717a] font-medium">GL #{tx.glAccount}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "font-bold text-xs",
                            tx.type === "revenue" ? "text-[#34d399]" : "text-white"
                          )}
                        >
                          {tx.type === "revenue" ? "+" : "-"}
                          {formatCurrency(tx.amount, tx.currency || "INR")}
                        </span>
                      </td>

                      {/* AI Confidence % */}
                      <td className="py-2 px-3.5 text-center">
                        <div className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border",
                          isHighConf
                            ? "border-emerald-500/30 bg-emerald-500/10 text-[#34d399]"
                            : isMedConf
                            ? "border-blue-500/30 bg-blue-500/10 text-[#38bdf8]"
                            : "border-amber-500/30 bg-amber-500/10 text-[#fbbf24]"
                        )}>
                          <Sparkles
                            className={cn(
                              "w-2.5 h-2.5",
                              isHighConf ? "text-[#34d399]" : isMedConf ? "text-[#38bdf8]" : "text-[#fbbf24]"
                            )}
                          />
                          <span>
                            {(tx.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-2 px-3.5 whitespace-nowrap">
                        {tx.status === "categorized" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#34d399] border border-emerald-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#34d399]" />
                            Categorized
                          </span>
                        )}
                        {tx.status === "matched" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-[#38bdf8] border border-blue-500/30 text-[10px] font-semibold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-[#38bdf8]" />
                            Matched
                          </span>
                        )}
                        {tx.status === "review" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[#fbbf24] border border-amber-500/30 text-[10px] font-semibold">
                            <AlertCircle className="w-2.5 h-2.5 text-[#fbbf24]" />
                            Needs Review
                          </span>
                        )}
                        {tx.status === "unmatched" && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#14151c] text-[#a1a1aa] border border-[#22242b] text-[10px] font-semibold">
                            <Clock className="w-2.5 h-2.5 text-[#71717a]" />
                            Unmatched
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            id={`btn-analyze-tx-${tx.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxForAnalysis(tx);
                            }}
                            className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-[#38bdf8] font-semibold text-[10px] flex items-center gap-1 transition-all border border-blue-500/20 cursor-pointer"
                            title="Inspect AI Analysis & Voucher"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Analyze</span>
                          </button>

                          {tx.status === "review" && (
                            <button
                              id={`btn-approve-tx-${tx.id}`}
                              onClick={(e) => handleQuickApprove(e, tx.id)}
                              className="px-2 py-0.5 rounded bg-[#16a34a] hover:bg-[#22c55e] text-white font-semibold text-[10px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                              title="Approve & Post to GL"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {tx.amount >= 100000 && (
                            <button
                              onClick={(e) => handleDualApprove(e, tx)}
                              className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold text-[10px] flex items-center gap-1 transition-all border border-purple-500/30 cursor-pointer"
                              title="Maker-Checker Dual Sign-off (>= ₹1,00,000)"
                            >
                              <Shield className="w-2.5 h-2.5 text-purple-400" />
                              <span>Dual Sign</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxForFx(tx);
                              setFxModalOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-[#1e2029] hover:bg-[#282a36] text-zinc-300 font-semibold text-[10px] flex items-center gap-1 transition-all border border-[#323644] cursor-pointer"
                            title="Calculate FX Variance / Valuation"
                          >
                            <Globe className="w-2.5 h-2.5 text-blue-400" />
                            <span>FX</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEntityForAudit(tx.id);
                              setAuditModalOpen(true);
                            }}
                            className="p-1 rounded text-[#71717a] hover:text-purple-400 hover:bg-[#14151c] transition-colors"
                            title="View Hash-Chained Audit Trail"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`btn-view-tx-${tx.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(`/transactions/${tx.id}`);
                            }}
                            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#14151c] transition-colors"
                            title="Inspect Details"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Interactive In-Depth Transaction AI Analysis Modal */}
      <TransactionAnalysisModal
        isOpen={Boolean(selectedTxForAnalysis)}
        transaction={selectedTxForAnalysis}
        onClose={() => setSelectedTxForAnalysis(null)}
        onApprove={async (id) => {
          const res = await approveTransaction(id);
          setActionSuccess(`Transaction approved & Journal Entry #${res.journalEntryId} generated!`);
          setTimeout(() => setActionSuccess(null), 4000);
          loadTransactions();
        }}
        onNavigate={onNavigate}
      />

      {/* Cryptographic Audit Trail Modal */}
      <AuditTimelineModal
        isOpen={auditModalOpen}
        entityId={selectedEntityForAudit}
        onClose={() => setAuditModalOpen(false)}
      />

      {/* Multi-Currency FX Gain/Loss Modal */}
      <FxCalculationModal
        isOpen={fxModalOpen}
        invoiceId={selectedTxForFx?.matchedInvoiceId || "inv-001"}
        invoiceNumber={selectedTxForFx?.matchedInvoiceNumber || "INV-2026-001"}
        vendorName={selectedTxForFx?.vendor || selectedTxForFx?.description || "Cloud Provider"}
        defaultCurrency={selectedTxForFx?.currency || "USD"}
        defaultAmount={selectedTxForFx ? (Number(selectedTxForFx.amount) / 85.5) : 1000}
        onClose={() => {
          setFxModalOpen(false);
          setSelectedTxForFx(null);
        }}
      />
    </div>
  );
};
