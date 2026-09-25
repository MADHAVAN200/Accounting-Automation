import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Copy,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  CheckCircle2,
  X
} from "lucide-react";
import { AnomalyReport } from "../../types";
import { fetchAnomaliesReport } from "../../lib/api";

interface AnomalyAlertBannerProps {
  onInspectDuplicate?: (invoiceNumber: string) => void;
  onInspectTransaction?: (transactionId: string) => void;
}

export const AnomalyAlertBanner: React.FC<AnomalyAlertBannerProps> = ({
  onInspectDuplicate,
  onInspectTransaction
}) => {
  const [report, setReport] = useState<AnomalyReport | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    fetchAnomaliesReport()
      .then((data) => setReport(data))
      .catch((err) => console.error("Failed to load anomalies:", err));
  }, []);

  if (isDismissed || !report || report.totalAnomaliesDetected === 0) {
    return null;
  }

  const fmtInr = (val?: number) => {
    if (val === undefined || isNaN(val)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="bg-[#14151b] border border-amber-800/60 rounded-xl overflow-hidden shadow-sm">
      {/* Top Banner Row */}
      <div className="p-3.5 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                Ledger Anomaly Sentinel: {report.totalAnomaliesDetected} Attention Item{report.totalAnomaliesDetected > 1 ? "s" : ""} Flagged
              </span>
              <span className="text-[10px] bg-amber-900/40 text-amber-300 border border-amber-800/60 px-2 py-0.2 rounded-full font-medium">
                Health Score: {report.healthScore}/100
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              {report.duplicateInvoicesCount > 0 && `${report.duplicateInvoicesCount} duplicate billing match detected. `}
              {report.outlierSpendCount > 0 && `${report.outlierSpendCount} expense variance spike detected. `}
              {report.offHoursCount > 0 && `${report.offHoursCount} off-hour disbursement.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e2029] hover:bg-[#282a36] text-zinc-200 rounded-lg border border-[#323644] font-medium transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Hide Details</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Review Anomalies</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-[#262833] text-xs">
          {/* Section A: Duplicate Invoices */}
          {report.duplicateInvoices.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-2">
                Potential Duplicate Invoices:
              </span>
              <div className="space-y-2">
                {report.duplicateInvoices.map((d, i) => (
                  <div key={i} className="p-3 bg-[#0d0e12] rounded-lg border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{d.invoiceNumber}</span>
                        <span className="text-zinc-400">({d.vendorName})</span>
                        <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-800 px-1.5 py-0.2 rounded font-medium">
                          {d.severity}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-1">{d.reason}</p>
                      <p className="text-amber-300/80 text-[11px]">{d.recommendation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-white text-sm">{fmtInr(d.amount)}</div>
                      <span className="text-[11px] text-zinc-500">{d.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section B: Outlier Spend Transactions */}
          {report.outlierTransactions.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block mb-2">
                Statistical Spend Outliers (&gt;25% Variance vs Historical Average):
              </span>
              <div className="space-y-2">
                {report.outlierTransactions.map((o, i) => (
                  <div key={i} className="p-3 bg-[#0d0e12] rounded-lg border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{o.description}</span>
                        <span className="text-zinc-400">({o.vendor})</span>
                        <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-800 px-1.5 py-0.2 rounded font-medium">
                          +{o.variancePercent}% Spike
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-1">{o.reason}</p>
                      <p className="text-zinc-500 text-[11px]">Normal vendor baseline: {fmtInr(o.baselineAverage)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-red-400 text-sm">{fmtInr(o.amount)}</div>
                      <span className="text-[11px] text-zinc-500">{o.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section C: Off-Hour Transactions */}
          {report.offHourTransactions.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block mb-2">
                Weekend / Off-Hour Disbursements:
              </span>
              <div className="space-y-2">
                {report.offHourTransactions.map((u, i) => (
                  <div key={i} className="p-3 bg-[#0d0e12] rounded-lg border border-[#262833] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{u.description}</span>
                        <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded font-medium">
                          {u.dayOfWeek} Debit
                        </span>
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-0.5">{u.reason}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-medium text-zinc-200">{fmtInr(u.amount)}</div>
                      <span className="text-[11px] text-zinc-500">{u.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
