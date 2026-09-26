import React, { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Calendar,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Transaction } from "../../types";
import { formatCurrency, cn } from "../../lib/utils";

interface TransactionAnalysisModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onNavigate?: (path: string) => void;
}

export const TransactionAnalysisModal: React.FC<TransactionAnalysisModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onApprove,
  onReject,
  onNavigate,
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setStatusOverride(null);
  }, [transaction?.id]);

  if (!isOpen || !transaction) return null;

  const currentStatus = statusOverride || transaction.status;
  const isApproved = currentStatus === "categorized" || currentStatus === "matched";
  const isHighConf = transaction.confidence >= 0.85;
  const isMedConf = transaction.confidence >= 0.65 && transaction.confidence < 0.85;

  const debitAccountCode = transaction.suggestedDebitAccount || transaction.glAccount || "6010";
  const debitAccountName = transaction.suggestedDebitAccountName || transaction.category || "Operating Expense";
  const creditAccountCode = transaction.suggestedCreditAccount || "1010";
  const creditAccountName = transaction.suggestedCreditAccountName || "HDFC Operating Bank Account";

  const handleApproveClick = async () => {
    if (!onApprove || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onApprove(transaction.id);
      setStatusOverride("categorized");
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!onReject || isActionLoading) return;
    setIsActionLoading(true);
    try {
      await onReject(transaction.id);
      setStatusOverride("review");
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto cursor-pointer select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#0c0d11] border border-[#22242b] rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-tx-analysis-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#38bdf8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-tx-analysis-title" className="text-sm font-semibold text-white tracking-tight">
                  Transaction AI Classification Analysis
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#14151c] border border-[#22242b] text-[#a1a1aa]">
                  {transaction.id}
                </span>
              </div>
              <p className="text-[11px] text-[#71717a]">
                Decision logic, anomaly assessment & double-entry ledger impact
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#71717a] hover:text-white hover:bg-[#14151c] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Top Banner: Confidence & Status */}
          <div className="p-3.5 rounded-lg bg-[#050507] border border-[#22242b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm border",
                  isHighConf
                    ? "bg-emerald-500/10 border-emerald-500/30 text-[#34d399]"
                    : isMedConf
                    ? "bg-blue-500/10 border-blue-500/30 text-[#38bdf8]"
                    : "bg-amber-500/10 border-amber-500/30 text-[#fbbf24]"
                )}
              >
                {(transaction.confidence * 100).toFixed(0)}%
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white text-sm">
                    {transaction.vendor || transaction.customer || transaction.description}
                  </span>
                  {transaction.isAnomaly && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-[#f87171] text-[10px] font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Anomaly Flagged
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#71717a] mt-0.5">
                  Statement line: &quot;{transaction.rawText || transaction.description}&quot;
                </div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-[#1e2029] sm:pl-4">
              <div className="text-xs font-medium text-[#71717a]">Settled Amount</div>
              <div
                className={cn(
                  "text-base font-bold",
                  transaction.type === "revenue" ? "text-[#34d399]" : "text-white"
                )}
              >
                {transaction.type === "revenue" ? "+" : "-"}
                {formatCurrency(transaction.amount, transaction.currency || "INR")}
              </div>
              <div className="text-[10px] text-[#a1a1aa] mt-0.5 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3 text-[#71717a]" />
                <span>{transaction.date}</span>
              </div>
            </div>
          </div>

          {/* Anomaly Callout if flagged */}
          {transaction.isAnomaly && transaction.anomalyReason && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[#f87171] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs">Statistical Anomaly Detected</div>
                <div className="text-[11px] text-[#fca5a5] mt-0.5 leading-relaxed">
                  {transaction.anomalyReason}
                </div>
              </div>
            </div>
          )}

          {/* AI Decision Reasoning Factors */}
          <div className="p-4 rounded-lg bg-[#050507] border border-[#22242b] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                Machine Learning Classification Trail
              </h3>
              <span className="text-[10px] text-[#71717a]">
                Chart of Accounts Model v4.2 • Zero-Shot RAG Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 rounded bg-[#0c0d11] border border-[#1e2029]">
                <span className="text-xs text-[#71717a] font-medium block">
                  Assigned Category
                </span>
                <span className="font-semibold text-white text-xs mt-1 block">
                  {transaction.category}
                </span>
                <span className="text-[10px] text-[#38bdf8] font-mono mt-0.5 block">
                  GL Account #{transaction.glAccount}
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#0c0d11] border border-[#1e2029]">
                <span className="text-xs text-[#71717a] font-medium block">
                  Payment Method & Channel
                </span>
                <span className="font-semibold text-white text-xs mt-1 block">
                  {transaction.paymentMethod || "Bank Transfer"}
                </span>
                <span className="text-[10px] text-[#71717a] mt-0.5 block">
                  Channel: Direct Bank Feed Clearing
                </span>
              </div>
            </div>

            {/* Explanation Points */}
            <div>
              <span className="text-xs text-[#71717a] font-medium block mb-1.5">
                Automated Verification Rules Evaluated:
              </span>
              <div className="space-y-1.5">
                {transaction.aiExplanation && transaction.aiExplanation.length > 0 ? (
                  transaction.aiExplanation.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[#0c0d11] border border-[#1e2029] flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                      <span className="text-[11px] text-[#d4d4d8] leading-relaxed">{reason}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 rounded bg-[#0c0d11] border border-[#1e2029] flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                    <span className="text-[11px] text-[#d4d4d8]">
                      Exact vendor and amount pattern cross-referenced against historical general ledger entries.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Double-Entry Journal Preview */}
          <div className="p-4 rounded-lg bg-[#050507] border border-[#22242b] space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
                Balanced Double-Entry Journal Voucher
              </h3>
              <span className="text-[10px] font-medium text-[#34d399] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Invariance Verified: Debits = Credits
              </span>
            </div>

            <div className="border border-[#1e2029] rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0d11] border-b border-[#1e2029] text-xs font-medium text-[#71717a]">
                  <tr>
                    <th className="py-2 px-3">Account Code & Description</th>
                    <th className="py-2 px-3 text-right">Debit (₹)</th>
                    <th className="py-2 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029] font-mono text-xs">
                  {transaction.type === "expense" ? (
                    <>
                      <tr className="hover:bg-[#0c0d11]/60">
                        <td className="py-2 px-3 font-sans">
                          <span className="font-medium text-white">Dr {debitAccountCode}</span>
                          <span className="text-[#a1a1aa] ml-2">({debitAccountName})</span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(transaction.amount, "INR")}
                        </td>
                        <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                      </tr>
                      <tr className="hover:bg-[#0c0d11]/60">
                        <td className="py-2 px-3 font-sans pl-6">
                          <span className="font-medium text-white">Cr {creditAccountCode}</span>
                          <span className="text-[#a1a1aa] ml-2">({creditAccountName})</span>
                        </td>
                        <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(transaction.amount, "INR")}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr className="hover:bg-[#0c0d11]/60">
                        <td className="py-2 px-3 font-sans">
                          <span className="font-medium text-white">Dr {creditAccountCode}</span>
                          <span className="text-[#a1a1aa] ml-2">({creditAccountName})</span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(transaction.amount, "INR")}
                        </td>
                        <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                      </tr>
                      <tr className="hover:bg-[#0c0d11]/60">
                        <td className="py-2 px-3 font-sans pl-6">
                          <span className="font-medium text-white">Cr {debitAccountCode}</span>
                          <span className="text-[#a1a1aa] ml-2">({debitAccountName})</span>
                        </td>
                        <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(transaction.amount, "INR")}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate(`/transactions/${transaction.id}`);
                }}
                className="text-xs text-[#38bdf8] hover:text-white flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-[#14151c] transition-colors cursor-pointer"
              >
                <span>Open Full Transaction Audit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-[#14151c] hover:bg-[#1e2029] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer transition-colors"
            >
              Close
            </button>

            {!isApproved && onReject && (
              <button
                type="button"
                onClick={handleRejectClick}
                disabled={isActionLoading}
                className="px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[#f87171] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
              >
                Reject / Re-classify
              </button>
            )}

            {!isApproved && onApprove && (
              <button
                type="button"
                onClick={handleApproveClick}
                disabled={isActionLoading}
                className="px-3.5 py-1.5 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs border border-blue-500/40 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isActionLoading ? "Posting..." : "Approve & Post to GL"}</span>
              </button>
            )}

            {isApproved && (
              <div className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Posted to General Ledger</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
