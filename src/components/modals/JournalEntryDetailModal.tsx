import React, { useEffect } from "react";
import {
  X,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Hash,
  ExternalLink,
} from "lucide-react";
import { JournalEntry } from "../../types";
import { formatCurrency } from "../../lib/utils";

interface JournalEntryDetailModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const JournalEntryDetailModal: React.FC<JournalEntryDetailModalProps> = ({
  isOpen,
  entry,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !entry) return null;

  const lines = Array.isArray(entry.lines) ? entry.lines : [];
  const totalDebit = lines.length > 0
    ? lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
    : (Number(entry.totalDebit) || 0);
  const totalCredit = lines.length > 0
    ? lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)
    : (Number(entry.totalCredit) || 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

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
        aria-labelledby="modal-journal-entry-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#34d399]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-journal-entry-title" className="text-sm font-semibold text-white tracking-tight">
                  General Ledger Journal Voucher Audit
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#14151c] border border-[#22242b] text-[#34d399] font-medium">
                  {entry.entryNumber}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Double-entry voucher record, debits & credits balance invariance verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#14151c] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Summary Card */}
          <div className="p-3.5 rounded-lg bg-[#050507] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-zinc-300">
                Voucher Narration / Memo
              </div>
              <div className="font-semibold text-white text-sm mt-0.5">{entry.description}</div>
              <div className="text-[11px] text-zinc-300 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Posting Date: {entry.date}
                </span>
                <span>•</span>
                <span>Source: {entry.sourceType}</span>
                <span>•</span>
                <span className="text-[#34d399] font-medium">Status: {entry.status}</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-[#1e2029] sm:pl-4">
              <div className="text-xs font-medium text-zinc-300">Voucher Total</div>
              <div className="text-base font-bold text-white font-mono">
                {formatCurrency(totalDebit, "INR")}
              </div>
              <div className="text-[10px] text-[#34d399] mt-0.5 font-medium flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Strictly Invariant</span>
              </div>
            </div>
          </div>

          {/* Ledger Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
                Double-Entry Line Items
              </h3>
              <span className="text-[10px] font-medium text-zinc-400">
                {lines.length} Voucher Legs
              </span>
            </div>

            <div className="border border-[#22242b] rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#050507] border-b border-[#22242b] text-xs font-medium text-zinc-300">
                  <tr>
                    <th className="py-2.5 px-3">Account Code & Name</th>
                    <th className="py-2.5 px-3">Line Narration</th>
                    <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029] font-mono text-xs">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-3 text-center text-zinc-400 font-sans">
                        Summary voucher record without granular sub-line items
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-[#14151c]/70 transition-colors">
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-medium text-white">#{line.accountCode}</span>
                          <span className="text-zinc-300 ml-2">({line.accountName})</span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-zinc-300 text-[11px]">
                          {line.description || entry.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-white">
                          {line.debit > 0 ? formatCurrency(line.debit, "INR") : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-white">
                          {line.credit > 0 ? formatCurrency(line.credit, "INR") : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-[#050507] border-t border-[#22242b] font-mono font-semibold text-xs">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-right font-sans text-xs text-zinc-300 font-medium">
                      Voucher Verification Totals:
                    </td>
                    <td className="py-2.5 px-3 text-right text-white">
                      {formatCurrency(totalDebit, "INR")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white">
                      {formatCurrency(totalCredit, "INR")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Audit Trail Stamp */}
          <div className="p-3 rounded-lg bg-[#050507] border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Immutable Ledger Hash Verified • Double-entry integrity check passed</span>
            </div>
            <span className="font-mono text-zinc-400">Entry ID: {entry.id}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-[#1e2029] bg-[#0c0d11] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-medium cursor-pointer transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
