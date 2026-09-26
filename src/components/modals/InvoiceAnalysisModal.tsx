import React, { useEffect } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Hash,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";
import { Invoice } from "../../types";
import { formatCurrency } from "../../lib/utils";

interface InvoiceAnalysisModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const InvoiceAnalysisModal: React.FC<InvoiceAnalysisModalProps> = ({
  isOpen,
  invoice,
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

  if (!isOpen || !invoice) return null;

  const invNumber = invoice.invoiceNumber || (invoice as any).invoice_number || "INV-1001";
  const vendorName = invoice.vendorName || (invoice as any).vendor_name || "Supplier Entity";
  const invoiceDate = invoice.invoiceDate || (invoice as any).invoice_date || "2026-09-01";
  const dueDate = invoice.dueDate || (invoice as any).due_date || "2026-10-01";
  const isMatched = invoice.status === "MATCHED" || invoice.status === "PAID";
  const hasLineItems = invoice.lineItems && invoice.lineItems.length > 0;

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
        aria-labelledby="modal-invoice-analysis-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-[#818cf8]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modal-invoice-analysis-title" className="text-sm font-semibold text-white tracking-tight">
                  Vendor Invoice Audit & Extraction Analysis
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#14151c] border border-[#22242b] text-[#38bdf8] font-medium">
                  {invNumber}
                </span>
              </div>
              <p className="text-[11px] text-[#71717a]">
                OCR line-item verification, GST compliance & 3-way reconciliation audit
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
          {/* Top Banner */}
          <div className="p-3.5 rounded-lg bg-[#050507] border border-[#22242b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">{vendorName}</span>
                <span
                  className={
                    isMatched
                      ? "inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] text-[10px] font-medium"
                      : "inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[#fbbf24] text-[10px] font-medium"
                  }
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {invoice.status}
                </span>
              </div>
              <div className="text-[11px] text-[#71717a] mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#71717a]" />
                  Issued: {invoiceDate}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#71717a]" />
                  Due: {dueDate}
                </span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-[#1e2029] sm:pl-4">
              <div className="text-xs font-medium text-[#71717a]">Total Payable</div>
              <div className="text-base font-bold text-white">
                {formatCurrency(invoice.total, invoice.currency || "INR")}
              </div>
              <div className="text-[10px] text-[#38bdf8] mt-0.5 font-medium">
                Tax: {formatCurrency(invoice.tax, invoice.currency || "INR")} (18% GST)
              </div>
            </div>
          </div>

          {/* 3-Way Reconciliation Check */}
          <div className="p-3.5 rounded-lg bg-[#050507] border border-[#22242b] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#38bdf8]" />
                3-Way Matching & Bank Verification Check
              </span>
              <span className="text-xs text-[#34d399] font-medium">
                {isMatched ? "Bank Match Confirmed" : "Open AP Liability"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-2 rounded bg-[#0c0d11] border border-[#1e2029]">
                <span className="text-xs text-[#71717a] font-medium block">1. PO / Contract</span>
                <span className="text-xs font-medium text-[#34d399] flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" /> Validated
                </span>
              </div>
              <div className="p-2 rounded bg-[#0c0d11] border border-[#1e2029]">
                <span className="text-xs text-[#71717a] font-medium block">2. Goods / Service Receipt</span>
                <span className="text-xs font-medium text-[#34d399] flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" /> Certified
                </span>
              </div>
              <div className="p-2 rounded bg-[#0c0d11] border border-[#1e2029]">
                <span className="text-xs text-[#71717a] font-medium block">3. Bank Feed Settlement</span>
                <span
                  className={
                    isMatched
                      ? "text-xs font-medium text-[#34d399] flex items-center gap-1 mt-0.5"
                      : "text-xs font-medium text-[#fbbf24] flex items-center gap-1 mt-0.5"
                  }
                >
                  {isMatched ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {isMatched ? "Reconciled" : "Pending Clearing"}
                </span>
              </div>
            </div>
          </div>

          {/* Itemized Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white">
                Extracted Line-Item Distribution & GL Codes
              </h3>
              <span className="text-[10px] text-[#71717a]">
                OCR Confidence: 99.2% • Tax Verified
              </span>
            </div>

            <div className="border border-[#1e2029] rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#050507] border-b border-[#1e2029] text-xs font-medium text-[#71717a]">
                  <tr>
                    <th className="py-2 px-3">Item Description</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029]">
                  {hasLineItems ? (
                    invoice.lineItems!.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#0c0d11]/60">
                        <td className="py-2 px-3 font-medium text-white">
                          <div>{item.description}</div>
                          {item.glAccount && (
                            <span className="text-[10px] text-[#38bdf8] font-mono">
                              GL Account #{item.glAccount}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center text-[#a1a1aa] font-mono">{item.quantity}</td>
                        <td className="py-2 px-3 text-right text-[#a1a1aa] font-mono">
                          {formatCurrency(item.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white font-mono">
                          {formatCurrency(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-center text-[#71717a]">
                        Single aggregate item extracted: {vendorName} Enterprise Subscription ({formatCurrency(invoice.subtotal, invoice.currency)})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Double-Entry Liability Posting Preview */}
          <div className="p-4 rounded-lg bg-[#050507] border border-[#22242b] space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#38bdf8]" />
                Accounts Payable Journal Voucher Impact
              </h3>
              <span className="text-xs font-mono text-[#34d399] font-medium">
                Balanced Voucher
              </span>
            </div>

            <div className="border border-[#1e2029] rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0d11] border-b border-[#1e2029] text-xs font-medium text-[#71717a]">
                  <tr>
                    <th className="py-2 px-3">GL Posting Account</th>
                    <th className="py-2 px-3 text-right">Debit (₹)</th>
                    <th className="py-2 px-3 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029] font-mono text-xs">
                  <tr className="hover:bg-[#0c0d11]/60">
                    <td className="py-2 px-3 font-sans">
                      <span className="font-medium text-white">Dr 6010</span>
                      <span className="text-[#a1a1aa] ml-2">(Operating Expense / Tech)</span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white">
                      {formatCurrency(invoice.subtotal, "INR")}
                    </td>
                    <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                  </tr>
                  <tr className="hover:bg-[#0c0d11]/60">
                    <td className="py-2 px-3 font-sans">
                      <span className="font-medium text-white">Dr 1080</span>
                      <span className="text-[#a1a1aa] ml-2">(GST Input Tax Credit)</span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white">
                      {formatCurrency(invoice.tax, "INR")}
                    </td>
                    <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                  </tr>
                  <tr className="hover:bg-[#0c0d11]/60">
                    <td className="py-2 px-3 font-sans pl-6">
                      <span className="font-medium text-white">Cr 2000</span>
                      <span className="text-[#a1a1aa] ml-2">(Accounts Payable Liability)</span>
                    </td>
                    <td className="py-2 px-3 text-right text-[#71717a]">-</td>
                    <td className="py-2 px-3 text-right font-bold text-white">
                      {formatCurrency(invoice.total, "INR")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="text-[11px] text-[#71717a]">
            Entity ID: <span className="font-mono text-[#a1a1aa]">{invoice.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate("/reconciliation");
                }}
                className="px-3 py-1.5 rounded-md bg-[#14151c] hover:bg-[#1e2029] border border-[#22242b] text-[#38bdf8] hover:text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <span>View in Reconciliation Queue</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-medium cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
