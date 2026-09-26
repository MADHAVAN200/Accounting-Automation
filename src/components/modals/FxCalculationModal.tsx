import React, { useState, useEffect } from "react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  X,
  ArrowRight,
  DollarSign,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { ExchangeRate, FxGainLossCalculation } from "../../types";
import { fetchExchangeRates, calculateFxGainLoss } from "../../lib/api";

interface FxCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: string;
  invoiceNumber?: string;
  vendorName?: string;
  defaultCurrency?: string;
  defaultAmount?: number;
}

export const FxCalculationModal: React.FC<FxCalculationModalProps> = ({
  isOpen,
  onClose,
  invoiceId = "inv-001",
  invoiceNumber = "INV-2026-001",
  vendorName = "Amazon Web Services",
  defaultCurrency = "USD",
  defaultAmount = 4250.00
}) => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [settlementRate, setSettlementRate] = useState<number>(86.10);
  const [calculation, setCalculation] = useState<FxGainLossCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadRates = async () => {
    try {
      const r = await fetchExchangeRates();
      setRates(r);
      const curRate = r.find((x) => x.currency === defaultCurrency);
      if (curRate) {
        setSettlementRate(curRate.rateToInr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runCalculation = async (rate: number) => {
    setLoading(true);
    try {
      const calc = await calculateFxGainLoss({
        invoiceId,
        settlementRate: rate
      });
      setCalculation(calc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRates();
      runCalculation(settlementRate);
    }
  }, [isOpen, invoiceId]);

  if (!isOpen) return null;

  const fmtInr = (val?: number) => {
    if (val === undefined || isNaN(val)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-[#14151b] border border-[#262833] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262833]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Multi-Currency Spot Valuation & FX Variance</h3>
              <p className="text-[11px] text-zinc-400">Realized foreign exchange gain/loss computation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Currency Ticker */}
        <div>
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Live Spot Exchange Rates (vs INR):
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {rates.map((r) => (
              <div
                key={r.currency}
                onClick={() => {
                  setSettlementRate(r.rateToInr);
                  runCalculation(r.rateToInr);
                }}
                className={`p-2 rounded-lg border text-center cursor-pointer transition-colors ${
                  r.currency === defaultCurrency
                    ? "bg-blue-950/40 border-blue-600 text-white"
                    : "bg-[#0d0e12] border-[#262833] text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <div className="font-bold text-xs">{r.currency}</div>
                <div className="font-mono text-[11px] text-blue-400 mt-0.5">₹{r.rateToInr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice & Settlement Controls */}
        <div className="bg-[#0d0e12] p-3.5 rounded-xl border border-[#262833] space-y-3 text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Invoice Reference:</span>
            <span className="font-mono font-medium text-white">{invoiceNumber} ({vendorName})</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e2029]">
            <div>
              <label className="block text-zinc-400 mb-1">Booking Spot Rate</label>
              <div className="font-mono text-zinc-300 font-bold bg-[#14151b] px-3 py-2 rounded border border-[#262833]">
                1 {defaultCurrency} = ₹{calculation?.bookingExchangeRate || 85.50}
              </div>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Settlement Spot Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={settlementRate}
                  onChange={(e) => {
                    const r = parseFloat(e.target.value) || 0;
                    setSettlementRate(r);
                    runCalculation(r);
                  }}
                  className="w-full bg-[#14151b] border border-[#262833] px-3 py-2 rounded text-white font-mono outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Result */}
        {calculation && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              calculation.isFxGain
                ? "bg-emerald-950/30 border-emerald-800/50 text-emerald-200"
                : "bg-red-950/30 border-red-800/50 text-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {calculation.isFxGain ? (
                  <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider">
                    {calculation.isFxGain ? "Realized FX Gain (Favorable)" : "Realized FX Loss (Unfavorable)"}
                  </div>
                  <div className="text-xs text-zinc-300 mt-0.5">
                    Variance on settlement of {calculation.foreignCurrency} {calculation.foreignAmount.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono text-base font-bold ${
                  calculation.isFxGain ? "text-emerald-400" : "text-red-400"
                }`}>
                  {calculation.isFxGain ? "+" : "-"}{fmtInr(calculation.fxVariance)}
                </span>
                <div className="text-[10px] text-zinc-400 font-mono">Routing: {calculation.glRouting}</div>
              </div>
            </div>

            {/* Balancing Journal Entry Preview */}
            <div className="bg-[#0d0e12] p-3.5 rounded-xl border border-[#262833] space-y-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Accounting Journal Voucher Legs (GL 8100 Realized FX Variance):
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                {calculation.balancingJournalLegs.map((leg, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-[#1e2029] last:border-0">
                    <div>
                      <span className="text-zinc-500 text-[10px] mr-2">{leg.accountCode}</span>
                      <span className="text-zinc-200">{leg.accountName}</span>
                    </div>
                    <div className="text-right">
                      {leg.debit > 0 ? (
                        <span className="text-emerald-400">DR {fmtInr(leg.debit)}</span>
                      ) : (
                        <span className="text-amber-400">CR {fmtInr(leg.credit)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2029] hover:bg-[#282a36] text-zinc-200 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
