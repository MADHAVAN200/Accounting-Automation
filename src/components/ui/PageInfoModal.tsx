import React, { useEffect, useState } from "react";
import {
  Info,
  X,
  Calculator,
  ShieldCheck,
  Zap,
  Lightbulb,
  CheckCircle2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { PageGuide } from "../../data/pageGuides";
import { cn } from "../../lib/utils";

export interface PageInfoModalProps {
  guide: PageGuide;
  isOpen: boolean;
  onClose: () => void;
  theme?: "dark" | "light";
}

export const PageInfoModal: React.FC<PageInfoModalProps> = ({
  guide,
  isOpen,
  onClose,
  theme: propTheme,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "workflow" | "invariants">("overview");

  // Dynamic Theme Detection
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (propTheme) return propTheme === "light";
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light");
    }
    return false;
  });

  useEffect(() => {
    if (propTheme) {
      setIsLight(propTheme === "light");
      return;
    }
    if (typeof document === "undefined") return;
    const checkTheme = () => {
      setIsLight(document.documentElement.classList.contains("light"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [propTheme]);

  // Escape key listener & body lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className={cn(
          "w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-all animate-in zoom-in-95",
          isLight
            ? "bg-white border-slate-200 text-slate-900 shadow-slate-400/30"
            : "bg-[#0d0e13] border-[#22242b] text-white shadow-black/80"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "p-4 sm:p-5 border-b flex items-start justify-between gap-3 shrink-0",
            isLight ? "border-slate-200 bg-slate-50/80" : "border-[#22242b] bg-[#14151c]/70"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                isLight
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-blue-500/15 text-[#38bdf8] border-blue-500/30"
              )}
            >
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {guide.title}
                </h2>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    isLight
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-blue-500/10 text-[#38bdf8] border-blue-500/30"
                  )}
                >
                  {guide.badge}
                </span>
              </div>
              <p className={cn("text-xs mt-0.5", isLight ? "text-slate-600" : "text-[#a1a1aa]")}>
                {guide.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-page-guide"
            aria-label="Close Guide"
            className={cn(
              "p-1.5 rounded-md transition-colors cursor-pointer",
              isLight
                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                : "text-zinc-400 hover:text-white hover:bg-[#22242b]"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={cn(
            "flex items-center gap-1 px-4 sm:px-5 py-2 border-b overflow-x-auto no-scrollbar shrink-0",
            isLight ? "border-slate-200 bg-slate-100/50" : "border-[#1c1e27] bg-[#0c0d11]"
          )}
        >
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
              activeTab === "overview"
                ? isLight
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                  : "bg-[#2563eb] text-white shadow-xs"
                : isLight
                ? "text-slate-600 hover:text-slate-900"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {guide.keyMetrics && guide.keyMetrics.length > 0 && (
            <button
              onClick={() => setActiveTab("metrics")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "metrics"
                  ? isLight
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "bg-[#2563eb] text-white shadow-xs"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Key Formulas & Metrics ({guide.keyMetrics.length})</span>
            </button>
          )}

          {guide.workflows && guide.workflows.length > 0 && (
            <button
              onClick={() => setActiveTab("workflow")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "workflow"
                  ? isLight
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "bg-[#2563eb] text-white shadow-xs"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Step-by-Step Workflow</span>
            </button>
          )}

          {guide.accountingInvariants && guide.accountingInvariants.length > 0 && (
            <button
              onClick={() => setActiveTab("invariants")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activeTab === "invariants"
                  ? isLight
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                    : "bg-[#2563eb] text-white shadow-xs"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Audit & Invariants</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div
                className={cn(
                  "p-3.5 rounded-lg border",
                  isLight ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-[#14151c] border-[#22242b] text-zinc-300"
                )}
              >
                <div className={cn("text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5", isLight ? "text-blue-700" : "text-[#38bdf8]")}>
                  <BookOpen className="w-3.5 h-3.5" />
                  What This Page Does
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {guide.overview}
                </p>
              </div>

              {guide.tips && guide.tips.length > 0 && (
                <div
                  className={cn(
                    "p-3.5 rounded-lg border space-y-2",
                    isLight ? "bg-amber-50/70 border-amber-200 text-amber-900" : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                  )}
                >
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Best Practices & Shortcuts
                  </div>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs">
                    {guide.tips.map((tip, idx) => (
                      <li key={idx} className="leading-normal">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === "metrics" && guide.keyMetrics && (
            <div className="space-y-3">
              <div className={cn("text-[11px] font-semibold", isLight ? "text-slate-500" : "text-[#71717a]")}>
                All financial calculations on this page are computed dynamically with zero mock values:
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {guide.keyMetrics.map((m, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border",
                      isLight ? "bg-slate-50 border-slate-200" : "bg-[#14151c] border-[#22242b]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("font-bold text-xs", isLight ? "text-slate-900" : "text-white")}>
                        {m.label}
                      </span>
                    </div>
                    <p className={cn("text-xs mt-1", isLight ? "text-slate-600" : "text-zinc-300")}>
                      {m.description}
                    </p>
                    {m.formula && (
                      <div
                        className={cn(
                          "mt-2 p-2 rounded font-mono text-[11px] border leading-tight",
                          isLight ? "bg-white text-blue-700 border-slate-200" : "bg-[#0c0d11] text-[#38bdf8] border-[#272935]"
                        )}
                      >
                        <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block mb-0.5">
                          Formula:
                        </span>
                        {m.formula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "workflow" && guide.workflows && (
            <div className="space-y-3">
              <div className={cn("text-[11px] font-semibold", isLight ? "text-slate-500" : "text-[#71717a]")}>
                Recommended operational sequence for this view:
              </div>
              <div className="space-y-2.5">
                {guide.workflows.map((wf, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border flex items-start gap-3",
                      isLight ? "bg-slate-50 border-slate-200" : "bg-[#14151c] border-[#22242b]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border",
                        isLight
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-blue-500/20 text-[#38bdf8] border-blue-500/40"
                      )}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={cn("font-bold text-xs", isLight ? "text-slate-900" : "text-white")}>
                        {wf.step}
                      </div>
                      <p className={cn("text-xs mt-0.5", isLight ? "text-slate-600" : "text-zinc-300")}>
                        {wf.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "invariants" && guide.accountingInvariants && (
            <div className="space-y-3">
              <div
                className={cn(
                  "p-3.5 rounded-lg border space-y-2.5",
                  isLight ? "bg-emerald-50/70 border-emerald-200" : "bg-emerald-500/10 border-emerald-500/20"
                )}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Double-Entry Principles & Compliance Rules
                </div>
                <ul className="space-y-2">
                  {guide.accountingInvariants.map((inv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className={cn("text-xs leading-normal", isLight ? "text-slate-700" : "text-zinc-200")}>
                        {inv}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            "p-3 sm:p-4 border-t flex items-center justify-between gap-2 shrink-0",
            isLight ? "border-slate-200 bg-slate-50" : "border-[#22242b] bg-[#14151c]/60"
          )}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717a]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited & verified against ledger.db</span>
          </div>

          <button
            onClick={onClose}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
              isLight
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            )}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
