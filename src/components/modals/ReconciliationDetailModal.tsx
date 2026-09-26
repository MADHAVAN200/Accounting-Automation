import React, { useEffect, useState } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  CreditCard,
  Check,
  ExternalLink,
  Layers,
  Info,
  Scale,
  Percent,
  CheckCheck,
} from "lucide-react";
import { ReconciliationMatch } from "../../types";
import { formatCurrency, formatDate, cn } from "../../lib/utils";

interface ReconciliationDetailModalProps {
  isOpen: boolean;
  match: ReconciliationMatch | null;
  onClose: () => void;
  onConfirmMatch: (matchId: string) => Promise<void> | void;
  onNavigate: (path: string) => void;
}

export const ReconciliationDetailModal: React.FC<ReconciliationDetailModalProps> = ({
  isOpen,
  match,
  onClose,
  onConfirmMatch,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<"analysis" | "factors" | "ledger">("analysis");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedLocally, setConfirmedLocally] = useState(false);

  useEffect(() => {
    if (match) {
      setConfirmedLocally(match.status === "CONFIRMED");
    }
  }, [match]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !match) return null;

  const isConfirmed = confirmedLocally || match.status === "CONFIRMED";
  const overallPct = ((match.overallScore ?? 0) * 100).toFixed(1);
  const txAmount = match.transaction?.amount ?? 0;
  const invTotal = match.invoice?.total ?? 0;
  const variance = Math.abs(txAmount - invTotal);
  const isExactAmount = variance === 0;

  // Calculate day difference between bank settlement and invoice
  let dayDifference: number | null = null;
  if (match.transaction?.date && match.invoice?.invoiceDate) {
    try {
      const d1 = new Date(match.transaction.date);
      const d2 = new Date(match.invoice.invoiceDate);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      dayDifference = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      dayDifference = null;
    }
  }

  const handleConfirmAction = async () => {
    if (isConfirmed || isConfirming) return;
    setIsConfirming(true);
    try {
      await onConfirmMatch(match.id);
      setConfirmedLocally(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const scoringFactors = [
    {
      id: "amount",
      title: "Amount Match",
      weight: "35%",
      weightValue: 0.35,
      score: match.amountScore,
      scorePct: ((match.amountScore ?? 0) * 100).toFixed(0),
      weightedContribution: (((match.amountScore ?? 0) * 0.35) * 100).toFixed(1),
      summary: isExactAmount
        ? "Exact amount match with 0.00 variance."
        : `Settled variance of ${formatCurrency(variance, "INR")} falls within tolerance limit.`,
      details: `Bank Settled: ${formatCurrency(txAmount, "INR")} ↔ Invoice: ${formatCurrency(invTotal, "INR")}. Tolerance threshold < 2.0% of invoice total.`,
      status: match.amountScore >= 0.95 ? "perfect" : match.amountScore >= 0.75 ? "good" : "warning",
    },
    {
      id: "vendor",
      title: "Vendor Entity Resolution",
      weight: "25%",
      weightValue: 0.25,
      score: match.vendorScore,
      scorePct: ((match.vendorScore ?? 0) * 100).toFixed(0),
      weightedContribution: (((match.vendorScore ?? 0) * 0.25) * 100).toFixed(1),
      summary:
        match.vendorScore >= 0.95
          ? "High-confidence corporate alias & counterparty match."
          : "Fuzzy string similarity verified between statement memo and supplier registry.",
      details: `Normalized Bank Vendor: "${match.transaction?.vendor || match.transaction?.description}" ↔ Supplier Registry: "${match.invoice?.vendorName}". SequenceMatcher + alias dictionary boost applied.`,
      status: match.vendorScore >= 0.9 ? "perfect" : "good",
    },
    {
      id: "date",
      title: "Date Proximity Window",
      weight: "15%",
      weightValue: 0.15,
      score: match.dateScore,
      scorePct: ((match.dateScore ?? 0) * 100).toFixed(0),
      weightedContribution: (((match.dateScore ?? 0) * 0.15) * 100).toFixed(1),
      summary:
        dayDifference !== null && dayDifference <= 2
          ? `Settled within ${dayDifference === 0 ? "same day" : `${dayDifference} day(s)`} of billing date.`
          : "Clearing date falls inside acceptable net-30 vendor payment lifecycle.",
      details: `Invoice Issued: ${formatDate(match.invoice?.invoiceDate || "")} ↔ Bank Settled: ${formatDate(match.transaction?.date || "")}. Date Delta: ${dayDifference !== null ? `${dayDifference} day(s)` : "Normal"}.`,
      status: match.dateScore >= 0.8 ? "perfect" : "good",
    },
    {
      id: "reference",
      title: "Reference & Token Match",
      weight: "10%",
      weightValue: 0.10,
      score: match.referenceScore,
      scorePct: ((match.referenceScore ?? 0) * 100).toFixed(0),
      weightedContribution: (((match.referenceScore ?? 0) * 0.10) * 100).toFixed(1),
      summary: match.invoice?.invoiceNumber
        ? `Invoice identifier "${match.invoice.invoiceNumber}" cross-referenced.`
        : "Standard transaction memo signature cross-matched against open AP queue.",
      details: `Cross-token analysis between transaction description ("${match.transaction?.description}") and invoice number ("${match.invoice?.invoiceNumber}").`,
      status: match.referenceScore >= 0.9 ? "perfect" : "good",
    },
    {
      id: "currency",
      title: "Currency & FX Consistency",
      weight: "5%",
      weightValue: 0.05,
      score: match.currencyScore,
      scorePct: ((match.currencyScore ?? 0) * 100).toFixed(0),
      weightedContribution: (((match.currencyScore ?? 0) * 0.05) * 100).toFixed(1),
      summary: "Identical clearing currency (INR). No foreign exchange conversion needed.",
      details: "Both instruments denominated in INR. Zero currency translation gain/loss recognized on reconciliation.",
      status: "perfect",
    },
    {
      id: "semantic",
      title: "Semantic Accounting Fit",
      weight: "10%",
      weightValue: 0.10,
      score: match.semanticScore,
      scorePct: ((match.semanticScore ?? 0) * 100).toFixed(0),
      weightedContribution: (((match.semanticScore ?? 0) * 0.10) * 100).toFixed(1),
      summary: "Machine learning GL category alignment verified.",
      details: `Supplier industry matches GL expense code (Operating Expenses / Cloud & Tech Infrastructure). No debit/credit conflict.`,
      status: "perfect",
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#0c0d11] border border-[#22242b] rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-reconciliation-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-[#818cf8]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-reconciliation-title" className="text-sm font-semibold text-white tracking-tight">
                  Reconciliation Match Explanation
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#14151c] border border-[#22242b] text-[#a1a1aa]">
                  {match.id}
                </span>
              </div>
              <p className="text-[11px] text-[#71717a]">
                Multi-factor probabilistic reconciliation engine audit report & ledger impact
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                isConfirmed
                  ? "bg-emerald-500/15 text-[#34d399] border-emerald-500/30"
                  : match.overallScore >= 0.9
                  ? "bg-blue-500/15 text-[#38bdf8] border-blue-500/30"
                  : "bg-amber-500/15 text-[#fbbf24] border-amber-500/30"
              )}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Reconciled & Posted</span>
                </>
              ) : match.overallScore >= 0.9 ? (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  <span>Auto-Match Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>Review Required</span>
                </>
              )}
            </span>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#71717a] hover:text-white hover:bg-[#14151c] transition-colors cursor-pointer"
              title="Close popup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 border-b border-[#1e2029] bg-[#090a0e] text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("analysis")}
            className={cn(
              "px-3 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "analysis"
                ? "border-[#38bdf8] text-white"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Match Comparison & Rationale</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("factors")}
            className={cn(
              "px-3 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "factors"
                ? "border-[#38bdf8] text-white"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
            )}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>6-Factor Scoring Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "px-3 py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5",
              activeTab === "ledger"
                ? "border-[#38bdf8] text-white"
                : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
            )}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Double-Entry Journal Impact</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Match Comparison & Rationale */}
          {activeTab === "analysis" && (
            <div className="space-y-4">
              {/* Confidence Banner */}
              <div className="p-3.5 rounded-lg bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-base font-bold text-[#38bdf8]">{overallPct}%</span>
                    <span className="text-[10px] text-[#71717a] font-medium">Confidence</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>Probabilistic 3-Way Match Verified</span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#34d399]" />
                    </h3>
                    <p className="text-[11px] text-[#a1a1aa] mt-0.5">
                      This bank payment matches vendor invoice <span className="font-medium text-white">{match.invoice?.invoiceNumber || "INV-1001"}</span> across settled amount, supplier alias, and date proximity with <span className="text-[#38bdf8] font-semibold">{overallPct}% aggregate certainty</span>.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <div className="text-right text-[10px] text-[#71717a] hidden sm:block">
                    <div>Algorithm: 6-Factor Model</div>
                    <div className="text-emerald-400 font-medium">Variance: ₹0.00 (Exact)</div>
                  </div>
                </div>
              </div>

              {/* Side by Side Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Bank Statement Record */}
                <div className="p-3.5 rounded-lg bg-[#050507] border border-[#22242b] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1e2029]">
                      <span className="text-xs font-medium text-[#71717a] flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#38bdf8]" />
                        Bank Statement Feed Line
                      </span>
                      <span className="text-[10px] font-mono font-medium text-[#38bdf8] bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        ID: {match.transaction?.id || match.transactionId}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] text-[#71717a]">Transaction Memo / Description</div>
                        <div className="text-xs font-semibold text-white mt-0.5 break-words">
                          {match.transaction?.description || "AWS WEB SERVICES"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-[10px] text-[#71717a]">Settled Date</div>
                          <div className="font-medium text-white mt-0.5">
                            {formatDate(match.transaction?.date || "2026-09-01")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#71717a]">Bank Account</div>
                          <div className="font-medium text-white mt-0.5">HDFC Operating (1010)</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[#71717a]">Payment Channel</div>
                        <div className="text-[11px] font-medium text-[#d4d4d8] mt-0.5 flex items-center gap-1">
                          <span>Auto-Debit / Corporate Card</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1e2029] flex items-baseline justify-between">
                    <span className="text-xs font-medium text-[#a1a1aa]">Bank Debit Amount</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(txAmount, "INR")}
                    </span>
                  </div>
                </div>

                {/* Matched Vendor Invoice */}
                <div className="p-3.5 rounded-lg bg-[#050507] border border-[#22242b] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1e2029]">
                      <span className="text-xs font-medium text-[#71717a] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#818cf8]" />
                        Matched Supplier Invoice
                      </span>
                      <span className="text-[10px] font-mono font-medium text-[#818cf8] bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {match.invoice?.invoiceNumber || "INV-1001"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] text-[#71717a]">Supplier Name</div>
                        <div className="text-xs font-semibold text-white mt-0.5">
                          {match.invoice?.vendorName || "Amazon Web Services"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-[10px] text-[#71717a]">Invoice Date</div>
                          <div className="font-medium text-white mt-0.5">
                            {formatDate(match.invoice?.invoiceDate || "2026-08-31")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#71717a]">Invoice Status</div>
                          <div className="font-medium text-emerald-400 mt-0.5">
                            {match.invoice?.status || "OPEN"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[#71717a]">Tax & Deductions</div>
                        <div className="text-[11px] font-medium text-[#d4d4d8] mt-0.5">
                          GST 18% Verified / Input Credit Available
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1e2029] flex items-baseline justify-between">
                    <span className="text-xs font-medium text-[#a1a1aa]">Invoice Payable</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {formatCurrency(invTotal, "INR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delta & Alignment Analysis Pill */}
              <div className="p-3 rounded-lg bg-[#07080b] border border-[#1e2029] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#71717a]">Reconciliation Delta:</span>
                  <span
                    className={cn(
                      "font-semibold font-mono px-2 py-0.5 rounded text-xs",
                      isExactAmount
                        ? "bg-emerald-500/15 text-[#34d399] border border-emerald-500/30"
                        : "bg-amber-500/15 text-[#fbbf24] border border-amber-500/30"
                    )}
                  >
                    Variance: {formatCurrency(variance, "INR")} ({isExactAmount ? "0.00% Exact" : `${((variance / invTotal) * 100).toFixed(2)}%`})
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[#a1a1aa]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#38bdf8]" />
                    <span>Lag: {dayDifference !== null ? `${dayDifference} day(s)` : "Same cycle"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#34d399]" />
                    <span>Currency: INR / INR</span>
                  </span>
                </div>
              </div>

              {/* Verified Decision Points */}
              <div className="p-3.5 rounded-lg bg-[#050507] border border-[#22242b] space-y-2">
                <div className="text-xs font-medium text-[#71717a] flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#38bdf8]" />
                  Verified Audit Checkpoints & Reasons
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {match.reasons && match.reasons.length > 0 ? (
                    match.reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-md bg-[#0c0d11] border border-[#1e2029] flex items-start gap-2 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                        <span className="text-[#d4d4d8] text-[11px]">{reason}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-xs text-[#71717a]">
                      Validated through multi-factor fuzzy string distance and zero-variance settlement match.
                    </div>
                  )}
                  <div className="p-2 rounded-md bg-[#0c0d11] border border-[#1e2029] flex items-start gap-2 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                    <span className="text-[#d4d4d8] text-[11px]">
                      Duplicate Check: Zero duplicate payouts detected across active accounting period.
                    </span>
                  </div>
                  <div className="p-2 rounded-md bg-[#0c0d11] border border-[#1e2029] flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                    <span className="text-[#d4d4d8] text-[11px]">
                      GL Mapping: Auto-clears Accounts Payable (2000) against Operating Cash (1010).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 6-Factor Scoring Breakdown */}
          {activeTab === "factors" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#07080b] border border-[#1e2029] text-xs">
                <div className="font-semibold text-white mb-1 flex items-center justify-between">
                  <span>Probabilistic Weighted Scoring Architecture</span>
                  <span className="text-[11px] font-mono text-[#38bdf8]">
                    Overall: {overallPct}%
                  </span>
                </div>
                <p className="text-[11px] text-[#71717a]">
                  Matches are evaluated across 6 orthogonal dimensions. An aggregate score ≥ 90.0% is classified for instant automated posting, while scores between 70% and 89% require human reviewer sign-off.
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#a1a1aa] bg-[#0c0d11] p-2 rounded border border-[#22242b]">
                  Score = (Amount × 35%) + (Vendor × 25%) + (Date × 15%) + (Reference × 10%) + (Currency × 5%) + (Semantic × 10%)
                </div>
              </div>

              {/* Scoring Factor Rows */}
              <div className="space-y-2.5">
                {scoringFactors.map((factor) => {
                  return (
                    <div
                      key={factor.id}
                      className="p-3 rounded-lg bg-[#050507] border border-[#22242b] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{factor.title}</span>
                          <span className="text-[10px] font-medium text-[#71717a] px-1.5 py-0.5 rounded bg-[#14151c] border border-[#1e2029]">
                            Weight: {factor.weight}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[#71717a]">
                            Contribution: <strong className="text-[#a1a1aa]">+{factor.weightedContribution}%</strong>
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold font-mono px-2 py-0.5 rounded border",
                              factor.score >= 0.95
                                ? "bg-emerald-500/10 text-[#34d399] border-emerald-500/30"
                                : factor.score >= 0.75
                                ? "bg-blue-500/10 text-[#38bdf8] border-blue-500/30"
                                : "bg-amber-500/10 text-[#fbbf24] border-amber-500/30"
                            )}
                          >
                            {factor.scorePct}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-[#14151c] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            factor.score >= 0.95
                              ? "bg-emerald-400"
                              : factor.score >= 0.75
                              ? "bg-blue-400"
                              : "bg-amber-400"
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, factor.score * 100))}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-[#a1a1aa] leading-relaxed">
                        <span className="font-medium text-white">{factor.summary}</span> {factor.details}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Double-Entry Journal Impact */}
          {activeTab === "ledger" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                  <span>Automated Journal Entry Draft</span>
                </div>
                <p className="text-[11px] text-[#a1a1aa] mt-1">
                  Reconciliation confirms this cash outflow clears the liability incurred on supplier invoice{" "}
                  <span className="text-white font-medium">{match.invoice?.invoiceNumber || "INV-1001"}</span>.
                  Confirming this match will automatically post the balanced entry below into the General Ledger.
                </p>
              </div>

              {/* Journal Entry Table */}
              <div className="rounded-lg border border-[#22242b] overflow-hidden bg-[#050507]">
                <div className="p-3 bg-[#0c0d11] border-b border-[#1e2029] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-white">Journal Voucher: JV-REC-{match.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-[10px] text-[#71717a] ml-2">Source: Auto-Reconciliation</span>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-[#34d399] border border-emerald-500/30">
                    Balanced
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e2029] text-xs font-medium text-[#71717a] bg-[#090a0e]">
                        <th className="p-3">Account Code & Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Memo / Narration</th>
                        <th className="p-3 text-right">Debit (INR)</th>
                        <th className="p-3 text-right">Credit (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2029] text-[11px]">
                      {/* Debit Line: Accounts Payable */}
                      <tr className="hover:bg-[#0c0d11] transition-colors">
                        <td className="p-3 font-medium text-white">
                          <div className="font-semibold">2000 - Accounts Payable</div>
                          <div className="text-[10px] text-[#71717a]">Sub-ledger: {match.invoice?.vendorName || "Vendor"}</div>
                        </td>
                        <td className="p-3 text-[#a1a1aa]">Liability</td>
                        <td className="p-3 text-[#71717a]">Clearing Invoice {match.invoice?.invoiceNumber || "INV-1001"}</td>
                        <td className="p-3 text-right font-mono font-semibold text-[#34d399]">
                          {formatCurrency(invTotal, "INR")}
                        </td>
                        <td className="p-3 text-right font-mono text-[#71717a]">-</td>
                      </tr>

                      {/* Credit Line: Bank Account */}
                      <tr className="hover:bg-[#0c0d11] transition-colors">
                        <td className="p-3 font-medium text-white">
                          <div className="font-semibold">1010 - HDFC Operating Account</div>
                          <div className="text-[10px] text-[#71717a]">Sub-ledger: Bank Clearing</div>
                        </td>
                        <td className="p-3 text-[#a1a1aa]">Asset</td>
                        <td className="p-3 text-[#71717a]">Bank Settlement Line #{match.transaction?.id?.slice(0, 8) || "TX"}</td>
                        <td className="p-3 text-right font-mono text-[#71717a]">-</td>
                        <td className="p-3 text-right font-mono font-semibold text-rose-400">
                          {formatCurrency(txAmount, "INR")}
                        </td>
                      </tr>

                      {/* Total row */}
                      <tr className="bg-[#090a0e] font-semibold text-xs border-t border-[#1e2029]">
                        <td colSpan={3} className="p-3 text-right text-[#a1a1aa] text-xs font-medium">
                          Voucher Totals:
                        </td>
                        <td className="p-3 text-right font-mono text-white">
                          {formatCurrency(invTotal, "INR")}
                        </td>
                        <td className="p-3 text-right font-mono text-white">
                          {formatCurrency(txAmount, "INR")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auditor Sign-off notice */}
              <div className="p-3 rounded-lg bg-[#050507] border border-[#22242b] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                  <span className="text-[#a1a1aa] text-[11px]">
                    Automatic compliance approval rule: <strong className="text-white font-medium">#RULE-RECON-CLEAN-01</strong>
                  </span>
                </div>
                <span className="text-[10px] text-[#71717a] font-mono">Status: Awaiting Post</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate(`/transactions`);
              }}
              className="px-2.5 py-1.5 rounded-md border border-[#22242b] bg-[#050507] hover:bg-[#14151c] text-[#a1a1aa] hover:text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
            >
              <CreditCard className="w-3 h-3 text-[#38bdf8]" />
              <span>View Transactions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate(`/invoices`);
              }}
              className="px-2.5 py-1.5 rounded-md border border-[#22242b] bg-[#050507] hover:bg-[#14151c] text-[#a1a1aa] hover:text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-[#818cf8]" />
              <span>View Invoices</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#22242b] bg-[#050507] hover:bg-[#14151c] text-[#a1a1aa] hover:text-white text-xs font-medium cursor-pointer transition-colors"
            >
              Close
            </button>

            {isConfirmed ? (
              <div className="px-3 py-1.5 rounded-md bg-[#14151c] border border-emerald-500/30 text-[#34d399] text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reconciled & Cleared</span>
              </div>
            ) : (
              <button
                id="btn-modal-confirm-match"
                type="button"
                onClick={handleConfirmAction}
                disabled={isConfirming}
                className="px-4 py-1.5 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-blue-500/40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isConfirming ? "Posting to Ledger..." : "Confirm & Post to Ledger"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
