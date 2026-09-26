import React, { useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
} from "lucide-react";
import { uploadInvoice } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";

interface InvoiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [vendorName, setVendorName] = useState("Amazon Web Services EMEA");
  const [invoiceAmount, setInvoiceAmount] = useState("45800");
  const [invoiceRawText, setInvoiceRawText] = useState(
    `INVOICE #INV-2026-9041
Vendor: Amazon Web Services EMEA SARL
38 Avenue John F. Kennedy, L-1855, Luxembourg
Bill To: LedgerAI Technologies Inc.
Date: 2026-09-02
Due Date: 2026-10-02

Line Items:
1. Amazon Elastic Kubernetes Service (EKS) - ₹28,400
2. Amazon Aurora PostgreSQL Serverless - ₹10,400
3. GST @ 18% - ₹7,000

Total Amount Payable: ₹45,800 INR`
  );

  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUploadAndExtract = async () => {
    setIsExtracting(true);
    setError(null);
    setResult(null);

    try {
      const res = await uploadInvoice({
        rawText: invoiceRawText,
        customVendor: vendorName,
        customTotal: parseFloat(invoiceAmount) || 45800,
        filename: `${vendorName.replace(/\s+/g, "_")}_INV.pdf`,
      });

      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to parse invoice.");
    } finally {
      setIsExtracting(false);
    }
  };

  const loadPreset = (type: string) => {
    if (type === "aws") {
      setVendorName("Amazon Web Services");
      setInvoiceAmount("45800");
      setInvoiceRawText(`INVOICE #INV-2026-9041
Vendor: Amazon Web Services EMEA SARL
Bill To: LedgerAI Technologies Inc.
Date: 2026-09-02
Line Items:
1. Amazon Elastic Kubernetes Service (EKS) - ₹28,400
2. Amazon Aurora PostgreSQL Serverless - ₹10,400
3. GST @ 18% - ₹7,000
Total Amount Payable: ₹45,800 INR`);
    } else if (type === "adobe") {
      setVendorName("Adobe Systems Inc");
      setInvoiceAmount("5600");
      setInvoiceRawText(`INVOICE #INV-AD-9082
Vendor: Adobe Systems Software Ireland
Bill To: LedgerAI Technologies Inc.
Date: 2026-09-01
Line Items:
1. Creative Cloud All Apps - 2 Seats - ₹4,745
2. Tax (18%) - ₹855
Total Amount: ₹5,600 INR`);
    } else if (type === "slack") {
      setVendorName("Slack Technologies");
      setInvoiceAmount("12400");
      setInvoiceRawText(`INVOICE #INV-SLACK-7721
Vendor: Slack Technologies LLC
Bill To: LedgerAI Technologies Inc.
Date: 2026-08-25
Line Items:
1. Slack Enterprise Grid 12 Seats - ₹10,508
2. Tax @ 18% - ₹1,892
Total Amount: ₹12,400 INR`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInvoiceRawText(text.slice(0, 3000));
        // Simple heuristic to extract vendor and amount if present
        const lines = text.split("\n");
        if (lines.length > 0 && lines[0].trim()) {
          setVendorName(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0c0d11] rounded-lg p-5 border border-[#22242b] shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-white cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2029]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#050507] text-[#38bdf8] flex items-center justify-center border border-[#22242b]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upload & AI Extract Invoice</h3>
              <p className="text-[11px] text-[#71717a]">OCR & Gemini extraction into itemized accounting schema</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-[#71717a] hover:text-white hover:bg-[#14151c] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[#f87171] text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#f87171] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real File Upload Section */}
        <div className="mt-3 p-3 border-2 border-dashed border-[#22242b] hover:border-[#388bfd] rounded-lg bg-[#050507] transition-colors text-center cursor-pointer relative">
          <input
            type="file"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".txt,.csv,.json,.pdf,.png,.jpg"
          />
          <div className="flex items-center justify-center gap-2 text-xs text-[#71717a]">
            <Upload className="w-4 h-4 text-[#38bdf8]" />
            <span className="font-semibold text-white">Click or drag & drop invoice document</span>
            <span>(TXT, CSV, PDF, OCR)</span>
          </div>
        </div>

        {/* Demo Presets */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset("aws")}
            className="px-2 py-0.5 rounded-md bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer"
          >
            AWS EKS Bill
          </button>
          <button
            type="button"
            onClick={() => loadPreset("adobe")}
            className="px-2 py-0.5 rounded-md bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer"
          >
            Adobe CC Bill
          </button>
          <button
            type="button"
            onClick={() => loadPreset("slack")}
            className="px-2 py-0.5 rounded-md bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer"
          >
            Slack Grid Bill
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
              Vendor Name
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full bg-[#050507] border border-[#22242b] rounded-md px-2.5 py-1.5 text-white focus:outline-none focus:border-[#388bfd] font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
              Total Amount (₹)
            </label>
            <input
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              className="w-full bg-[#050507] border border-[#22242b] rounded-md px-2.5 py-1.5 text-white focus:outline-none focus:border-[#388bfd] font-semibold"
            />
          </div>
        </div>

        {/* Invoice Body / OCR Text */}
        <div className="mt-2.5">
          <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
            Raw Invoice OCR / Document Content
          </label>
          <textarea
            rows={5}
            value={invoiceRawText}
            onChange={(e) => setInvoiceRawText(e.target.value)}
            className="w-full bg-[#050507] border border-[#22242b] rounded-md p-2.5 text-xs text-white focus:outline-none focus:border-[#388bfd] font-mono text-[11px]"
          />
        </div>

        {/* Extraction Result Showcase */}
        {result && (
          <div className="mt-3 p-3 rounded-md bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#38bdf8]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
              <span>AI Extraction Successful: {result.extractedData.invoiceNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[#a1a1aa] pt-1 text-[11px]">
              <div>Vendor: <strong className="text-white">{result.extractedData.vendorName}</strong></div>
              <div>Total: <strong className="text-[#34d399]">{formatCurrency(result.extractedData.total, "INR")}</strong></div>
              <div>Subtotal: {formatCurrency(result.extractedData.subtotal, "INR")}</div>
              <div>GST: {formatCurrency(result.extractedData.tax, "INR")}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e2029] mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-[#22242b] bg-[#0c0d11] hover:bg-[#14151c] text-[#a1a1aa] hover:text-white text-xs font-semibold cursor-pointer"
          >
            {result ? "Close" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleUploadAndExtract}
            disabled={isExtracting}
            className="px-3.5 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
