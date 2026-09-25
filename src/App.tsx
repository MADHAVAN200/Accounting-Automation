import React, { useState, useEffect } from "react";
import { Navbar } from "./components/layout/Navbar";
import { CommandPalette } from "./components/layout/CommandPalette";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { TransactionDetails } from "./pages/TransactionDetails";
import { Invoices } from "./pages/Invoices";
import { Reconciliation } from "./pages/Reconciliation";
import { Ledger } from "./pages/Ledger";
import { AICopilot } from "./pages/AICopilot";
import { CsvImportModal } from "./components/modals/CsvImportModal";
import { InvoiceUploadModal } from "./components/modals/InvoiceUploadModal";
import { AddTransactionModal } from "./components/modals/AddTransactionModal";
import { ResetAppModal } from "./components/modals/ResetAppModal";
import { AuditTimelineModal } from "./components/modals/AuditTimelineModal";
import { FxCalculationModal } from "./components/modals/FxCalculationModal";
import { cn } from "./lib/utils";

export function App() {
  // Handle URL hash / path state synchronization
  const getInitialPath = (): string => {
    if (typeof window !== "undefined") {
      if (window.location.hash && window.location.hash.length > 1) {
        return window.location.hash.substring(1);
      }
      if (window.location.pathname && window.location.pathname !== "/") {
        return window.location.pathname + window.location.search;
      }
    }
    return "/dashboard";
  };

  // Navigation State
  const [currentPath, setCurrentPath] = useState<string>(getInitialPath);
  const [userEmail, setUserEmail] = useState<string | null>("madhavan@ledgerai.com");

  // Black / White Theme State
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ledgerai_theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "dark";
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("ledgerai_theme", next);
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (theme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }
  }, [theme]);

  // Modals & Drawers
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);

  // Refresh trigger on updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Keyboard Listener: Cmd+K / Ctrl+K opens Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to browser navigation events
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getInitialPath());
    };
    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== "undefined") {
      window.location.hash = path;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Separate basePath and query string
  const [rawBase, queryString] = currentPath.split("?");
  const basePath = rawBase.length > 1 && rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  const searchParams = new URLSearchParams(queryString || "");

  // Check login state
  if (!userEmail || basePath === "/login") {
    return (
      <Login
        onLogin={(email) => {
          setUserEmail(email);
          navigateTo("/dashboard");
        }}
      />
    );
  }

  // Parse Subroutes (e.g. /transactions/:id)
  const isTransactionDetail = basePath.startsWith("/transactions/") && basePath !== "/transactions";
  const transactionId = isTransactionDetail ? basePath.replace("/transactions/", "").split("/")[0] : null;

  // Title / Subtitle determination
  let pageTitle = "Dashboard";
  let pageSubtitle = "Executive Overview";

  if (basePath === "/dashboard") {
    pageTitle = "Executive Dashboard";
    pageSubtitle = "Overview";
  } else if (basePath === "/transactions") {
    pageTitle = "Bank Transactions";
    pageSubtitle = "Live Feeds & AI Categorization";
  } else if (basePath === "/rules") {
    pageTitle = "Auto-Posting Rules";
    pageSubtitle = "Deterministic Rule Engine & Simulator";
  } else if (basePath === "/invoices") {
    pageTitle = "Invoices & AP";
    pageSubtitle = "Accounts Payable & OCR Extraction";
  } else if (basePath === "/vendors") {
    pageTitle = "Vendor Directory & Tax";
    pageSubtitle = "TDS Withholding & GSTR-2B ITC";
  } else if (basePath === "/reconciliation") {
    pageTitle = "3-Way Reconciliation";
    pageSubtitle = "Multi-Factor Fuzzy Matching";
  } else if (basePath === "/ledger") {
    pageTitle = "General Ledger";
    pageSubtitle = "Double-Entry Balance Core";
  } else if (basePath === "/statements") {
    pageTitle = "Financial Statements";
    pageSubtitle = "Automated P&L & Balance Sheet";
  } else if (basePath === "/ai-copilot") {
    pageTitle = "AI Financial Copilot";
    pageSubtitle = "Financial Intelligence Assistant";
  }

  return (
    <div
      className={cn(
        "flex flex-col h-screen font-sans antialiased overflow-hidden select-none transition-colors",
        theme === "light" ? "bg-[#f8fafc] text-slate-900" : "bg-[#000000] text-[#f4f4f5]"
      )}
    >
      {/* Top Navigation Bar */}
      <Navbar
        title={pageTitle}
        subtitle={pageSubtitle}
        currentPath={currentPath}
        onNavigate={navigateTo}
        onLogout={() => {
          setUserEmail(null);
          navigateTo("/login");
        }}
        onOpenCopilot={() => navigateTo("/ai-copilot")}
        onOpenCsvImport={() => setIsCsvModalOpen(true)}
        onOpenInvoiceUpload={() => setIsInvoiceModalOpen(true)}
        onOpenAddTransaction={() => setIsAddTxModalOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAuditTrail={() => setIsAuditModalOpen(true)}
        onOpenFxModal={() => setIsFxModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-y-auto no-scrollbar select-text"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {basePath === "/dashboard" && (
          <Dashboard
            key={`dashboard-${refreshKey}`}
            onNavigate={navigateTo}
            onOpenCsvImport={() => setIsCsvModalOpen(true)}
            onOpenInvoiceUpload={() => setIsInvoiceModalOpen(true)}
            onOpenResetModal={() => setIsResetModalOpen(true)}
            theme={theme}
          />
        )}

        {(basePath === "/transactions" || basePath === "/rules") && (
          <Transactions
            key={`transactions-${refreshKey}-${searchParams.get("status") || "ALL"}-${searchParams.get("search") || ""}-${basePath}`}
            onNavigate={navigateTo}
            onOpenCsvImport={() => setIsCsvModalOpen(true)}
            onOpenAddTransaction={() => setIsAddTxModalOpen(true)}
            initialStatusFilter={searchParams.get("status") || "ALL"}
            initialSearch={searchParams.get("search") || ""}
            initialTab={basePath === "/rules" || searchParams.get("tab") === "rules" ? "rules" : "transactions"}
          />
        )}

        {isTransactionDetail && transactionId && (
          <TransactionDetails
            key={`tx-${transactionId}`}
            transactionId={transactionId}
            onBack={() => navigateTo("/transactions")}
            onNavigate={navigateTo}
          />
        )}

        {(basePath === "/invoices" || basePath === "/vendors") && (
          <Invoices
            key={`invoices-${refreshKey}-${searchParams.get("status") || "ALL"}-${searchParams.get("search") || ""}-${basePath}`}
            onNavigate={navigateTo}
            onOpenInvoiceUpload={() => setIsInvoiceModalOpen(true)}
            initialStatusFilter={searchParams.get("status") || "ALL"}
            initialSearch={searchParams.get("search") || ""}
            initialTab={basePath === "/vendors" || searchParams.get("tab") === "vendors" ? "vendors" : "invoices"}
          />
        )}

        {basePath === "/reconciliation" && (
          <Reconciliation key={`rec-${refreshKey}`} onNavigate={navigateTo} />
        )}

        {(basePath === "/ledger" || basePath === "/statements") && (
          <Ledger
            key={`ledger-${refreshKey}-${searchParams.get("account") || "ALL"}-${basePath}`}
            onNavigate={navigateTo}
            initialAccountCode={searchParams.get("account") || "ALL"}
            initialTab={basePath === "/statements" || searchParams.get("tab") === "statements" ? "statements" : "gl"}
          />
        )}

        {basePath === "/ai-copilot" && (
          <AICopilot
            key={`copilot-${searchParams.get("q") || ""}`}
            onNavigate={navigateTo}
            initialQuery={searchParams.get("q") || ""}
          />
        )}

        {/* Fallback for any unexpected route */}
        {![
          "/dashboard",
          "/transactions",
          "/rules",
          "/invoices",
          "/vendors",
          "/reconciliation",
          "/ledger",
          "/statements",
          "/ai-copilot",
        ].includes(basePath) &&
          !isTransactionDetail && (
            <div className="p-12 max-w-md mx-auto text-center space-y-4">
              <div
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center mx-auto font-bold text-lg",
                  theme === "light"
                    ? "bg-slate-100 border-slate-300 text-blue-600"
                    : "bg-[#0c0d11] border-[#22242b] text-[#38bdf8]"
                )}
              >
                404
              </div>
              <div>
                <h2
                  className={cn(
                    "text-base font-bold",
                    theme === "light" ? "text-slate-900" : "text-white"
                  )}
                >
                  Page Not Found
                </h2>
                <p
                  className={cn(
                    "text-xs mt-1",
                    theme === "light" ? "text-slate-500" : "text-[#71717a]"
                  )}
                >
                  The requested path <span className="font-semibold text-blue-500">{currentPath}</span> was not found.
                </p>
              </div>
              <button
                onClick={() => navigateTo("/dashboard")}
                className="px-4 py-2 rounded-md bg-[#16a34a] hover:bg-[#22c55e] border border-emerald-500/40 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Return to Dashboard
              </button>
            </div>
          )}
      </main>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={navigateTo}
        onOpenCsvImport={() => setIsCsvModalOpen(true)}
        onOpenInvoiceUpload={() => setIsInvoiceModalOpen(true)}
        onOpenAddTransaction={() => setIsAddTxModalOpen(true)}
        onOpenResetModal={() => setIsResetModalOpen(true)}
        onOpenAuditTrail={() => setIsAuditModalOpen(true)}
        onOpenFxModal={() => setIsFxModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Global Cryptographic Audit Trail Modal */}
      <AuditTimelineModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        entityId="ALL"
        title="System-Wide Cryptographic Audit Trail (SHA-256 Chained)"
      />

      {/* Global Foreign Exchange Modal */}
      <FxCalculationModal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
      />

      {/* Modals */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          navigateTo("/transactions");
        }}
      />

      <InvoiceUploadModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          navigateTo("/invoices");
        }}
      />

      <AddTransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          navigateTo("/transactions");
        }}
      />

      <ResetAppModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          navigateTo("/dashboard");
        }}
      />
    </div>
  );
}

export default App;
