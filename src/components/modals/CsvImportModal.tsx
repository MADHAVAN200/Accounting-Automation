import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Download,
  FileText,
  Trash2,
} from "lucide-react";
import { importCsvTransactions } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import {
  downloadSampleExcelStatement,
  parseUploadedFile,
  SAMPLE_TEST_TRANSACTIONS,
  ParsedTransactionRow,
} from "../../lib/excel";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [transactionsToImport, setTransactionsToImport] = useState<ParsedTransactionRow[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    importedCount: number;
    duplicatesSkipped: number;
    transactions: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      setSelectedFileName(file.name);
      const rows = await parseUploadedFile(file);
      if (rows.length === 0) {
        throw new Error("No valid transactions found in the uploaded file.");
      }
      setTransactionsToImport(rows);
    } catch (err: any) {
      setError(err.message || "Failed to parse file. Please verify format.");
      setSelectedFileName(null);
      setTransactionsToImport([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleLoadSampleDataset = () => {
    setError(null);
    setResult(null);
    setSelectedFileName("LedgerAI_Bank_Statement_Test.xlsx (15 Real Transactions)");
    setTransactionsToImport([...SAMPLE_TEST_TRANSACTIONS]);
  };

  const handleUploadAndProcess = async () => {
    if (transactionsToImport.length === 0) {
      setError("Please select an Excel or CSV file, or load the test dataset first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const res = await importCsvTransactions(transactionsToImport);
      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to process transactions via Python backend engine.");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSelected = () => {
    setTransactionsToImport([]);
    setSelectedFileName(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        className="w-full max-w-2xl bg-[#0c0d11] rounded-lg border border-[#22242b] shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden text-white cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2029] bg-[#0c0d11] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#050507] border border-[#22242b] text-[#34d399] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Import Bank Statement (Excel / CSV)</h3>
              <p className="text-[11px] text-[#71717a]">
                Real-time Python ingestion with SHA-256 deduplication & COA auto-classification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#71717a] hover:text-white hover:bg-[#14151c] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Action Banner: Download Sample Excel & 1-Click Load */}
          <div className="bg-[#050507] border border-[#22242b] rounded-md p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
                <span>Test with Official Excel Template</span>
              </div>
              <p className="text-[11px] text-[#71717a]">
                Download a ready-to-test .xlsx statement or load the 15 transactions directly.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={downloadSampleExcelStatement}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-xs font-medium text-white transition-colors cursor-pointer shadow-xs"
                title="Download LedgerAI_Bank_Statement_Test.xlsx"
              >
                <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Download Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleDataset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs border border-emerald-500/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 15 Test Rows</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-[#f87171] text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-[#388bfd] bg-blue-500/10"
                : "border-[#22242b] hover:border-[#388bfd] bg-[#050507]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#0c0d11] border border-[#22242b] flex items-center justify-center text-[#38bdf8]">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-medium text-white">
                <span className="text-[#38bdf8] font-semibold hover:underline">Click to browse</span> or drag and drop statement file
              </div>
              <p className="text-[11px] text-[#71717a]">
                Supports Microsoft Excel (<span className="text-white font-medium">.xlsx</span>, <span className="text-white font-medium">.xls</span>) and standard <span className="text-white font-medium">.csv</span> files
              </p>
            </div>
          </div>

          {/* Staged Transactions Preview */}
          {transactionsToImport.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Staged for Ingestion: {transactionsToImport.length} Records</span>
                </span>
                <button
                  type="button"
                  onClick={clearSelected}
                  className="flex items-center gap-1 text-[11px] text-[#f87171] hover:text-[#ef4444] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              {selectedFileName && (
                <div className="text-[11px] text-[#71717a] truncate px-1">
                  Source: <span className="text-white font-medium">{selectedFileName}</span>
                </div>
              )}

              {/* High-density preview table */}
              <div className="max-h-52 overflow-y-auto border border-[#22242b] rounded-md bg-[#050507]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0c0d11] text-[#71717a] sticky top-0 border-b border-[#1e2029] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-center">Currency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2029]">
                    {transactionsToImport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#14151c] text-white">
                        <td className="py-1.5 px-3 font-mono text-[11px] text-[#71717a]">{row.date}</td>
                        <td className="py-1.5 px-3 font-medium text-xs">{row.description}</td>
                        <td className="py-1.5 px-3 font-mono font-semibold text-right text-xs">
                          {formatCurrency(Number(row.amount), row.currency || "INR")}
                        </td>
                        <td className="py-1.5 px-3 text-center font-mono text-[10px] text-[#71717a]">
                          {row.currency || "INR"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Real Backend Processing Results */}
          {result && (
            <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-[#34d399]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Successfully Ingested {result.importedCount} Transactions ({result.duplicatesSkipped} duplicates skipped)
                </span>
              </div>
              <p className="text-[11px] text-[#71717a]">
                Each record was mapped into SQLite, assigned double-entry general ledger debit/credit pairs, and auto-classified.
              </p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pt-2 border-t border-emerald-500/20">
                {result.transactions.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs px-2 py-1 rounded bg-[#050507] border border-[#22242b]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-[#71717a]">{t.date}</span>
                      <span className="font-medium text-white">{t.vendor || t.description}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/15 text-[#38bdf8] border border-blue-500/30 font-medium">
                        {t.category}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white shrink-0 ml-2">
                      {formatCurrency(t.amount, "INR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#1e2029] bg-[#0c0d11] shrink-0">
          <span className="text-[11px] text-[#71717a]">
            {transactionsToImport.length > 0
              ? `${transactionsToImport.length} transactions ready`
              : "Select an Excel or CSV statement to begin"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#22242b] bg-[#050507] hover:bg-[#14151c] text-[#a1a1aa] hover:text-white text-xs font-medium cursor-pointer transition-colors"
            >
              {result ? "Done" : "Cancel"}
            </button>

            <button
              id="btn-process-csv-modal"
              type="button"
              onClick={handleUploadAndProcess}
              disabled={isProcessing || transactionsToImport.length === 0}
              className={`px-4 py-1.5 rounded-md text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isProcessing || transactionsToImport.length === 0
                  ? "bg-[#16a34a]/50 border-emerald-500/20 cursor-not-allowed opacity-60"
                  : "bg-[#16a34a] hover:bg-[#22c55e] border-emerald-500/40"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing in Python...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ingest & Run Auto-Classify</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
