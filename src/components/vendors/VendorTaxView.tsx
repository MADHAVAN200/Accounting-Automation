import React, { useState, useEffect } from "react";
import {
  Users,
  Building,
  FileCheck2,
  Calculator,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Receipt,
  Download,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { VendorProfile, TdsCalculationResult, GstItcSummary } from "../../types";
import { fetchVendorIntelligence, calculateTds, fetchGstItcSummary } from "../../lib/api";
import { Checkbox } from "../ui/Checkbox";
import { CustomSelect } from "../ui/CustomSelect";

export const VendorTaxView: React.FC = () => {
  const [vendorsData, setVendorsData] = useState<{
    totalVendors: number;
    totalYtdSpend: number;
    totalTdsWithheld: number;
    vendors: VendorProfile[];
  } | null>(null);

  const [gstSummary, setGstSummary] = useState<GstItcSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"vendors" | "tds" | "gst">("vendors");
  const [loading, setLoading] = useState<boolean>(true);

  // TDS Calculator Interactive State
  const [tdsInputAmount, setTdsInputAmount] = useState<number>(100000);
  const [tdsSection, setTdsSection] = useState<string>("194J");
  const [isCompany, setIsCompany] = useState<boolean>(true);
  const [tdsResult, setTdsResult] = useState<TdsCalculationResult | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vData, gData, initTds] = await Promise.all([
        fetchVendorIntelligence(),
        fetchGstItcSummary(),
        calculateTds({ amount: tdsInputAmount, section: tdsSection, isCompany: true })
      ]);
      setVendorsData(vData);
      setGstSummary(gData);
      setTdsResult(initTds);
    } catch (e) {
      console.error("Failed to load vendor intelligence:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComputeTds = async (amt: number, sec: string, company: boolean) => {
    try {
      const res = await calculateTds({ amount: amt, section: sec, isCompany: company });
      setTdsResult(res);
    } catch (e) {
      console.error(e);
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
      {/* Top Navigation Tab Bar & Refresh Action (Direct Layout - No Outer Card) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[#22242b] bg-[#0c0d11] max-w-full overflow-x-auto no-scrollbar">
          <button
            id="tab-vendor-ledger"
            onClick={() => setActiveTab("vendors")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "vendors"
                ? "bg-[#2563eb] text-white shadow-xs font-bold"
                : "text-zinc-400 hover:text-white hover:bg-[#14151c]"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Vendor Master Ledger
          </button>
          <button
            id="tab-tds-engine"
            onClick={() => setActiveTab("tds")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "tds"
                ? "bg-[#2563eb] text-white shadow-xs font-bold"
                : "text-zinc-400 hover:text-white hover:bg-[#14151c]"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            TDS Withholding Engine
          </button>
          <button
            id="tab-gst-itc"
            onClick={() => setActiveTab("gst")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "gst"
                ? "bg-[#2563eb] text-white shadow-xs font-bold"
                : "text-zinc-400 hover:text-white hover:bg-[#14151c]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            GST Input Tax Credit (ITC)
          </button>
        </div>

        <button
          id="btn-refresh-vendor-data"
          onClick={loadData}
          className="p-1.5 bg-[#0c0d11] border border-[#22242b] rounded-lg text-zinc-400 hover:text-white hover:bg-[#14151c] transition-colors cursor-pointer"
          title="Refresh Vendor Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      {vendorsData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Active Vendor Accounts</span>
            <div className="text-xl font-bold text-white mt-1">{vendorsData.totalVendors} Enterprises</div>
            <span className="text-[11px] text-zinc-500 mt-1 inline-block">100% Tax KYC Verified</span>
          </div>
          <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total YTD Vendor Disbursements</span>
            <div className="text-xl font-bold text-white mt-1">{fmtInr(vendorsData.totalYtdSpend)}</div>
            <span className="text-[11px] text-blue-400 mt-1 inline-block">Tracked Across AP Ledger</span>
          </div>
          <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Estimated TDS Withheld</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{fmtInr(vendorsData.totalTdsWithheld)}</div>
            <span className="text-[11px] text-zinc-500 mt-1 inline-block">GL 2020 Statutory Payable</span>
          </div>
        </div>
      )}

      {/* TAB 1: VENDOR MASTER LEDGER */}
      {activeTab === "vendors" && vendorsData && (
        <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#262833] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Centralized Vendor Master Directory</h3>
            <span className="text-xs text-zinc-400">Integrated PAN, GSTIN & Payment Terms</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#0d0e12] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#262833] text-[11px]">
                <tr>
                  <th className="py-3 px-4">Vendor Entity</th>
                  <th className="py-3 px-4">Tax KYC (PAN / GSTIN)</th>
                  <th className="py-3 px-4">Category & GL</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4">TDS Section</th>
                  <th className="py-3 px-4">YTD Billed</th>
                  <th className="py-3 px-4">Contract End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2029]">
                {vendorsData.vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-[#181a22] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{v.name}</div>
                      <div className="text-[11px] text-zinc-500">{v.contactEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      <span className="bg-[#0d0e12] px-2 py-0.5 rounded border border-[#262833] text-[11px]">
                        {v.panGstin}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-zinc-200">{v.category}</div>
                      <div className="text-[11px] font-mono text-zinc-500">GL {v.defaultGlAccount}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-300">{v.paymentTerms}</td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-950/60 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[11px] font-medium font-mono">
                        Sec {v.tdsSection} ({v.tdsRate}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-white">
                      {fmtInr(v.totalBilled)}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {v.contractEndDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TDS WITHHOLDING ENGINE */}
      {activeTab === "tds" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Interactive Calculator */}
          <div className="bg-[#14151b] border border-[#262833] p-5 rounded-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                Statutory TDS Deduction Calculator
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Simulate automatic withholding taxes under Indian Income Tax Act regulations.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-medium mb-1">Invoice Gross Base Amount (INR)</label>
                <input
                  type="number"
                  value={tdsInputAmount}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0;
                    setTdsInputAmount(amt);
                    handleComputeTds(amt, tdsSection, isCompany);
                  }}
                  className="w-full bg-[#0d0e12] border border-[#262833] px-3 py-2 rounded-lg text-white font-mono text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-medium mb-1">Statutory TDS Section</label>
                <CustomSelect
                  id="select-tds-section"
                  value={tdsSection}
                  onChange={(sec) => {
                    setTdsSection(sec);
                    handleComputeTds(tdsInputAmount, sec, isCompany);
                  }}
                  options={[
                    { value: "194J", label: "Section 194J: Professional & Technical Services (10%)", badge: "10%" },
                    { value: "194C", label: "Section 194C: Contractor & Subcontractor Payouts (2% Co / 1% Indiv)", badge: "1-2%" },
                    { value: "194H", label: "Section 194H: Commission or Brokerage (5%)", badge: "5%" },
                    { value: "194I", label: "Section 194I: Rent of Land, Buildings or Factory (10%)", badge: "10%" },
                  ]}
                  ariaLabel="Statutory TDS Section"
                />
              </div>

              <div className="pt-1">
                <Checkbox
                  id="isCompanyCheck"
                  checked={isCompany}
                  onChange={(comp) => {
                    setIsCompany(comp);
                    handleComputeTds(tdsInputAmount, tdsSection, comp);
                  }}
                  label="Vendor is an Incorporated Corporate Entity (Company / LLP)"
                />
              </div>
            </div>
          </div>

          {/* Right: Calculated Statutory Breakdown */}
          {tdsResult && (
            <div className="bg-[#14151b] border border-[#262833] p-5 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white">Disbursement & GL Posting Breakdown</h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#0d0e12] rounded-lg border border-[#262833] flex justify-between items-center">
                  <span className="text-zinc-400">Gross Invoice Value</span>
                  <span className="font-mono font-bold text-white text-sm">{fmtInr(tdsResult.grossAmount)}</span>
                </div>

                <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/30 flex justify-between items-center text-red-300">
                  <div>
                    <span className="font-medium">Less: TDS Withholding ({tdsResult.applicableRate}%)</span>
                    <p className="text-[10px] text-red-400/80">{tdsResult.tdsSectionName}</p>
                  </div>
                  <span className="font-mono font-bold text-sm">-{fmtInr(tdsResult.tdsWithheld)}</span>
                </div>

                <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40 flex justify-between items-center text-emerald-200">
                  <div>
                    <span className="font-bold text-sm">Net Wire Settlement to Vendor</span>
                    <p className="text-[11px] text-zinc-400">Bank remittance amount</p>
                  </div>
                  <span className="font-mono font-bold text-lg text-emerald-400">{fmtInr(tdsResult.netPayableToVendor)}</span>
                </div>

                {/* Accounting Voucher Preview */}
                <div className="pt-2 border-t border-[#262833] space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">Automated GL Journal Entries:</span>
                  <div className="font-mono text-[11px] bg-[#0d0e12] p-2.5 rounded border border-[#262833] text-zinc-300 space-y-1">
                    <div className="text-emerald-400">DR: Expense Account = {fmtInr(tdsResult.grossAmount)}</div>
                    <div className="text-zinc-300">CR: Accounts Payable (Net Vendor) = {fmtInr(tdsResult.netPayableToVendor)}</div>
                    <div className="text-amber-400">CR: GL 2020 (Statutory TDS Payable) = {fmtInr(tdsResult.tdsWithheld)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GST INPUT TAX CREDIT (ITC) */}
      {activeTab === "gst" && gstSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Recorded Input GST</span>
              <div className="text-xl font-bold text-white mt-1">{fmtInr(gstSummary.totalInputGstRecorded)}</div>
              <span className="text-[11px] text-zinc-500 mt-1 inline-block">Recorded on AP Bills</span>
            </div>
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">GSTR-2B Matched ITC</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{fmtInr(gstSummary.gstr2bMatchedItc)}</div>
              <span className="text-[11px] text-emerald-500 mt-1 inline-block">{gstSummary.complianceRate}% Verified Credit</span>
            </div>
            <div className="bg-[#14151b] border border-[#262833] p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending ITC Reconciliation</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{fmtInr(gstSummary.pendingItcReview)}</div>
              <span className="text-[11px] text-zinc-500 mt-1 inline-block">Awaiting Vendor GSTR-1</span>
            </div>
          </div>

          <div className="bg-[#14151b] border border-[#262833] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#262833] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">GSTR-2B Input Tax Credit Reconciliation</h3>
              <span className="text-xs text-zinc-400">Section 16(2)(aa) CGST Act Compliance</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#0d0e12] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#262833] text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Taxable Value</th>
                    <th className="py-3 px-4">Input GST</th>
                    <th className="py-3 px-4">Portal Status</th>
                    <th className="py-3 px-4">Verification Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2029]">
                  {gstSummary.itcRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-[#181a22] transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-white">{r.invoiceNumber}</td>
                      <td className="py-3 px-4 text-zinc-200">{r.vendorName}</td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{r.invoiceDate}</td>
                      <td className="py-3 px-4 font-mono text-zinc-300">{fmtInr(r.taxableValue)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{fmtInr(r.inputGstAmount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.gstr2bStatus === "MATCHED_2B"
                            ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
                            : "bg-amber-950/60 text-amber-300 border border-amber-800"
                        }`}>
                          {r.gstr2bStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
