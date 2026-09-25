import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  RotateCcw,
  ChevronDown,
  Plus,
  Shield,
  Globe,
  Sparkles,
  Layers,
  Sliders,
  Users,
  CreditCard,
  FileText,
  GitCompare,
  BookOpen,
  Building2,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavbarProps {
  title?: string;
  subtitle?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  onLogout?: () => void;
  onOpenCopilot?: () => void;
  onOpenCsvImport?: () => void;
  onOpenInvoiceUpload?: () => void;
  onOpenAddTransaction?: () => void;
  onOpenResetModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenFxModal?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  badgeCounts?: {
    transactionsReview?: number;
    invoicesOpen?: number;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath = "/dashboard",
  onNavigate,
  onLogout,
  onOpenCopilot,
  onOpenCsvImport,
  onOpenInvoiceUpload,
  onOpenAddTransaction,
  onOpenResetModal,
  onOpenCommandPalette,
  onOpenAuditTrail,
  onOpenFxModal,
  theme = "dark",
  onToggleTheme,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNav = (path: string) => {
    onNavigate?.(path);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setIsActionMenuOpen(false);
  };

  const currentBase = currentPath.split("?")[0].split("#")[0];

  return (
    <header
      className={cn(
        "border-b shrink-0 select-none z-30 sticky top-0 transition-colors",
        theme === "light"
          ? "bg-white text-slate-900 border-slate-200"
          : "bg-[#000000] text-[#f4f4f5] border-[#1e2029]"
      )}
    >
      {/* Primary Top Bar */}
      <div className="h-13 px-3 sm:px-5 lg:px-7 flex items-center justify-between gap-2.5 w-full">
        {/* Left: Brand Logo + Desktop Nav Group */}
        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          {/* Brand Logo */}
          <div
            id="brand-logo"
            onClick={() => handleNav("/dashboard")}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <div
              className={cn(
                "w-7 h-7 rounded-md border flex items-center justify-center font-bold text-xs shadow-xs transition-colors",
                theme === "light"
                  ? "bg-blue-600 border-blue-700 text-white"
                  : "bg-[#0c0d11] border-[#22242b] text-[#38bdf8] group-hover:bg-[#14151c]"
              )}
            >
              LA
            </div>
            <div className="flex items-baseline">
              <span
                className={cn(
                  "font-bold text-sm tracking-tight",
                  theme === "light" ? "text-slate-900" : "text-white"
                )}
              >
                LedgerAI
              </span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          {onNavigate && (
            <nav className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
              {/* 1. Dashboard */}
              <button
                id="nav-top-dashboard"
                onClick={() => handleNav("/dashboard")}
                className={cn(
                  "h-8 flex items-center px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                  currentBase === "/dashboard"
                    ? theme === "light"
                      ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200"
                      : "bg-[#14151c] text-white font-semibold border border-[#272935] shadow-xs"
                    : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#0c0d11]"
                )}
              >
                Dashboard
              </button>

              {/* 2. Transactions Dropdown (Bank Feed + Rules Engine) */}
              <div className="relative">
                <button
                  id="nav-top-transactions-group"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "transactions" ? null : "transactions")
                  }
                  className={cn(
                    "h-8 flex items-center gap-1 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    currentBase === "/transactions" || currentBase === "/rules"
                      ? theme === "light"
                        ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200"
                        : "bg-[#14151c] text-white font-semibold border border-[#272935] shadow-xs"
                      : theme === "light"
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#0c0d11]"
                  )}
                >
                  <span>Transactions</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {openDropdown === "transactions" && (
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-56 rounded-lg border shadow-xl p-1 z-40 animate-in fade-in zoom-in-95",
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-900"
                        : "bg-[#0c0d11] border-[#22242b] text-white"
                    )}
                  >
                    <button
                      onClick={() => handleNav("/transactions")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                        currentBase === "/transactions"
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "bg-[#14151c] text-white font-semibold"
                          : theme === "light"
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-[#14151c] text-zinc-300"
                      )}
                    >
                      <div className="font-medium">Bank Transactions Feed</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        Live statement ingestion & AI classification
                      </div>
                    </button>

                    <button
                      onClick={() => handleNav("/rules")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors mt-0.5",
                        currentBase === "/rules"
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "bg-[#14151c] text-white font-semibold"
                          : theme === "light"
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-[#14151c] text-zinc-300"
                      )}
                    >
                      <div className="font-medium">Auto-Posting Rules & Policies</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        90-Day backtesting & threshold cutoffs
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Invoices Dropdown (Bills + Vendor Tax Intelligence) */}
              <div className="relative">
                <button
                  id="nav-top-invoices-group"
                  onClick={() => setOpenDropdown(openDropdown === "invoices" ? null : "invoices")}
                  className={cn(
                    "h-8 flex items-center gap-1 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    currentBase === "/invoices" || currentBase === "/vendors"
                      ? theme === "light"
                        ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200"
                        : "bg-[#14151c] text-white font-semibold border border-[#272935] shadow-xs"
                      : theme === "light"
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#0c0d11]"
                  )}
                >
                  <span>Invoices & AP</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {openDropdown === "invoices" && (
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-60 rounded-lg border shadow-xl p-1 z-40 animate-in fade-in zoom-in-95",
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-900"
                        : "bg-[#0c0d11] border-[#22242b] text-white"
                    )}
                  >
                    <button
                      onClick={() => handleNav("/invoices")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                        currentBase === "/invoices"
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "bg-[#14151c] text-white font-semibold"
                          : theme === "light"
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-[#14151c] text-zinc-300"
                      )}
                    >
                      <div className="font-medium">Accounts Payable & Invoices</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        OCR entity extraction & bill settlement
                      </div>
                    </button>

                    <button
                      onClick={() => handleNav("/vendors")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors mt-0.5",
                        currentBase === "/vendors"
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "bg-[#14151c] text-white font-semibold"
                          : theme === "light"
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-[#14151c] text-zinc-300"
                      )}
                    >
                      <div className="font-medium">Vendor Directory & Tax</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        TDS Section 194C/J & GSTR-2B ITC
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 4. 3-Way Reconciliation */}
              <button
                id="nav-top-reconciliation"
                onClick={() => handleNav("/reconciliation")}
                className={cn(
                  "h-8 flex items-center px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                  currentBase === "/reconciliation"
                    ? theme === "light"
                      ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200"
                      : "bg-[#14151c] text-white font-semibold border border-[#272935] shadow-xs"
                    : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-[#a1a1aa] hover:text-white hover:bg-[#0c0d11]"
                )}
              >
                Reconciliation
              </button>

              {/* 5. General Ledger & Financial Statements Dropdown */}
              <div className="relative">
                <button
                  id="nav-top-ledger-group"
                  onClick={() => setOpenDropdown(openDropdown === "ledger" ? null : "ledger")}
                  className={cn(
                    "h-8 flex items-center gap-1 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                    currentBase === "/ledger" || currentBase === "/statements"
                      ? theme === "light"
                        ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200"
                        : "bg-[#14151c] text-white font-semibold border border-[#272935] shadow-xs"
                      : theme === "light"
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#0c0d11]"
                  )}
                >
                  <span>Accounting & Books</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {openDropdown === "ledger" && (
                  <div
                    className={cn(
                      "absolute top-full left-0 mt-1 w-64 rounded-lg border shadow-xl p-1 z-40 animate-in fade-in zoom-in-95",
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-900"
                        : "bg-[#0c0d11] border-[#22242b] text-white"
                    )}
                  >
                    <button
                      onClick={() => handleNav("/ledger")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                        currentBase === "/ledger"
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "bg-[#14151c] text-white font-semibold"
                          : theme === "light"
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-[#14151c] text-zinc-300"
                      )}
                    >
                      <div className="font-medium">General Ledger & Trial Balance</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        Double-entry books & journal vouchers
                      </div>
                    </button>

                    <button
                      onClick={() => handleNav("/statements")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors mt-0.5",
                        currentBase === "/statements"
                          ? theme === "light"
                            ? "bg-blue-50 text-blue-800 font-semibold"
                            : "bg-[#14151c] text-white font-semibold"
                          : theme === "light"
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-[#14151c] text-zinc-300"
                      )}
                    >
                      <div className="font-medium">Financial Statements (P&L & BS)</div>
                      <div className="text-[10px] text-zinc-500 font-normal">
                        Automated Income Statement & Balance Sheet
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 6. AI Copilot */}
              <button
                id="nav-top-ai-copilot"
                onClick={() => handleNav("/ai-copilot")}
                className={cn(
                  "h-8 flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap",
                  currentBase === "/ai-copilot"
                    ? "bg-indigo-600 text-white font-semibold shadow-xs border border-indigo-500"
                    : "text-[#818cf8] hover:text-[#a5b4fc] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Copilot</span>
              </button>
            </nav>
          )}
        </div>

        {/* Right: Quick Action, GL Status, Theme Toggle, Audit */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Action Button (+ Action Dropdown) */}
          <div className="relative" ref={actionMenuRef}>
            <button
              id="btn-nav-quick-action"
              onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
              className={cn(
                "h-7 sm:h-8 px-2.5 sm:px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border",
                theme === "light"
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
                  : "bg-[#2563eb] hover:bg-[#3b82f6] text-white border-blue-500/40"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Action</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {isActionMenuOpen && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-1.5 w-56 rounded-lg border shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95",
                  theme === "light"
                    ? "bg-white border-slate-200 text-slate-900"
                    : "bg-[#0c0d11] border-[#22242b] text-white"
                )}
              >
                <div className="text-xs font-medium px-2 py-1 text-zinc-500">
                  Quick Ingestion & Entries
                </div>

                <button
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenInvoiceUpload?.();
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                    theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#14151c] text-zinc-200"
                  )}
                >
                  Upload Vendor Bill (OCR)
                </button>

                <button
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenCsvImport?.();
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                    theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#14151c] text-zinc-200"
                  )}
                >
                  Import Statement (CSV/XLSX)
                </button>

                <button
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenAddTransaction?.();
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                    theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#14151c] text-zinc-200"
                  )}
                >
                  Add Manual Transaction
                </button>

                <div className="my-1 border-t border-[#1e2029]" />

                <button
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenAuditTrail?.();
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                    theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#14151c] text-zinc-200"
                  )}
                >
                  Cryptographic Audit Trail
                </button>

                <button
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    onOpenFxModal?.();
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium block cursor-pointer transition-colors",
                    theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#14151c] text-zinc-200"
                  )}
                >
                  Foreign Exchange Rates
                </button>
              </div>
            )}
          </div>

          {/* Double Entry Balance Pill (Clickable -> links to Statements/Ledger) */}
          <button
            id="btn-nav-gl-status"
            onClick={() => handleNav("/statements")}
            title="Click to view automated Balance Sheet & Trial Balance invariant check"
            className={cn(
              "hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer",
              theme === "light"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-[#0c0d11] text-[#34d399] border-[#059669]/30 hover:bg-[#14151c]"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>GL BALANCED</span>
          </button>

          {/* Audit Trail quick launcher icon */}
          {onOpenAuditTrail && (
            <button
              onClick={onOpenAuditTrail}
              title="Inspect Cryptographic SHA-256 Chained Audit Timeline"
              className={cn(
                "hidden sm:flex p-1.5 rounded-md transition-all cursor-pointer border shadow-xs items-center justify-center",
                theme === "light"
                  ? "bg-white hover:bg-slate-100 border-slate-300 text-purple-700"
                  : "bg-[#0c0d11] hover:bg-[#14151c] border-[#22242b] text-purple-400 hover:text-purple-300"
              )}
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* Black / White Mode Switch Icon Button */}
          {onToggleTheme && (
            <button
              id="btn-nav-toggle-theme"
              onClick={onToggleTheme}
              title={theme === "light" ? "Switch to Black Mode (OLED)" : "Switch to White Mode (Light)"}
              aria-label={theme === "light" ? "Switch to Black Mode" : "Switch to White Mode"}
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer border shadow-xs flex items-center justify-center",
                theme === "light"
                  ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                  : "bg-[#0c0d11] hover:bg-[#14151c] border-[#22242b] text-[#a1a1aa] hover:text-white"
              )}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 text-slate-800" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* System Reset Button */}
          {onOpenResetModal && (
            <button
              id="btn-nav-reset-system"
              onClick={onOpenResetModal}
              title="Reset Database to Clean Baseline State"
              className={cn(
                "hidden sm:flex p-1.5 rounded-md transition-all cursor-pointer border shadow-xs items-center justify-center",
                theme === "light"
                  ? "bg-white hover:bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-[#0c0d11] hover:bg-[#14151c] border-rose-500/20 text-rose-400 hover:text-rose-300"
              )}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "lg:hidden p-1.5 rounded-md transition-colors cursor-pointer border",
              theme === "light"
                ? "bg-slate-100 border-slate-300 text-slate-700"
                : "bg-[#0c0d11] border-[#22242b] text-[#a1a1aa] hover:text-white"
            )}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div
          className={cn(
            "lg:hidden border-t px-3 py-3 space-y-3",
            theme === "light" ? "bg-white border-slate-200" : "bg-[#000000] border-[#1e2029]"
          )}
        >
          {/* Operations Section */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-zinc-500 px-2 py-0.5">
              Operations & Ingestion
            </div>
            <button
              onClick={() => handleNav("/dashboard")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/dashboard"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleNav("/transactions")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/transactions"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Bank Transactions</span>
            </button>
            <button
              onClick={() => handleNav("/rules")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/rules"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Auto-Posting Rules & Policies</span>
            </button>
            <button
              onClick={() => handleNav("/invoices")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/invoices"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoices & Accounts Payable</span>
            </button>
            <button
              onClick={() => handleNav("/vendors")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/vendors"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Vendor Directory & Tax (TDS/GST)</span>
            </button>
            <button
              onClick={() => handleNav("/reconciliation")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/reconciliation"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>3-Way Reconciliation</span>
            </button>
          </div>

          {/* Accounting & Statements Section */}
          <div className="space-y-1 pt-1 border-t border-[#1e2029]">
            <div className="text-xs font-medium text-zinc-500 px-2 py-0.5">
              Accounting & Books
            </div>
            <button
              onClick={() => handleNav("/ledger")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/ledger"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>General Ledger & Vouchers</span>
            </button>
            <button
              onClick={() => handleNav("/statements")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/statements"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-zinc-400 hover:bg-[#14151c] hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Financial Statements (P&L & BS)</span>
            </button>
          </div>

          {/* Intelligence & Actions Section */}
          <div className="space-y-1 pt-1 border-t border-[#1e2029]">
            <div className="text-xs font-medium text-zinc-500 px-2 py-0.5">
              Intelligence & Governance
            </div>
            <button
              onClick={() => handleNav("/ai-copilot")}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                currentBase === "/ai-copilot"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-indigo-400 hover:bg-[#14151c]"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Financial Copilot</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuditTrail?.();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-purple-400 hover:bg-[#14151c] transition-colors text-left"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Cryptographic Audit Trail</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenFxModal?.();
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-sky-400 hover:bg-[#14151c] transition-colors text-left"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Foreign Exchange Rates</span>
            </button>
          </div>

          {/* Mobile Footer Controls */}
          <div className="pt-2 border-t border-[#1e2029] flex items-center justify-between text-xs text-[#a1a1aa] px-1">
            <div className="flex items-center gap-2">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#14151c] text-[#f4f4f5] text-[11px] border border-[#22242b]"
                >
                  {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{theme === "light" ? "Black Mode" : "White Mode"}</span>
                </button>
              )}
              {onOpenResetModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenResetModal();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 text-rose-400 text-[11px] border border-rose-500/30"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset DB</span>
                </button>
              )}
            </div>
            <span className="text-[#34d399] font-semibold text-[10px]">GL BALANCED</span>
          </div>
        </div>
      )}
    </header>
  );
};
