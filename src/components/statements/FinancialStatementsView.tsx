import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Scale,
  Download,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  DollarSign,
  ChevronDown,
  RefreshCw,
  Info
} from "lucide-react";
import { IncomeStatement, BalanceSheet } from "../../types";
import { fetchIncomeStatement, fetchBalanceSheet } from "../../lib/api";
import { CustomSelect } from "../ui/CustomSelect";

export const FinancialStatementsView: React.FC = () => {
  const [statementType, setStatementType] = useState<"income" | "balance">("income");
  const [period, setPeriod] = useState<string>("FY2026");
  const [incomeData, setIncomeData] = useState<IncomeStatement | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inc, bal] = await Promise.all([
        fetchIncomeStatement(period),
        fetchBalanceSheet()
      ]);
      setIncomeData(inc);
      setBalanceData(bal);
    } catch (err: any) {
      console.error("Failed to load statements:", err);
      setError(err.message || "Failed to generate financial statements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleExportCsv = () => {
    if (statementType === "income" && incomeData) {
      let csv = `Profit & Loss Statement (Income Statement)\nFiscal Year,${incomeData.fiscalYear}\nPeriod,${incomeData.period}\nCurrency,${incomeData.currency}\nGenerated At,${incomeData.generatedAt}\n\n`;
      csv += `REVENUE CATEGORY,ACCOUNT CODE,AMOUNT (INR),% OF REVENUE\n`;
      incomeData.revenue.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.accountCode},${item.amount},${item.pctOfRevenue}%\n`;
      });
      csv += `TOTAL OPERATING REVENUE,,${incomeData.revenue.totalRevenue},100%\n\n`;
      csv += `COST OF GOODS SOLD (COGS),,\n`;
      incomeData.cogs.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.accountCode},${item.amount},${item.pctOfRevenue}%\n`;
      });
      csv += `TOTAL COGS,,${incomeData.cogs.totalCogs},\n`;
      csv += `GROSS PROFIT,,${incomeData.cogs.grossProfit},${incomeData.cogs.grossMarginPct}%\n\n`;
      csv += `OPERATING EXPENSES (OPEX),,\n`;
      incomeData.operatingExpenses.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.accountCode},${item.amount},${item.pctOfRevenue}%\n`;
      });
      csv += `TOTAL OPEX,,${incomeData.operatingExpenses.totalOpex},\n`;
      csv += `OPERATING INCOME (EBITDA),,${incomeData.operatingExpenses.ebitda},${incomeData.operatingExpenses.operatingMarginPct}%\n`;
      csv += `STATUTORY TAXES & DUTIES,,${incomeData.taxesAndNet.statutoryTaxes},\n`;
      csv += `NET INCOME / (LOSS),,${incomeData.taxesAndNet.netIncome},${incomeData.taxesAndNet.netMarginPct}%\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Income_Statement_${incomeData.period}.csv`;
      a.click();
    } else if (statementType === "balance" && balanceData) {
      let csv = `Balance Sheet Statement\nAs Of Date,${balanceData.asOfDate}\nIdentity Status,${balanceData.isBalanced ? "BALANCED" : "OUT_OF_BALANCE"}\nVariance,${balanceData.variance}\n\n`;
      csv += `ASSETS,ACCOUNT CODE,AMOUNT (INR)\n`;
      balanceData.assets.currentAssets.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.code},${item.amount}\n`;
      });
      balanceData.assets.nonCurrentAssets.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.code},${item.amount}\n`;
      });
      csv += `TOTAL ASSETS,,${balanceData.assets.totalAssets}\n\n`;
      csv += `LIABILITIES,,\n`;
      balanceData.liabilities.currentLiabilities.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.code},${item.amount}\n`;
      });
      csv += `TOTAL LIABILITIES,,${balanceData.liabilities.totalLiabilities}\n\n`;
      csv += `EQUITY,,\n`;
      balanceData.equity.lineItems.forEach((item) => {
        csv += `"${item.name}",${item.code},${item.amount}\n`;
      });
      csv += `TOTAL EQUITY,,${balanceData.equity.totalEquity}\n`;
      csv += `TOTAL LIABILITIES & EQUITY,,${balanceData.summaryIdentity.totalLiabilitiesAndEquity}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Balance_Sheet_${balanceData.asOfDate}.csv`;
      a.click();
    }
  };

  const fmtInr = (val?: number) => {
    if (val === undefined || isNaN(val)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Statement Switcher, Period Picker & Export (Direct Layout - No Outer Card) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[#22242b] bg-[#0c0d11] max-w-full overflow-x-auto no-scrollbar">
          <button
            id="tab-statement-income"
            onClick={() => setStatementType("income")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              statementType === "income"
                ? "bg-[#2563eb] text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-[#14151c]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Profit & Loss (P&L)
          </button>
          <button
            id="tab-statement-balance"
            onClick={() => setStatementType("balance")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              statementType === "balance"
                ? "bg-[#2563eb] text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-[#14151c]"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Balance Sheet
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {statementType === "income" && (
            <div className="w-52">
              <CustomSelect
                id="select-statement-period"
                value={period}
                onChange={(val) => setPeriod(val)}
                options={[
                  { value: "FY2026", label: "Full FY 2026-2027", icon: <Calendar className="w-3.5 h-3.5 text-blue-400" /> },
                  { value: "Q1", label: "Q1 (Apr - Jun 2026)", icon: <Calendar className="w-3.5 h-3.5 text-blue-400" /> },
                  { value: "Q2", label: "Q2 (Jul - Sep 2026)", icon: <Calendar className="w-3.5 h-3.5 text-blue-400" /> },
                  { value: "MTD", label: "Month-to-Date (Current)", icon: <Calendar className="w-3.5 h-3.5 text-blue-400" /> },
                ]}
                size="sm"
                ariaLabel="Select Statement Period"
              />
            </div>
          )}

          <button
            id="btn-refresh-statements"
            onClick={loadData}
            title="Refresh from General Ledger"
            className="p-1.5 bg-[#0c0d11] border border-[#22242b] rounded-lg text-zinc-400 hover:text-white hover:bg-[#14151c] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            id="btn-export-statement-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c0d11] hover:bg-[#14151c] text-zinc-200 text-xs font-medium rounded-lg border border-[#22242b] transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Export Audit Packet (.CSV)
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-zinc-400 bg-[#14151b] border border-[#262833] rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs">Computing live ledger balances and financial statements...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. PROFIT & LOSS VIEW */}
      {!loading && statementType === "income" && incomeData && (
        <div className="space-y-6">
          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-xs font-medium text-zinc-400">Total Revenue</span>
              <div className="text-xl font-bold text-white mt-1">{fmtInr(incomeData.revenue.totalRevenue)}</div>
              <span className="text-[11px] text-emerald-400 mt-1 inline-block">100% Top-line</span>
            </div>
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-xs font-medium text-zinc-400">Gross Profit</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{fmtInr(incomeData.cogs.grossProfit)}</div>
              <span className="text-[11px] text-zinc-400 mt-1 inline-block">{incomeData.cogs.grossMarginPct}% Gross Margin</span>
            </div>
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-xs font-medium text-zinc-400">EBITDA (Operating)</span>
              <div className="text-xl font-bold text-blue-400 mt-1">{fmtInr(incomeData.operatingExpenses.ebitda)}</div>
              <span className="text-[11px] text-zinc-400 mt-1 inline-block">{incomeData.operatingExpenses.operatingMarginPct}% EBITDA Margin</span>
            </div>
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-xs font-medium text-zinc-400">Net Profit</span>
              <div className="text-xl font-bold text-white mt-1">{fmtInr(incomeData.taxesAndNet.netIncome)}</div>
              <span className="text-[11px] text-emerald-400 mt-1 inline-block">{incomeData.taxesAndNet.netMarginPct}% Net Margin</span>
            </div>
          </div>

          {/* Statement Detailed Breakdown */}
          <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#262833] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Statement of Profit and Loss (Income Statement)</h3>
                <p className="text-xs text-zinc-400">Period: {incomeData.period} | Accounting Standard: Accrual Basis (IND AS / GAAP)</p>
              </div>
              <span className="text-xs bg-blue-900/30 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-full font-medium">
                Live General Ledger Linked
              </span>
            </div>

            <div className="p-6 space-y-6 text-sm">
              {/* Section 1: Revenue */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-[#262833] font-medium text-emerald-400 text-xs">
                  <span>I. Operating Revenue & Income</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-[#1e2029]">
                  {incomeData.revenue.lineItems.map((item) => (
                    <div key={item.accountCode} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.accountCode}</span>
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400 font-medium text-[11px]">{item.pctOfRevenue}%</span>
                        <span className="font-mono font-semibold text-white">{fmtInr(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between items-center font-medium text-xs text-white">
                    <span>Total Revenue (A)</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">{fmtInr(incomeData.revenue.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Cost of Sales */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-[#262833] font-medium text-amber-400 text-xs">
                  <span>II. Cost of Sales & Direct Hosting (COGS)</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-[#1e2029]">
                  {incomeData.cogs.lineItems.map((item) => (
                    <div key={item.accountCode} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.accountCode}</span>
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400 font-medium text-[11px]">{item.pctOfRevenue}%</span>
                        <span className="font-mono font-semibold text-white">{fmtInr(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between items-center font-medium text-xs text-zinc-200">
                    <span>Total Cost of Sales (B)</span>
                    <span className="font-mono font-semibold">{fmtInr(incomeData.cogs.totalCogs)}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center font-semibold text-xs text-emerald-400 bg-emerald-950/20 px-3 py-2 rounded-lg mt-2 border border-emerald-900/30">
                    <span>Gross Profit = (A - B)</span>
                    <span className="font-mono text-sm font-bold">{fmtInr(incomeData.cogs.grossProfit)} ({incomeData.cogs.grossMarginPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Operating Expenses */}
              <div>
                <div className="flex justify-between items-center pb-2 border-b border-[#262833] font-medium text-blue-400 text-xs">
                  <span>III. Operating Expenses (OPEX)</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-[#1e2029]">
                  {incomeData.operatingExpenses.lineItems.map((item) => (
                    <div key={item.accountCode} className="py-2.5 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.accountCode}</span>
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400 font-medium text-[11px]">{item.pctOfRevenue}%</span>
                        <span className="font-mono font-semibold text-white">{fmtInr(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between items-center font-medium text-xs text-zinc-200">
                    <span>Total Operating Expenses (C)</span>
                    <span className="font-mono font-semibold">{fmtInr(incomeData.operatingExpenses.totalOpex)}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center font-semibold text-xs text-blue-400 bg-blue-950/20 px-3 py-2 rounded-lg mt-2 border border-blue-900/30">
                    <span>Operating EBITDA = (Gross Profit - C)</span>
                    <span className="font-mono text-sm font-bold">{fmtInr(incomeData.operatingExpenses.ebitda)} ({incomeData.operatingExpenses.operatingMarginPct}%)</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Taxes & Net Profit */}
              <div className="pt-4 border-t border-[#262833]">
                <div className="flex justify-between items-center py-2 text-xs text-zinc-300">
                  <span>Provision for Statutory Taxes & Withholding (GL 8000)</span>
                  <span className="font-mono font-semibold text-white">{fmtInr(incomeData.taxesAndNet.statutoryTaxes)}</span>
                </div>
                <div className="flex justify-between items-center p-3.5 bg-[#0d0e12] border border-emerald-800/40 rounded-xl mt-3 text-white">
                  <div>
                    <span className="font-semibold text-sm">Net Profit for the Period</span>
                    <p className="text-[11px] text-zinc-400">Carried forward to Retained Earnings on the Balance Sheet</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-emerald-400">{fmtInr(incomeData.taxesAndNet.netIncome)}</span>
                    <div className="text-[11px] text-emerald-500/90">{incomeData.taxesAndNet.netMarginPct}% Net Margin</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BALANCE SHEET VIEW */}
      {!loading && statementType === "balance" && balanceData && (
        <div className="space-y-6">
          {/* Fundamental Accounting Identity Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            balanceData.isBalanced
              ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
              : "bg-red-950/30 border-red-800/50 text-red-200"
          }`}>
            <div className="flex items-center gap-3">
              {balanceData.isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <div className="font-semibold text-xs tracking-wide">
                  {balanceData.isBalanced ? "Fundamental Accounting Invariant Satisfied" : "Balance Sheet Variance Detected"}
                </div>
                <div className="text-xs font-mono mt-0.5 text-zinc-300">
                  {balanceData.summaryIdentity.equation}
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-zinc-300">Identity Variance: </span>
              <span className="font-bold text-white">₹{balanceData.variance.toFixed(4)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: ASSETS */}
            <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#262833] bg-[#0d0e12] flex items-center justify-between">
                <span className="font-semibold text-xs text-emerald-400">Assets</span>
                <span className="font-mono text-xs font-bold text-white">{fmtInr(balanceData.assets.totalAssets)}</span>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <div className="font-medium text-zinc-200 pb-1 border-b border-[#262833] mb-2 flex justify-between">
                    <span>Current Assets</span>
                    <span className="font-mono font-semibold">{fmtInr(balanceData.assets.currentAssets.total)}</span>
                  </div>
                  <div className="space-y-2">
                    {balanceData.assets.currentAssets.lineItems.map((item) => (
                      <div key={item.code} className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.code}</span>
                          <span className="text-zinc-200">{item.name}</span>
                        </div>
                        <span className="font-mono font-medium text-white">{fmtInr(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-medium text-zinc-200 pb-1 border-b border-[#262833] mb-2 flex justify-between">
                    <span>Non-Current Assets</span>
                    <span className="font-mono font-semibold">{fmtInr(balanceData.assets.nonCurrentAssets.total)}</span>
                  </div>
                  <div className="space-y-2">
                    {balanceData.assets.nonCurrentAssets.lineItems.map((item) => (
                      <div key={item.code} className="flex justify-between items-center py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.code}</span>
                          <span className="text-zinc-200">{item.name}</span>
                        </div>
                        <span className="font-mono font-medium text-white">{fmtInr(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#262833] flex justify-between items-center font-medium text-emerald-400">
                  <span>Total Assets</span>
                  <span className="font-mono text-sm font-bold">{fmtInr(balanceData.assets.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: LIABILITIES & EQUITY */}
            <div className="space-y-6">
              {/* Liabilities Box */}
              <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#262833] bg-[#0d0e12] flex items-center justify-between">
                  <span className="font-semibold text-xs text-amber-400">Liabilities</span>
                  <span className="font-mono text-xs font-bold text-white">{fmtInr(balanceData.liabilities.totalLiabilities)}</span>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  {balanceData.liabilities.currentLiabilities.lineItems.map((item) => (
                    <div key={item.code} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.code}</span>
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <span className="font-mono font-medium text-white">{fmtInr(item.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-[#262833] flex justify-between items-center font-medium text-zinc-200">
                    <span>Total Liabilities</span>
                    <span className="font-mono font-bold text-amber-400">{fmtInr(balanceData.liabilities.totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Equity Box */}
              <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#262833] bg-[#0d0e12] flex items-center justify-between">
                  <span className="font-semibold text-xs text-blue-400">Shareholders' Equity</span>
                  <span className="font-mono text-xs font-bold text-white">{fmtInr(balanceData.equity.totalEquity)}</span>
                </div>
                <div className="p-4 space-y-2 text-xs">
                  {balanceData.equity.lineItems.map((item) => (
                    <div key={item.code} className="flex justify-between items-center py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-zinc-300 bg-[#14151c] px-1.5 py-0.5 rounded border border-[#2a2d3a]">{item.code}</span>
                        <span className="text-zinc-200">{item.name}</span>
                      </div>
                      <span className="font-mono font-medium text-white">{fmtInr(item.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-[#262833] flex justify-between items-center font-medium text-blue-400">
                    <span>Total Equity</span>
                    <span className="font-mono font-bold">{fmtInr(balanceData.equity.totalEquity)}</span>
                  </div>
                </div>
              </div>

              {/* Combined Liabilities + Equity Invariant Check */}
              <div className="p-4 bg-[#0d0e12] border border-[#262833] rounded-xl flex justify-between items-center text-xs">
                <span className="font-semibold text-white">Total Liabilities & Equity</span>
                <span className="font-mono text-sm font-bold text-emerald-400">{fmtInr(balanceData.summaryIdentity.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
