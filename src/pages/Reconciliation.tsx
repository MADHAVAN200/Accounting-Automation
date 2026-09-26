import React, { useEffect, useState } from "react";
import {
  GitCompare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  FileText,
  CreditCard,
  Check,
  RefreshCw,
  Download,
  Info,
  ExternalLink,
} from "lucide-react";
import { ReconciliationMatch } from "../types";
import { fetchReconciliation, confirmReconciliationMatch, autoRunReconciliation } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import { exportDataToExcel } from "../lib/excel";
import { ReconciliationDetailModal } from "../components/modals/ReconciliationDetailModal";
import { PageInfoButton } from "../components/ui/PageInfoButton";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface ReconciliationProps {
  onNavigate: (path: string) => void;
}

export const Reconciliation: React.FC<ReconciliationProps> = ({ onNavigate }) => {
  const [data, setData] = useState<{
    totalBankTransactions: number;
    automaticallyMatched: number;
    automationRate: number;
    needsReview: number;
    unmatched: number;
    matches: ReconciliationMatch[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAutoMatch, setIsRunningAutoMatch] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<ReconciliationMatch | null>(null);

  useEffect(() => {
    loadReconciliation();
  }, []);

  const loadReconciliation = async () => {
    setIsLoading(true);
    try {
      const res = await fetchReconciliation();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (matchId: string) => {
    try {
      await confirmReconciliationMatch(matchId);
      setSuccessToast("Reconciliation match confirmed and posted to ledger.");
      setTimeout(() => setSuccessToast(null), 4000);
      loadReconciliation();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAutoMatch = async () => {
    setIsRunningAutoMatch(true);
    try {
      const res = await autoRunReconciliation();
      setSuccessToast(`Auto-reconciliation complete! Identified ${res.newMatchesFound} new verified matches.`);
      setTimeout(() => setSuccessToast(null), 5000);
      loadReconciliation();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningAutoMatch(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium mt-3">Evaluating reconciliation graph...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <h3 className="text-sm font-bold text-gray-900">Reconciliation Workspace Unavailable</h3>
        <p className="text-xs text-gray-500 max-w-sm">
          Unable to fetch automated reconciliation matches from the server.
        </p>
        <button
          onClick={loadReconciliation}
          className="px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 select-none">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="font-bold text-[#34d399] px-1 hover:text-white cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Header & Run Auto-Reconciliation */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-white tracking-tight">Bank & Invoice Reconciliation</h1>
          <PageInfoButton guideKey="reconciliation" />
          <span className="text-[#71717a] font-normal text-xs sm:text-sm">/ 3-Way Fuzzy Match Engine</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-excel-reconciliation"
            onClick={() => {
              if (data && data.matches) {
                const rows = data.matches.map((m) => ({
                  MatchID: m.id,
                  Confidence: `${((m.overallScore ?? 0) * 100).toFixed(1)}%`,
                  Status: m.status,
                  BankTxDate: m.transaction?.date || "",
                  BankTxDesc: m.transaction?.description || "",
                  BankTxAmount: m.transaction?.amount || 0,
                  InvoiceNumber: m.invoice?.invoiceNumber || "",
                  InvoiceVendor: m.invoice?.vendorName || "",
                  InvoiceAmount: m.invoice?.total || 0,
                }));
                exportDataToExcel(rows, "LedgerAI_Reconciliation_Matches", "Reconciliation");
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            title="Export reconciliation report to Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Export Report</span>
          </button>

          <button
            id="btn-run-auto-reconciliation"
            onClick={handleRunAutoMatch}
            disabled={isRunningAutoMatch}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            {isRunningAutoMatch ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating Ledger Rules...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Run Auto-Reconciliation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <span className="text-xs font-medium text-[#71717a]">Bank Feed Lines</span>
          <div className="text-base font-bold text-white mt-0.5">
            {data.totalBankTransactions.toLocaleString()}
          </div>
          <p className="text-[10px] text-[#71717a] mt-0.5">Statement lines</p>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#71717a]">
            <span>Auto-Matched</span>
            <InfoTooltip text="Transactions linked to vendor invoices where total weighted matching score is >= 95%." title="Auto-Match Confidence" formula="Score = 0.35*Amount + 0.25*Vendor + 0.15*Date + 0.15*InvNum + 0.10*Tax" />
          </div>
          <div className="text-base font-bold text-[#34d399] mt-0.5">
            {data.automaticallyMatched.toLocaleString()} ({data.automationRate}%)
          </div>
          <p className="text-[10px] text-[#34d399] font-medium mt-0.5">Score &gt; 95%</p>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#71717a]">
            <span>Needs Review</span>
            <InfoTooltip text="Potential matches with variance in amount (Fx fluctuation, bank fee) or ambiguous vendor tokens." title="Variance Review Queue" />
          </div>
          <div className="text-base font-bold text-[#fbbf24] mt-0.5">{data.needsReview} Items</div>
          <p className="text-[10px] text-[#fbbf24] font-medium mt-0.5">Variance detected</p>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <span className="text-xs font-medium text-[#71717a]">Unmatched Inflows</span>
          <div className="text-base font-bold text-white mt-0.5">{data.unmatched} Items</div>
          <p className="text-[10px] text-[#71717a] mt-0.5">Pending invoice</p>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-white">Match Queue</h3>
          <InfoTooltip text="Multi-factor matching engine assessing Amount (35%), Vendor Token Cosine (25%), Date Proximity (15%), Invoice Pattern (15%), and Tax/GST (10%)." title="Match Queue Scoring" />
        </div>
        <span className="text-[11px] text-[#71717a]">Weights: Amount 35% | Vendor 25% | Date 15%</span>
      </div>

      {/* Match Cards List */}
      <div className="space-y-3">
        {data.matches.map((match) => {
          const isConfirmed = match.status === "CONFIRMED";
          const isReview = match.status === "NEEDS_REVIEW";

          return (
            <div
              key={match.id}
              onClick={() => setSelectedMatch(match)}
              className="bg-[#0c0d11] rounded-lg border border-[#22242b] shadow-xs p-3.5 hover:border-[#3b82f6]/70 hover:shadow-md transition-all cursor-pointer group relative"
              title="Click to view detailed reconciliation match analysis and audit explanation"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left & Right Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                  {/* Left: Bank Transaction */}
                  <div className="p-3 rounded-md bg-[#050507] border border-[#22242b] group-hover:border-[#2a303c] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#71717a] flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-[#38bdf8]" />
                        Bank Statement Line
                      </span>
                      <span className="text-[11px] font-medium text-[#a1a1aa]">
                        {match.transaction?.date || "2026-09-01"}
                      </span>
                    </div>

                    <div className="font-semibold text-white text-xs truncate">
                      {match.transaction?.description || "AWS WEB SERVICES"}
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-0.5 truncate font-normal">
                      Account: HDFC Operating (1010)
                    </div>

                    <div className="mt-2 flex items-baseline justify-between pt-1.5 border-t border-[#1e2029]">
                      <span className="text-[11px] text-[#a1a1aa]">Settled Amount</span>
                      <span className="font-bold text-xs text-white">
                        {formatCurrency(match.transaction?.amount || 108432, "INR")}
                      </span>
                    </div>
                  </div>

                  {/* Right: Vendor Invoice */}
                  <div className="p-3 rounded-md bg-[#050507] border border-[#22242b] group-hover:border-[#2a303c] transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[#71717a] flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#818cf8]" />
                        Matched Vendor Invoice
                      </span>
                      <span className="text-[11px] font-medium text-[#38bdf8]">
                        {match.invoice?.invoiceNumber || "INV-1001"}
                      </span>
                    </div>

                    <div className="font-semibold text-white text-xs truncate">
                      {match.invoice?.vendorName || "Amazon Web Services"}
                    </div>
                    <div className="text-[10px] text-[#71717a] mt-0.5 truncate font-normal">
                      Invoice Date: {match.invoice?.invoiceDate || "2026-08-31"}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between pt-1.5 border-t border-[#1e2029]">
                      <span className="text-[11px] text-[#a1a1aa]">Invoice Total</span>
                      <span className="font-bold text-xs text-white">
                        {formatCurrency(match.invoice?.total || 108432, "INR")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Score & Actions Panel */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-between lg:w-48 gap-3 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-[#1e2029] pt-3 lg:pt-0">
                  <div className="text-center w-full">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3 text-[#34d399]" />
                      <span>{(match.overallScore * 100).toFixed(1)}% Match Score</span>
                    </div>

                    {/* Detailed scoring weights pills */}
                    <div className="grid grid-cols-2 gap-1 mt-1.5 text-[9px] text-[#71717a] font-medium">
                      <div>Amt: {(match.amountScore * 100).toFixed(0)}%</div>
                      <div>Vend: {(match.vendorScore * 100).toFixed(0)}%</div>
                      <div>Date: {(match.dateScore * 100).toFixed(0)}%</div>
                      <div>Ref: {(match.referenceScore * 100).toFixed(0)}%</div>
                    </div>
                  </div>

                  <div className="w-full space-y-1.5">
                    {isConfirmed ? (
                      <div className="w-full py-1.5 rounded-md bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                        <span>Reconciled</span>
                      </div>
                    ) : (
                      <button
                        id={`btn-confirm-match-${match.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirm(match.id);
                        }}
                        className="w-full py-1.5 px-3 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-blue-500/40"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm Match</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatch(match);
                      }}
                      className="w-full py-1 px-2 rounded-md bg-[#14151c] hover:bg-[#1e2029] border border-[#22242b] text-[#38bdf8] hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Info className="w-3 h-3" />
                      <span>Inspect Analysis</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Match Explanation Reasons Bar */}
              {match.reasons && match.reasons.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#1e2029] flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {match.reasons.map((reason, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#050507] border border-[#22242b] text-[#a1a1aa] text-[10px] font-medium"
                      >
                        <Check className="w-2.5 h-2.5 text-[#34d399]" />
                        <span>{reason}</span>
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-[#71717a] group-hover:text-[#38bdf8] transition-colors flex items-center gap-1 shrink-0 ml-auto">
                    <span>View full mathematical breakdown</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* In-Depth Reconciliation Explanation Modal */}
      <ReconciliationDetailModal
        isOpen={Boolean(selectedMatch)}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onConfirmMatch={async (matchId) => {
          await handleConfirm(matchId);
          if (selectedMatch && selectedMatch.id === matchId) {
            setSelectedMatch({ ...selectedMatch, status: "CONFIRMED" });
          }
        }}
        onNavigate={onNavigate}
      />
    </div>
  );
};
