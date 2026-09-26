import React, { useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
  Download,
  Shield,
  Globe,
  Users,
} from "lucide-react";
import { Invoice } from "../types";
import { fetchInvoices, processDualApproval } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import { exportDataToExcel } from "../lib/excel";
import { InvoiceAnalysisModal } from "../components/modals/InvoiceAnalysisModal";
import { VendorTaxView } from "../components/vendors/VendorTaxView";
import { AnomalyAlertBanner } from "../components/anomalies/AnomalyAlertBanner";
import { AuditTimelineModal } from "../components/modals/AuditTimelineModal";
import { FxCalculationModal } from "../components/modals/FxCalculationModal";
import { ModuleHeader } from "../components/layout/ModuleHeader";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface InvoicesProps {
  onNavigate: (path: string) => void;
  onOpenInvoiceUpload: () => void;
  initialSearch?: string;
  initialStatusFilter?: string;
  initialTab?: "invoices" | "vendors";
}

export const Invoices: React.FC<InvoicesProps> = ({
  onNavigate,
  onOpenInvoiceUpload,
  initialSearch = "",
  initialStatusFilter = "ALL",
  initialTab = "invoices",
}) => {
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<"invoices" | "vendors">(initialTab);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedEntityForAudit, setSelectedEntityForAudit] = useState<string>("ALL");
  const [fxModalOpen, setFxModalOpen] = useState(false);
  const [selectedInvoiceForFx, setSelectedInvoiceForFx] = useState<Invoice | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleDualApprove = async (e: React.MouseEvent, inv: Invoice) => {
    e.stopPropagation();
    try {
      const res = await processDualApproval({
        entityType: "INVOICE",
        entityId: inv.id,
        userName: "Controller Lead",
        userRole: "CONTROLLER",
        threshold: 100000,
      });
      setActionSuccess(`Dual Sign-off Verified: ${res.message}`);
      setTimeout(() => setActionSuccess(null), 5000);
      loadInvoices();
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    setActiveInvoiceTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as "invoices" | "vendors";
    setActiveInvoiceTab(nextTab);
    onNavigate(nextTab === "vendors" ? "/vendors" : "/invoices");
  };

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const filtered = safeInvoices.filter((inv) => {
    const invNum = String(inv.invoiceNumber || (inv as any).invoice_number || "").toLowerCase();
    const vendor = String(inv.vendorName || (inv as any).vendor_name || "").toLowerCase();
    const searchTerm = String(search || "").trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      invNum.includes(searchTerm) ||
      vendor.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = safeInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const matchedCount = safeInvoices.filter((i) => i.status === "MATCHED" || i.status === "PAID").length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 select-none">
      {/* Toast Alert */}
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
        title={activeInvoiceTab === "vendors" ? "Vendor Directory & Tax Intelligence" : "Accounts Payable & Invoices"}
        breadcrumb={activeInvoiceTab === "vendors" ? "PAN Verification & Statutory TDS" : "Live Accounts Payable & OCR"}
        description={
          activeInvoiceTab === "vendors"
            ? "Vendor PAN compliance, automated TDS Section 194C/J calculations, and GSTR-2B Input Tax Credit"
            : "Accounts payable bills, automated OCR extraction, multi-currency settlement, and payment status"
        }
        infoGuideKey="invoices"
        actions={
          activeInvoiceTab === "vendors" ? (
            <button
              id="btn-audit-trail-inv"
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
          ) : (
            <>
              <button
                id="btn-export-excel-invoices"
                onClick={() => exportDataToExcel(invoices, "LedgerAI_Vendor_Invoices", "Invoices")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                title="Export invoices to Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Export Excel</span>
              </button>

              <button
                id="btn-audit-trail-inv"
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
                id="btn-upload-invoice-hero"
                onClick={onOpenInvoiceUpload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Invoice</span>
              </button>
            </>
          )
        }
      />

      {activeInvoiceTab === "vendors" ? (
        <VendorTaxView />
      ) : (
        <>
          {/* Anomaly Sentinel Banner */}
          <AnomalyAlertBanner />

          {/* Invoice Overview Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <span className="text-xs font-medium text-[#71717a]">Total Invoices</span>
          <div className="text-base font-bold text-white mt-0.5">{invoices.length} Registered</div>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#71717a]">
            <span>Total Billed</span>
            <InfoTooltip text="Aggregate gross invoice liability across all registered AP bills." title="Total Billed" />
          </div>
          <div className="text-base font-bold text-white mt-0.5">{formatCurrency(totalAmount, "INR")}</div>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#71717a]">
            <span>Matched</span>
            <InfoTooltip text="Invoices reconciled against settled bank disbursements." title="Reconciliation Rate" formula="(Matched / Total Invoices) * 100" />
          </div>
          <div className="text-base font-bold text-[#34d399] mt-0.5">
            {matchedCount} ({Math.round((matchedCount / (invoices.length || 1)) * 100)}%)
          </div>
        </div>

        <div className="bg-[#0c0d11] rounded-lg p-3 border border-[#22242b] shadow-xs">
          <span className="text-xs font-medium text-[#71717a]">Pending Match</span>
          <div className="text-base font-bold text-[#fbbf24] mt-0.5">
            {invoices.length - matchedCount} Open Bills
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0c0d11] rounded-lg p-2.5 sm:p-3 border border-[#22242b] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number or vendor..."
            className="w-full bg-[#050507] border border-[#22242b] rounded-md pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#3b82f6] transition-all font-normal"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#050507] border border-[#22242b] p-0.5 rounded-md w-full md:w-auto overflow-x-auto">
          {["ALL", "MATCHED", "PAID", "OPEN", "REVIEW"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-medium rounded transition-all cursor-pointer",
                statusFilter === st
                  ? "bg-[#14151c] text-white font-semibold shadow-xs border border-[#22242b]"
                  : "text-[#71717a] hover:text-white"
              )}
            >
              {st === "ALL" ? "All Invoices" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#0c0d11] rounded-lg border border-[#22242b] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#050507] border-b border-[#1e2029] text-[11px] font-medium text-[#71717a]">
                <th className="py-2.5 px-3.5 font-medium">Invoice #</th>
                <th className="py-2.5 px-3.5 font-medium">Vendor Name</th>
                <th className="py-2.5 px-3.5 font-medium">Invoice Date</th>
                <th className="py-2.5 px-3.5 font-medium">Due Date</th>
                <th className="py-2.5 px-3.5 font-medium text-right">Subtotal</th>
                <th className="py-2.5 px-3.5 font-medium text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    <span>Tax (GST)</span>
                    <InfoTooltip text="Statutory Goods and Services Tax (CGST + SGST or IGST) input tax credit claimed." title="GST Input Tax Credit" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 font-medium text-right">Total</th>
                <th className="py-2.5 px-3.5 font-medium text-center">
                  <div className="inline-flex items-center justify-center gap-1">
                    <span>Status</span>
                    <InfoTooltip text="MATCHED = Linked to settled bank transaction. PAID = Discharged. OPEN = Pending payout. REVIEW = Requires Maker-Checker approval." title="Invoice Status" />
                  </div>
                </th>
                <th className="py-2.5 px-3.5 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2029] text-xs">
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-[#14151c] cursor-pointer transition-colors group"
                >
                  {/* Invoice # */}
                  <td className="py-2 px-3.5 font-bold text-[#38bdf8] group-hover:underline whitespace-nowrap text-[11px]">
                    {inv.invoiceNumber || (inv as any).invoice_number || "INV-OPEN"}
                  </td>

                  {/* Vendor */}
                  <td className="py-2 px-3.5">
                    <div className="font-semibold text-white">{inv.vendorName || (inv as any).vendor_name || "Vendor"}</div>
                    <div className="text-[10px] text-[#71717a] truncate max-w-sm lg:max-w-md xl:max-w-xl">{inv.notes || "No notes"}</div>
                  </td>

                  {/* Date */}
                  <td className="py-2 px-3.5 text-[#71717a] whitespace-nowrap text-[11px]">{inv.invoiceDate || (inv as any).invoice_date || "-"}</td>

                  {/* Due Date */}
                  <td className="py-2 px-3.5 text-[#71717a] whitespace-nowrap text-[11px]">{inv.dueDate || (inv as any).due_date || "-"}</td>

                  {/* Subtotal */}
                  <td className="py-2 px-3.5 text-right text-[#a1a1aa] whitespace-nowrap">
                    {formatCurrency(inv.subtotal, inv.currency)}
                  </td>

                  {/* Tax */}
                  <td className="py-2 px-3.5 text-right text-[#71717a] whitespace-nowrap">
                    {formatCurrency(inv.tax, inv.currency)}
                  </td>

                  {/* Total */}
                  <td className="py-2 px-3.5 text-right font-bold text-white whitespace-nowrap">
                    {formatCurrency(inv.total, inv.currency)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2 px-3.5 text-center whitespace-nowrap">
                    {inv.status === "MATCHED" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#34d399] border border-emerald-500/30 text-[10px] font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#34d399]" />
                        Matched
                      </span>
                    )}
                    {inv.status === "PAID" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-[#38bdf8] border border-blue-500/30 text-[10px] font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#38bdf8]" />
                        Paid
                      </span>
                    )}
                    {inv.status === "OPEN" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-[#fbbf24] border border-amber-500/30 text-[10px] font-semibold">
                        <Clock className="w-2.5 h-2.5 text-[#fbbf24]" />
                        Open
                      </span>
                    )}
                    {inv.status === "REVIEW" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-[#fb7185] border border-rose-500/30 text-[10px] font-semibold">
                        <AlertCircle className="w-2.5 h-2.5 text-[#fb7185]" />
                        Variance
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-2 px-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {Number(inv.total) >= 100000 && (
                        <button
                          onClick={(e) => handleDualApprove(e, inv)}
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
                          setSelectedInvoiceForFx(inv);
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
                          setSelectedEntityForAudit(inv.id);
                          setAuditModalOpen(true);
                        }}
                        className="p-1 rounded text-[#71717a] hover:text-purple-400 hover:bg-[#14151c] transition-colors"
                        title="View Hash-Chained Audit Trail"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="p-1 rounded text-[#71717a] hover:text-[#38bdf8] hover:bg-[#14151c] transition-colors"
                        title="Inspect OCR & Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Invoice Analysis & Extraction Modal */}
      <InvoiceAnalysisModal
        isOpen={Boolean(selectedInvoice)}
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
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
        invoiceId={selectedInvoiceForFx?.id || "inv-001"}
        invoiceNumber={selectedInvoiceForFx?.invoiceNumber || "INV-2026-001"}
        vendorName={selectedInvoiceForFx?.vendorName || "Cloud Provider"}
        defaultCurrency={selectedInvoiceForFx?.currency || "USD"}
        defaultAmount={selectedInvoiceForFx ? Number(selectedInvoiceForFx.total) : 1000}
        onClose={() => {
          setFxModalOpen(false);
          setSelectedInvoiceForFx(null);
        }}
      />
    </div>
  );
};
