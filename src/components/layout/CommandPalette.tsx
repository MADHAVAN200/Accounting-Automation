import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Command,
  FileText,
  CreditCard,
  BookOpen,
  Sliders,
  Users,
  GitCompare,
  Layers,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Plus,
  Shield,
  Globe,
  RotateCcw,
  Sun,
  Moon,
  ArrowRight,
  CheckCircle2,
  Building2,
  Hash,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Accounts" | "Compliance";
  subtitle?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onOpenCsvImport?: () => void;
  onOpenInvoiceUpload?: () => void;
  onOpenAddTransaction?: () => void;
  onOpenResetModal?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenFxModal?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCsvImport,
  onOpenInvoiceUpload,
  onOpenAddTransaction,
  onOpenResetModal,
  onOpenAuditTrail,
  onOpenFxModal,
  theme = "dark",
  onToggleTheme,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // 1. Navigation
    {
      id: "nav-dash",
      title: "Dashboard",
      category: "Navigation",
      subtitle: "Executive overview, runway, burn rate, and real-time cash flow",
      shortcut: "G D",
      icon: Building2,
      action: () => {
        onNavigate("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-tx",
      title: "Bank Transactions",
      category: "Navigation",
      subtitle: "Live HDFC & ICICI bank feeds with AI classification",
      shortcut: "G T",
      icon: CreditCard,
      action: () => {
        onNavigate("/transactions");
        onClose();
      },
    },
    {
      id: "nav-rules",
      title: "Auto-Posting Rules & Policies",
      category: "Navigation",
      subtitle: "Deterministic rule builder, 90-day simulator, and confidence thresholds",
      shortcut: "G R",
      icon: Sliders,
      action: () => {
        onNavigate("/rules");
        onClose();
      },
    },
    {
      id: "nav-invoices",
      title: "Invoices & Accounts Payable",
      category: "Navigation",
      subtitle: "Vendor bills, OCR parser, tax splits, and payment status",
      shortcut: "G I",
      icon: FileText,
      action: () => {
        onNavigate("/invoices");
        onClose();
      },
    },
    {
      id: "nav-vendors",
      title: "Vendor Directory & Tax Intelligence",
      category: "Navigation",
      subtitle: "TDS Section 194C/J calculator, PAN verification, and GSTR-2B ITC",
      shortcut: "G V",
      icon: Users,
      action: () => {
        onNavigate("/vendors");
        onClose();
      },
    },
    {
      id: "nav-rec",
      title: "3-Way Reconciliation Workspace",
      category: "Navigation",
      subtitle: "Multi-factor fuzzy matching between bank lines and invoices",
      shortcut: "G M",
      icon: GitCompare,
      action: () => {
        onNavigate("/reconciliation");
        onClose();
      },
    },
    {
      id: "nav-ledger",
      title: "General Ledger & Trial Balance",
      category: "Navigation",
      subtitle: "Double-entry journal vouchers, account history, and balance proof",
      shortcut: "G L",
      icon: BookOpen,
      action: () => {
        onNavigate("/ledger");
        onClose();
      },
    },
    {
      id: "nav-statements",
      title: "Financial Statements (P&L & Balance Sheet)",
      category: "Navigation",
      subtitle: "Automated Profit & Loss, Balance Sheet, and multi-tab Excel export",
      shortcut: "G S",
      icon: Layers,
      action: () => {
        onNavigate("/statements");
        onClose();
      },
    },
    {
      id: "nav-copilot",
      title: "AI Financial Copilot",
      category: "Navigation",
      subtitle: "Natural language SQL-grounded queries across real ledger books",
      shortcut: "G C",
      icon: Sparkles,
      action: () => {
        onNavigate("/ai-copilot");
        onClose();
      },
    },

    // 2. Actions
    {
      id: "act-upload-inv",
      title: "Upload Vendor Bill (OCR)",
      category: "Actions",
      subtitle: "Extract vendor, amount, GST, and terms via instant OCR parser",
      shortcut: "U",
      icon: Upload,
      action: () => {
        onClose();
        onOpenInvoiceUpload?.();
      },
    },
    {
      id: "act-import-csv",
      title: "Import Bank Statement (Excel / CSV)",
      category: "Actions",
      subtitle: "Ingest statement with SHA-256 deduplication and auto-classification",
      shortcut: "I",
      icon: FileSpreadsheet,
      action: () => {
        onClose();
        onOpenCsvImport?.();
      },
    },
    {
      id: "act-add-tx",
      title: "Add Manual Bank Transaction",
      category: "Actions",
      subtitle: "Record manual outflow or inflow directly to bank feed",
      shortcut: "N",
      icon: Plus,
      action: () => {
        onClose();
        onOpenAddTransaction?.();
      },
    },
    {
      id: "act-audit-trail",
      title: "View Cryptographic Audit Trail",
      category: "Actions",
      subtitle: "Inspect SHA-256 blockchain-style immutable ledger timeline",
      shortcut: "A",
      icon: Shield,
      action: () => {
        onClose();
        onOpenAuditTrail?.();
      },
    },
    {
      id: "act-fx-rates",
      title: "Foreign Exchange Rates & FX Gain/Loss",
      category: "Actions",
      subtitle: "Live USD, EUR, GBP rates and booking vs settlement gain/loss calculation",
      shortcut: "F",
      icon: Globe,
      action: () => {
        onClose();
        onOpenFxModal?.();
      },
    },
    {
      id: "act-toggle-theme",
      title: theme === "light" ? "Switch to Black Mode (OLED)" : "Switch to White Mode (Light)",
      category: "Actions",
      subtitle: "Toggle high-contrast black or clean crisp white interface theme",
      shortcut: "T",
      icon: theme === "light" ? Moon : Sun,
      action: () => {
        onClose();
        onToggleTheme?.();
      },
    },
    {
      id: "act-reset-app",
      title: "Reset Application Data",
      category: "Actions",
      subtitle: "Restore demo SQLite database to clean balanced baseline state",
      icon: RotateCcw,
      action: () => {
        onClose();
        onOpenResetModal?.();
      },
    },

    // 3. Key Chart of Accounts (Quick Inspection)
    {
      id: "coa-1010",
      title: "Account 1010: HDFC Bank Operating",
      category: "Accounts",
      subtitle: "Current Asset · Primary operating cash account",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=1010");
        onClose();
      },
    },
    {
      id: "coa-1020",
      title: "Account 1020: ICICI Treasury Reserve",
      category: "Accounts",
      subtitle: "Current Asset · Interest-bearing reserve treasury",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=1020");
        onClose();
      },
    },
    {
      id: "coa-2000",
      title: "Account 2000: Accounts Payable",
      category: "Accounts",
      subtitle: "Current Liability · Outstanding vendor liabilities",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=2000");
        onClose();
      },
    },
    {
      id: "coa-4000",
      title: "Account 4000: SaaS Subscription Revenue",
      category: "Accounts",
      subtitle: "Revenue · Operating recurring revenue from clients",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=4000");
        onClose();
      },
    },
    {
      id: "coa-6100",
      title: "Account 6100: Cloud Infrastructure",
      category: "Accounts",
      subtitle: "Operating Expense · AWS, Google Cloud, Azure compute & database",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=6100");
        onClose();
      },
    },
    {
      id: "coa-6200",
      title: "Account 6200: Software & Subscriptions",
      category: "Accounts",
      subtitle: "Operating Expense · Slack, GitHub, Figma, Linear, Notion",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=6200");
        onClose();
      },
    },
    {
      id: "coa-6400",
      title: "Account 6400: Payroll & Contractor Fees",
      category: "Accounts",
      subtitle: "Operating Expense · Employee compensation & consulting",
      icon: Hash,
      action: () => {
        onNavigate("/ledger?account=6400");
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-start justify-center pt-16 sm:pt-24 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[75vh]",
          theme === "light"
            ? "bg-white border-slate-200 text-slate-900"
            : "bg-[#0c0d11] border-[#22242b] text-white"
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3.5 border-b",
            theme === "light" ? "border-slate-200 bg-slate-50" : "border-[#1e2029] bg-[#050507]"
          )}
        >
          <Search className={cn("w-4 h-4 shrink-0", theme === "light" ? "text-slate-400" : "text-zinc-400")} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages, actions, accounts, or statements... (e.g. 'P&L', 'Rules', 'Upload')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className={cn(
              "w-full bg-transparent text-sm focus:outline-none placeholder:text-zinc-500",
              theme === "light" ? "text-slate-900" : "text-white"
            )}
          />
          <kbd
            className={cn(
              "hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border",
              theme === "light"
                ? "bg-white text-slate-500 border-slate-300"
                : "bg-[#14151c] text-zinc-400 border-[#272935]"
            )}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-transparent space-y-1"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <p className={cn("text-xs", theme === "light" ? "text-slate-500" : "text-zinc-400")}>
                No commands or views found for "{query}"
              </p>
              <p className={cn("text-[11px] mt-1", theme === "light" ? "text-slate-400" : "text-zinc-600")}>
                Try searching for "Transactions", "Rules", "Statements", "Invoices", or "TDS"
              </p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-index={index}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors group",
                    isSelected
                      ? theme === "light"
                        ? "bg-blue-50 text-blue-900 border border-blue-200"
                        : "bg-[#14151c] text-white border border-[#272935]"
                      : theme === "light"
                      ? "hover:bg-slate-50 text-slate-700"
                      : "hover:bg-[#0f1015] text-zinc-300"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "p-2 rounded-md border shrink-0",
                        isSelected
                          ? theme === "light"
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-[#2563eb] text-white border-blue-500/40"
                          : theme === "light"
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-[#14151c] text-zinc-400 border-[#22242b]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border",
                            item.category === "Navigation"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : item.category === "Actions"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          )}
                        >
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p
                          className={cn(
                            "text-[11px] truncate mt-0.5",
                            theme === "light" ? "text-slate-500" : "text-zinc-400"
                          )}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.shortcut && (
                      <kbd
                        className={cn(
                          "hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border",
                          theme === "light"
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-[#050507] text-zinc-400 border-[#22242b]"
                        )}
                      >
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        isSelected ? "translate-x-0.5 opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div
          className={cn(
            "px-4 py-2 border-t flex items-center justify-between text-[11px]",
            theme === "light"
              ? "bg-slate-50 border-slate-200 text-slate-500"
              : "bg-[#050507] border-[#1e2029] text-zinc-500"
          )}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-semibold">↑</kbd> <kbd className="font-semibold">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="font-semibold">↵</kbd> to select
            </span>
          </div>
          <span className="font-medium text-[10px]">LedgerAI Enterprise Hub</span>
        </div>
      </div>
    </div>
  );
};
