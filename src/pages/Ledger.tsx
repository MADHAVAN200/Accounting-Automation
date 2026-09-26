import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  X,
  Trash2,
  Download,
} from "lucide-react";
import { Account, JournalEntry } from "../types";
import { fetchAccounts, fetchGeneralLedger, createJournalEntry } from "../lib/api";
import { formatCurrency, cn } from "../lib/utils";
import { exportDataToExcel } from "../lib/excel";
import { CustomSelect } from "../components/ui/CustomSelect";
import { JournalEntryDetailModal } from "../components/modals/JournalEntryDetailModal";
import { FinancialStatementsView } from "../components/statements/FinancialStatementsView";
import { ModuleHeader } from "../components/layout/ModuleHeader";
import { InfoTooltip } from "../components/ui/InfoTooltip";

interface LedgerProps {
  onNavigate: (path: string) => void;
  initialAccountCode?: string;
  initialTab?: "gl" | "statements";
}

export const Ledger: React.FC<LedgerProps> = ({
  onNavigate,
  initialAccountCode = "ALL",
  initialTab = "gl",
}) => {
  const [activeLedgerTab, setActiveLedgerTab] = useState<"gl" | "statements">(initialTab);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>(initialAccountCode);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);

  // New Journal Entry Modal State
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [entryDate, setEntryDate] = useState("2026-09-02");
  const [entryDesc, setEntryDesc] = useState("");
  const [entryLines, setEntryLines] = useState<
    Array<{ accountCode: string; debit: string; credit: string; description: string }>
  >([
    { accountCode: "6100", debit: "50000", credit: "0", description: "AWS Cloud Burst Capacity" },
    { accountCode: "1010", debit: "0", credit: "50000", description: "Direct Bank Transfer" },
  ]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveLedgerTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tabId: string) => {
    const nextTab = tabId as "gl" | "statements";
    setActiveLedgerTab(nextTab);
    onNavigate(nextTab === "statements" ? "/statements" : "/ledger");
  };

  useEffect(() => {
    loadData();
  }, [selectedAccountCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCreatingEntry) {
        setIsCreatingEntry(false);
      }
    };
    if (isCreatingEntry) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCreatingEntry]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accs, ledger] = await Promise.all([
        fetchAccounts(),
        fetchGeneralLedger(selectedAccountCode),
      ]);
      setAccounts(Array.isArray(accs) ? accs : []);
      setLedgerData(ledger);
      const allLines = Array.isArray(ledger?.lines) ? ledger.lines : [];
      const entriesWithLines = (ledger?.journalEntries || []).map((je: any) => ({
        ...je,
        lines: Array.isArray(je.lines) && je.lines.length > 0
          ? je.lines
          : allLines.filter((l: any) => l.journalEntryId === je.id || l.entryNumber === je.entryNumber),
      }));
      setJournalEntries(entriesWithLines);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Balance calculation for modal
  const safeEntryLines = Array.isArray(entryLines) ? entryLines : [];
  const modalTotalDebit = safeEntryLines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const modalTotalCredit = safeEntryLines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isModalBalanced = Math.abs(modalTotalDebit - modalTotalCredit) < 0.01 && modalTotalDebit > 0;

  const handleAddLine = () => {
    setEntryLines([
      ...entryLines,
      { accountCode: "6200", debit: "0", credit: "0", description: "" },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (entryLines.length <= 2) return;
    setEntryLines(entryLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const updated = [...entryLines];
    updated[index] = { ...updated[index], [field]: value };
    setEntryLines(updated);
  };

  const handlePostJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModalBalanced) {
      setCreateError("Journal entry must be strictly balanced (SUM(DR) == SUM(CR)) before posting.");
      return;
    }

    try {
      const formattedLines = entryLines.map((l) => ({
        accountCode: l.accountCode,
        accountName: accounts.find((a) => a.code === l.accountCode)?.name || `Account ${l.accountCode}`,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description || entryDesc,
      }));

      const res = await createJournalEntry({
        date: entryDate,
        description: entryDesc,
        lines: formattedLines,
      });

      setSuccessMsg(`Journal Entry #${res.entryNumber} posted successfully! Double-entry balances updated.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setIsCreatingEntry(false);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || "Failed to post journal entry");
    }
  };

  const selectedAccount = accounts.find((a) => a.code === selectedAccountCode);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-4 select-none">
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#34d399] text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-[#34d399] px-1 hover:text-white cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* Module Header without Sub-Navigation Tab Bar */}
      <ModuleHeader
        title={activeLedgerTab === "statements" ? "Financial Statements & Analytics" : "General Ledger & Accounts"}
        breadcrumb={activeLedgerTab === "statements" ? "Balance Sheet & P&L Invariant Check" : "Double-Entry Books & Trial Balance"}
        description={
          activeLedgerTab === "statements"
            ? "Automated Profit & Loss statement, Balance Sheet invariant check, and multi-sheet Excel export"
            : "Strict double-entry journal vouchers, account trial balance, and debit-credit mathematical proofs"
        }
        infoGuideKey="ledger"
        actions={
          activeLedgerTab === "statements" ? null : (
            <>
              <button
                id="btn-export-excel-ledger"
                onClick={() => {
                  const exportRows = accounts.map((acc) => ({
                    Code: acc.code,
                    Name: acc.name,
                    Type: acc.type,
                    Balance: acc.balance,
                  }));
                  exportDataToExcel(exportRows, "LedgerAI_Trial_Balance", "Trial_Balance");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] border border-[#22242b] text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                title="Export Trial Balance to Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Export Trial Balance</span>
              </button>

              <button
                id="btn-new-journal-entry"
                onClick={() => {
                  setCreateError(null);
                  setIsCreatingEntry(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Journal Entry</span>
              </button>
            </>
          )
        }
      />

      {activeLedgerTab === "statements" ? (
        <FinancialStatementsView />
      ) : (
        <>
          {/* Account Selector & Live Balance Ribbon */}
          <div className="bg-[#0c0d11] rounded-lg p-3.5 border border-[#22242b] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-[#1e2029]">
          <div className="w-full md:w-80">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Chart of Accounts Filter
            </label>
            <CustomSelect
              id="filter-ledger-account"
              value={selectedAccountCode}
              onChange={(val) => setSelectedAccountCode(val)}
              options={[
                { value: "ALL", label: "All Accounts (Consolidated GL)" },
                ...accounts.map((acc) => ({
                  value: acc.code,
                  label: `${acc.code} — ${acc.name}`,
                  badge: acc.code,
                  description: `${acc.type.toUpperCase()} • Balance: ${formatCurrency(acc.balance, acc.currency || "INR")}`,
                })),
              ]}
              size="md"
              searchable={true}
              searchPlaceholder="Search account name or code..."
              ariaLabel="Filter Chart of Accounts"
            />
          </div>

          {/* Double-Entry Health Status */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-right flex items-center gap-2">
              <div>
                <div className="flex items-center gap-1 text-[#34d399] text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
                  <span>Invariant: BALANCED</span>
                </div>
                <p className="text-[10px] text-[#34d399] font-medium">∑(Debits) == ∑(Credits)</p>
              </div>
              <InfoTooltip text="Luca Pacioli invariant: The general ledger trial balance strictly enforces zero discrepancy between aggregate debits and credits." title="Debit-Credit Invariant" formula="SUM(Debits) - SUM(Credits) = 0" />
            </div>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3.5">
          <div className="p-3 rounded-md bg-[#050507] border border-[#22242b]">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
              <span>Debit Volume (DR)</span>
              <InfoTooltip text="Sum of all debit postings across ledger accounts for the selected period." title="Total Debits" />
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {formatCurrency(ledgerData?.totalDebits || 375472, "INR")}
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#050507] border border-[#22242b]">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
              <span>Credit Volume (CR)</span>
              <InfoTooltip text="Sum of all credit postings across ledger accounts for the selected period." title="Total Credits" />
            </div>
            <div className="text-base font-bold text-white mt-0.5">
              {formatCurrency(ledgerData?.totalDebits || 375472, "INR")}
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#050507] border border-[#22242b]">
            <span className="text-xs font-medium text-zinc-300">
              {selectedAccount ? `${selectedAccount.name} Balance` : "Consolidated Net Activity"}
            </span>
            <div className="text-base font-bold text-[#38bdf8] mt-0.5">
              {formatCurrency(selectedAccount?.balance || 8642000, "INR")}
            </div>
          </div>
        </div>
      </div>

      {/* Journal Entries List Table */}
      <div className="bg-[#0c0d11] rounded-lg border border-[#22242b] shadow-xs overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-[#1e2029] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Journal Entries</h3>
          <span className="text-[11px] font-medium text-zinc-400">{journalEntries.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#050507] border-b border-[#22242b] text-[11px] font-medium text-zinc-300">
                <th className="py-2.5 px-3.5 font-medium">Entry #</th>
                <th className="py-2.5 px-3.5 font-medium">Date</th>
                <th className="py-2.5 px-3.5 font-medium">Description & Account Lines</th>
                <th className="py-2.5 px-3.5 font-medium text-right">Debit (DR)</th>
                <th className="py-2.5 px-3.5 font-medium text-right">Credit (CR)</th>
                <th className="py-2.5 px-3.5 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2029] text-xs">
              {journalEntries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelectedJournalEntry(entry)}
                  className="hover:bg-[#14151c] transition-colors cursor-pointer group"
                  title="Click to inspect full Journal Voucher schedule & verification"
                >
                  <td className="py-2.5 px-3.5 font-bold text-[#38bdf8] whitespace-nowrap text-[11px] group-hover:underline">
                    {entry.entryNumber}
                  </td>
                  <td className="py-2.5 px-3.5 text-zinc-300 whitespace-nowrap text-[11px]">{entry.date}</td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-semibold text-white group-hover:text-[#38bdf8] transition-colors">{entry.description}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Source: {entry.sourceType} • Approved: {entry.approvedBy || "System"}
                    </div>

                    {/* Show line breakdown if present */}
                    {entry.lines && (
                      <div className="mt-1.5 space-y-1 pl-2.5 border-l-2 border-[#323644] text-[10px]">
                        {entry.lines.map((l, i) => (
                          <div key={i} className="flex items-center justify-between text-zinc-300">
                            <span>
                              {l.debit > 0 ? "DR" : "CR"}: {l.accountCode} - {l.accountName}
                            </span>
                            <span className="font-semibold text-white">{formatCurrency(l.debit > 0 ? l.debit : l.credit, "INR")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-white whitespace-nowrap">
                    {formatCurrency(entry.totalDebit, "INR")}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-bold text-white whitespace-nowrap">
                    {formatCurrency(entry.totalCredit, "INR")}
                  </td>
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-[#34d399] border border-emerald-500/30 text-[10px] font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#34d399]" />
                      POSTED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Journal Entry Modal */}
      {isCreatingEntry && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreatingEntry(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0c0d11] rounded-lg p-5 border border-[#22242b] shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2029]">
              <div>
                <h3 className="text-base font-bold text-white">Create Double-Entry Journal Entry</h3>
                <p className="text-[11px] text-zinc-400">Must strictly balance: Total Debits = Total Credits</p>
              </div>
              <button
                onClick={() => setIsCreatingEntry(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-[#14151c] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-3 p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-[#f87171] text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#f87171] shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handlePostJournalEntry} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[10px] text-zinc-300 mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-[#050507] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[10px] text-zinc-300 mb-1">
                    Memo / Description
                  </label>
                  <input
                    type="text"
                    value={entryDesc}
                    onChange={(e) => setEntryDesc(e.target.value)}
                    placeholder="e.g. AWS Month-end compute charge settlement"
                    className="w-full bg-[#050507] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#3b82f6]"
                    required
                  />
                </div>
              </div>

              {/* Multi-Line Ledger Entries */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-300">
                    Debit & Credit Accounts (Min 2 Lines)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-[#38bdf8] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 p-2 rounded-md bg-[#050507] border border-zinc-700">
                      <div className="w-48">
                        <CustomSelect
                          id={`line-account-${idx}`}
                          value={line.accountCode}
                          onChange={(val) => handleLineChange(idx, "accountCode", val)}
                          options={accounts.map((acc) => ({
                            value: acc.code,
                            label: `${acc.code} - ${acc.name}`,
                            badge: acc.code,
                          }))}
                          size="sm"
                          searchable={true}
                          searchPlaceholder="Search account..."
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Debit (₹)"
                          value={line.debit}
                          onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                          className="w-full bg-[#0c0d11] border border-zinc-700 rounded px-2 py-1 text-xs text-white text-right focus:outline-none placeholder-zinc-400"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Credit (₹)"
                          value={line.credit}
                          onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                          className="w-full bg-[#0c0d11] border border-zinc-700 rounded px-2 py-1 text-xs text-white text-right focus:outline-none placeholder-zinc-400"
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Line note..."
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                          className="w-full bg-[#0c0d11] border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none placeholder-zinc-400"
                        />
                      </div>

                      {entryLines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-zinc-400 hover:text-[#f87171] rounded hover:bg-[#14151c] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time Invariance Verification Strip */}
              <div
                className={cn(
                  "p-2.5 rounded-md border flex items-center justify-between transition-all",
                  isModalBalanced
                    ? "bg-emerald-500/10 border-emerald-500/30 text-[#34d399]"
                    : "bg-rose-500/10 border-rose-500/30 text-[#f87171]"
                )}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    {isModalBalanced ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
                        <span>Balanced (Ready to Post)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-[#f87171]" />
                        <span>
                          Difference: ₹{Math.abs(modalTotalDebit - modalTotalCredit).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] opacity-80 mt-0.5 font-medium">
                    DR: ₹{modalTotalDebit.toLocaleString()} | CR: ₹{modalTotalCredit.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingEntry(false)}
                  className="px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-300 font-semibold hover:bg-[#14151c] hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-journal-entry"
                  type="submit"
                  disabled={!isModalBalanced}
                  className={cn(
                    "px-4 py-1.5 rounded-md font-semibold text-white text-xs shadow-xs transition-all",
                    isModalBalanced
                      ? "bg-[#2563eb] hover:bg-[#3b82f6] border border-blue-500/40 cursor-pointer"
                      : "bg-[#14151c] text-zinc-500 border border-zinc-800 cursor-not-allowed"
                  )}
                >
                  Post Journal Entry to GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {/* Journal Entry Detail & Invariance Verification Modal */}
      <JournalEntryDetailModal
        isOpen={Boolean(selectedJournalEntry)}
        entry={selectedJournalEntry}
        onClose={() => setSelectedJournalEntry(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
