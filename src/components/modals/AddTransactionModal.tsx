import React, { useState } from "react";
import {
  Plus,
  CreditCard,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
} from "lucide-react";
import { addTransaction } from "../../lib/api";
import { CustomSelect } from "../ui/CustomSelect";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-09-02");
  const [type, setType] = useState("expense");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addTransaction({
        date,
        description,
        amount: parseFloat(amount) || 0,
        currency: "INR",
        type,
        paymentMethod,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPreset = (vendor: string, cost: string, method: string) => {
    setDescription(vendor);
    setAmount(cost);
    setPaymentMethod(method);
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
        className="w-full max-w-lg bg-[#0c0d11] rounded-lg p-5 border border-[#22242b] shadow-2xl animate-in zoom-in-95 text-white cursor-default"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2029]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#050507] text-[#38bdf8] flex items-center justify-center border border-[#22242b]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Add Bank Transaction</h3>
              <p className="text-[11px] text-[#71717a]">Instant AI prediction & double-entry preview</p>
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

        {/* Quick Quickfill tags */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">Quick Fill:</span>
          <button
            type="button"
            onClick={() => loadPreset("AWS CLOUD SERVICES MUMBAI", "84200", "Corporate Card")}
            className="px-2 py-0.5 rounded-md bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer"
          >
            AWS Compute
          </button>
          <button
            type="button"
            onClick={() => loadPreset("UBER TRIP BANGALORE REF#88", "940", "UPI Transfer")}
            className="px-2 py-0.5 rounded-md bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer"
          >
            Uber Ride
          </button>
          <button
            type="button"
            onClick={() => loadPreset("STRIPE PAYOUT SETTLEMENT", "240000", "NEFT Direct Deposit")}
            className="px-2 py-0.5 rounded-md bg-[#050507] hover:bg-[#14151c] border border-[#22242b] text-[#d4d4d8] text-xs font-medium cursor-pointer"
          >
            Stripe Payout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
              Transaction Memo / Statement Line
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. AWS WEB SERVICES*1234 MUMBAI"
              className="w-full bg-[#050507] border border-[#22242b] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#388bfd] font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
                Amount (₹ INR)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="108432"
                className="w-full bg-[#050507] border border-[#22242b] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#388bfd] font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#050507] border border-[#22242b] rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#388bfd]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
                Transaction Type
              </label>
              <CustomSelect
                id="modal-tx-type"
                value={type}
                onChange={(val) => setType(val)}
                options={[
                  { value: "expense", label: "Expense", description: "Debit GL / Credit Bank" },
                  { value: "revenue", label: "Revenue", description: "Debit Bank / Credit GL" },
                ]}
                size="md"
                searchable={false}
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-[10px] text-[#71717a] mb-1">
                Payment Method
              </label>
              <CustomSelect
                id="modal-payment-method"
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
                options={[
                  { value: "Bank Transfer", label: "Bank Transfer / NEFT" },
                  { value: "Corporate Card", label: "Corporate Card" },
                  { value: "UPI Transfer", label: "UPI Transfer" },
                  { value: "Wire Transfer", label: "Wire Transfer" },
                ]}
                size="md"
                searchable={false}
              />
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[#38bdf8] text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
            <span>AI will automatically predict GL Category & draft a balanced journal entry.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[#1e2029]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[#22242b] bg-[#0c0d11] hover:bg-[#14151c] text-[#a1a1aa] hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Predicting..." : "Add & Predict GL"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
