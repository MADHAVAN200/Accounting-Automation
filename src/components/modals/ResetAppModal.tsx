import React, { useState } from "react";
import { RotateCcw, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { resetApplication } from "../../lib/api";

interface ResetAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetAppModal: React.FC<ResetAppModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isResetting) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isResetting, onClose]);

  if (!isOpen) return null;

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);

    try {
      await resetApplication();
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to reset application");
      setIsResetting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isResetting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0c0d11] border border-[#22242b] rounded-xl shadow-2xl p-6 overflow-hidden cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isResetting}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white p-1 rounded-md hover:bg-[#181920] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Reset Entire Application
            </h3>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Restore database and ledger back to default demo state
            </p>
          </div>
        </div>

        {/* Informational content */}
        <div className="bg-[#14151c] border border-[#1e2029] rounded-lg p-3.5 space-y-2 mb-5 text-xs text-[#d4d4d8]">
          <p className="leading-relaxed">
            This action will completely reseed the embedded <strong className="text-white">SQLite database (ledger.db)</strong>:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[#a1a1aa]">
            <li>Restores all standard accounts in the Chart of Accounts</li>
            <li>Resets transaction feeds to clean balanced demo records</li>
            <li>Resets uploaded vendor bills &amp; invoices</li>
            <li>Re-verifies Double-Entry General Ledger balance (<span className="text-[#34d399]">DR == CR</span>)</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-3.5 py-2 rounded-md bg-[#14151c] hover:bg-[#1e2029] text-[#a1a1aa] hover:text-white text-xs font-medium transition-colors cursor-pointer border border-[#22242b]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isDone}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer border border-rose-400/40"
          >
            {isDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reset Complete!</span>
              </>
            ) : isResetting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Resetting System...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm &amp; Reset Application</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
