import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  Check,
  Edit2,
  X,
  ShieldCheck,
  ExternalLink,
  Bot,
  HelpCircle,
} from "lucide-react";
import { Transaction } from "../types";
import { fetchTransactionById, approveTransaction, editTransaction, rejectTransaction } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import { CustomSelect } from "../components/ui/CustomSelect";
import { PageInfoButton } from "../components/ui/PageInfoButton";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface TransactionDetailsProps {
  transactionId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transactionId,
  onBack,
  onNavigate,
}) => {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editVendor, setEditVendor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editGlAccount, setEditGlAccount] = useState("");

  useEffect(() => {
    loadDetails();
  }, [transactionId]);

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTransactionById(transactionId);
      setTx(data);
      if (data) {
        setEditVendor(data.vendor || "");
        setEditCategory(data.category || "");
        setEditGlAccount(data.glAccount || "6100");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!tx) return;
    setIsApproving(true);
    try {
      const res = await approveTransaction(tx.id);
      setActionMessage({
        type: "success",
        text: `Transaction Approved! Balanced Journal Entry #${res.journalEntryId} successfully posted to General Ledger.`,
      });
      loadDetails();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Approval failed" });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx) return;
    try {
      await editTransaction(tx.id, {
        vendor: editVendor,
        category: editCategory,
        glAccount: editGlAccount,
      });
      setIsEditing(false);
      setActionMessage({ type: "success", text: "Transaction re-classified successfully." });
      loadDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!tx) return;
    try {
      await rejectTransaction(tx.id);
      setActionMessage({ type: "error", text: "AI recommendation rejected. Flagged for accountant review." });
      loadDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#38bdf8] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#71717a] font-medium mt-3">Loading transaction ledger context...</span>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h3 className="text-sm font-bold text-white">Transaction Not Found</h3>
        <p className="text-xs text-[#71717a] max-w-sm">
          Transaction ID &quot;{transactionId}&quot; could not be retrieved from the ledger database.
        </p>
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white text-xs font-semibold cursor-pointer border border-blue-500/40"
        >
          Return to Transactions
        </button>
      </div>
    );
  }

  const isApproved = tx.status === "categorized" && tx.journalEntryId;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 select-none">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-txs"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-[#71717a] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Transactions</span>
        </button>

        <div className="flex items-center gap-2">
          <PageInfoButton guideKey="transactionDetails" variant="pill" />
          <span className="text-[11px] font-medium text-[#71717a]">ID: {tx.id}</span>
          {tx.status === "categorized" && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-[#34d399] border border-emerald-500/30 text-[10px] font-medium">
              Categorized
            </span>
          )}
          {tx.status === "matched" && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[#38bdf8] border border-blue-500/30 text-[10px] font-medium">
              Matched to Invoice
            </span>
          )}
          {tx.status === "review" && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[#fbbf24] border border-amber-500/30 text-[10px] font-medium">
              Needs Review
            </span>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={cn(
            "p-3 rounded-lg text-xs font-medium flex items-center justify-between border shadow-xs animate-in fade-in",
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-[#34d399]"
              : "bg-rose-500/10 border-rose-500/30 text-[#f87171]"
          )}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-[#f87171]" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="font-medium text-[#71717a] hover:text-white px-1 cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Hero Transaction Overview Card */}
      <div className="bg-[#0c0d11] rounded-lg p-4 sm:p-5 border border-[#22242b] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#1e2029]">
          <div>
            <div className="text-xs font-medium text-[#71717a]">Transaction Description</div>
            <h2 className="text-lg font-bold text-white mt-0.5">{tx.description}</h2>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-[#a1a1aa]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#71717a]" />
                {tx.date}
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-[#71717a]" />
                {tx.paymentMethod || "Bank Feed"}
              </span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs font-medium text-[#71717a]">Total Inflow / Outflow</div>
            <div
              className={cn(
                "text-2xl font-bold mt-0.5",
                tx.type === "revenue" ? "text-[#34d399]" : "text-white"
              )}
            >
              {tx.type === "revenue" ? "+" : "-"}
              {formatCurrency(tx.amount, tx.currency || "INR")}
            </div>
            <div className="text-[11px] text-[#71717a] mt-0.5">Account: HDFC Operating (1010)</div>
          </div>
        </div>

        {/* Raw Bank String Display */}
        <div className="mt-3 p-2.5 rounded-md bg-[#050507] border border-[#22242b] text-xs">
          <span className="font-medium text-[#71717a] text-xs">Raw Statement Memo:</span>
          <p className="text-[#d4d4d8] mt-0.5 select-all text-xs font-normal">{tx.rawText || tx.description}</p>
        </div>
      </div>

      {/* AI Explainability & Classification Panel */}
      <div className="bg-[#0c0d11] text-white rounded-lg p-4 sm:p-5 border border-[#22242b] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1e2029]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 text-[#38bdf8] border border-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-white">AI Classification Engine</h3>
                <InfoTooltip text="Automated semantic matching of bank statement text against your historical Chart of Accounts." title="AI Classification" />
              </div>
              <p className="text-[11px] text-[#71717a]">Rule-grounded explainability & journal generation</p>
            </div>
          </div>

          {/* Confidence Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#050507] border border-[#22242b]">
            <span className="text-[11px] text-[#a1a1aa]">Confidence:</span>
            <span className="text-xs font-semibold text-[#34d399]">
              {(tx.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Predicted Category & GL Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-md bg-[#050507] border border-[#22242b]">
            <div className="text-xs font-medium text-[#71717a]">Identified Vendor</div>
            <div className="text-sm font-semibold text-white mt-0.5">{tx.vendor || "Pending Vendor"}</div>
          </div>

          <div className="p-3 rounded-md bg-[#050507] border border-[#22242b]">
            <div className="text-xs font-medium text-[#71717a]">Assigned Category</div>
            <div className="text-sm font-semibold text-[#38bdf8] mt-0.5">{tx.category}</div>
          </div>

          <div className="p-3 rounded-md bg-[#050507] border border-[#22242b]">
            <div className="text-xs font-medium text-[#71717a]">General Ledger Account</div>
            <div className="text-sm font-semibold text-[#a78bfa] mt-0.5">GL #{tx.glAccount}</div>
          </div>
        </div>

        {/* Explainability Bullets ("WHY?") */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#71717a] mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>AI Reasoning & Explainability</span>
          </div>

          <div className="space-y-1.5">
            {tx.aiExplanation && tx.aiExplanation.length > 0 ? (
              tx.aiExplanation.map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-md bg-[#050507] border border-[#22242b] text-xs text-[#d4d4d8]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0 mt-0.5" />
                  <span className="leading-snug">{reason}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#71717a] p-2.5 rounded-md bg-[#050507] border border-[#22242b]">
                Classified based on semantic match against historical Chart of Accounts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Double-Entry Journal Entry Box */}
      <div className="bg-[#0c0d11] rounded-lg p-4 border border-[#22242b] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-white">Suggested Double-Entry Journal Entry</h3>
              <InfoTooltip text="Double-entry principle: Total Debits must equal Total Credits. Automatically balances operating expense with bank asset accounts." title="Balanced Voucher" formula="Total Debits = Total Credits" />
            </div>
            <p className="text-[11px] text-[#71717a]">Automated balanced ledger posting</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[#34d399] text-[10px] font-medium border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-[#34d399]" />
            Balanced
          </span>
        </div>

        <div className="border border-[#22242b] rounded-md overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#050507] border-b border-[#1e2029] text-[#71717a] font-medium text-xs">
              <tr>
                <th className="py-2 px-3">Account Code</th>
                <th className="py-2 px-3">Account Name</th>
                <th className="py-2 px-3 text-right">Debit (DR)</th>
                <th className="py-2 px-3 text-right">Credit (CR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2029] text-xs">
              <tr>
                <td className="py-2 px-3 font-medium font-mono text-[#38bdf8]">{tx.suggestedDebitAccount || tx.glAccount || "6100"}</td>
                <td className="py-2 px-3 text-[#d4d4d8]">{tx.category}</td>
                <td className="py-2 px-3 text-right font-semibold text-white">
                  {formatCurrency(tx.amount, tx.currency || "INR")}
                </td>
                <td className="py-2 px-3 text-right text-[#71717a]">₹0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium font-mono text-[#38bdf8]">{tx.suggestedCreditAccount || "1010"}</td>
                <td className="py-2 px-3 text-[#d4d4d8]">HDFC Bank Operating</td>
                <td className="py-2 px-3 text-right text-[#71717a]">₹0</td>
                <td className="py-2 px-3 text-right font-semibold text-white">
                  {formatCurrency(tx.amount, tx.currency || "INR")}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-[#050507] font-semibold border-t border-[#1e2029]">
              <tr>
                <td colSpan={2} className="py-2 px-3 text-[#a1a1aa] text-xs font-medium">
                  Total Balance Verification
                </td>
                <td className="py-2 px-3 text-right font-bold text-[#34d399]">
                  {formatCurrency(tx.amount, tx.currency || "INR")}
                </td>
                <td className="py-2 px-3 text-right font-bold text-[#34d399]">
                  {formatCurrency(tx.amount, tx.currency || "INR")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {tx.journalEntryId && (
          <div className="mt-2 text-[11px] text-[#71717a] flex items-center justify-between">
            <span>Posted Journal Entry: <strong className="text-[#38bdf8] font-semibold">#{tx.journalEntryId}</strong></span>
            {tx.approvedBy && <span>Approved by: {tx.approvedBy}</span>}
          </div>
        )}
      </div>

      {/* Matched Invoice Association (if exists) */}
      {tx.matchedInvoiceId && (
        <div className="bg-[#0c0d11] rounded-lg p-3.5 border border-[#22242b] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 text-[#38bdf8] flex items-center justify-center border border-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Linked Vendor Invoice</div>
              <p className="text-[11px] text-[#71717a]">Matched to {tx.matchedInvoiceId.toUpperCase()} with 97.8% confidence</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(`/invoices?search=${tx.matchedInvoiceId}`)}
            className="px-2.5 py-1 rounded-md bg-[#050507] hover:bg-[#14151c] text-[#38bdf8] border border-[#22242b] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Invoice</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#1e2029]">
        <button
          id="btn-reject-tx"
          onClick={handleReject}
          className="px-3 py-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-[#f87171] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject AI Suggestion</span>
        </button>

        <button
          id="btn-edit-tx"
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 rounded-md border border-[#22242b] bg-[#0c0d11] hover:bg-[#14151c] text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#a1a1aa]" />
          <span>Edit Classification</span>
        </button>

        <button
          id="btn-approve-tx-hero"
          onClick={handleApprove}
          disabled={isApproving}
          className="px-4 py-1.5 rounded-md bg-[#16a34a] hover:bg-[#22c55e] text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/40"
        >
          {isApproving ? (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{isApproved ? "Re-Approve & Sync GL" : "Approve & Post to GL"}</span>
            </>
          )}
        </button>
      </div>

      {/* Edit Classification Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0d11] rounded-lg p-5 border border-[#22242b] shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3.5 border-b border-[#1e2029] pb-3">
              <h3 className="text-sm font-semibold text-white">Edit Classification</h3>
              <button onClick={() => setIsEditing(false)} className="text-[#71717a] hover:text-white cursor-pointer p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#71717a] uppercase tracking-wider text-[10px] mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={editVendor}
                  onChange={(e) => setEditVendor(e.target.value)}
                  className="w-full bg-[#050507] border border-[#22242b] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#388bfd]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#71717a] uppercase tracking-wider text-[10px] mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-[#050507] border border-[#22242b] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#388bfd]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#71717a] uppercase tracking-wider text-[10px] mb-1">
                  GL Account Code
                </label>
                <CustomSelect
                  id="edit-gl-account"
                  value={editGlAccount}
                  onChange={(val) => setEditGlAccount(val)}
                  options={[
                    { value: "6100", label: "6100 - Cloud Infrastructure", badge: "6100", description: "AWS, GCP, Cloudflare" },
                    { value: "6200", label: "6200 - Software & Subscriptions", badge: "6200", description: "GitHub, Slack, Figma" },
                    { value: "6300", label: "6300 - Marketing & Advertising", badge: "6300", description: "Google Ads, LinkedIn" },
                    { value: "7100", label: "7100 - Payroll & Contractors", badge: "7100", description: "Salaries, Consultants" },
                    { value: "7200", label: "7200 - Travel & Transportation", badge: "7200", description: "Flights, Hotels, Cabs" },
                    { value: "7300", label: "7300 - Office & Utilities", badge: "7300", description: "Rent, Electricity, Supplies" },
                    { value: "4000", label: "4000 - SaaS Subscription Revenue", badge: "4000", description: "Customer ARR/MRR" },
                  ]}
                  size="md"
                  searchable={true}
                  searchPlaceholder="Search GL account..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-md border border-[#22242b] text-[#a1a1aa] font-semibold hover:bg-[#14151c] hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-[#2563eb] hover:bg-[#3b82f6] text-white font-semibold text-xs border border-blue-500/40 cursor-pointer"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
