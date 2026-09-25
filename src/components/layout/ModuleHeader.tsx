import React from "react";
import { cn } from "../../lib/utils";
import { PageInfoButton } from "../ui/PageInfoButton";

export interface SubTabItem {
  id: string;
  label: string;
  count?: number | string;
  badge?: string;
  badgeColor?: "blue" | "amber" | "emerald" | "purple";
  icon?: React.ComponentType<{ className?: string }>;
}

interface ModuleHeaderProps {
  title: string;
  breadcrumb?: string;
  description?: string;
  tabs?: SubTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: React.ReactNode;
  theme?: "dark" | "light";
  extraNotice?: React.ReactNode;
  infoGuideKey?: string;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  title,
  breadcrumb,
  description,
  tabs,
  activeTab,
  onTabChange,
  actions,
  theme: propTheme,
  extraNotice,
  infoGuideKey,
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<"dark" | "light">(() => {
    if (propTheme) return propTheme;
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light") ? "light" : "dark";
    }
    return "dark";
  });

  React.useEffect(() => {
    if (propTheme) {
      setCurrentTheme(propTheme);
      return;
    }
    if (typeof document === "undefined") return;
    const checkTheme = () => {
      setCurrentTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [propTheme]);

  const theme = currentTheme;
  return (
    <div className="space-y-3 pb-1 select-none">
      {/* Top row: Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1
              className={cn(
                "text-xl font-bold tracking-tight",
                theme === "light" ? "text-slate-900" : "text-white"
              )}
            >
              {title}
            </h1>
            {infoGuideKey && (
              <PageInfoButton guideKey={infoGuideKey} theme={theme} />
            )}
            {breadcrumb && (
              <span
                className={cn(
                  "font-normal text-xs sm:text-sm",
                  theme === "light" ? "text-slate-500" : "text-[#71717a]"
                )}
              >
                / {breadcrumb}
              </span>
            )}
          </div>
          {description && (
            <p
              className={cn(
                "text-xs mt-0.5",
                theme === "light" ? "text-slate-500" : "text-[#a1a1aa]"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>

      {extraNotice && <div>{extraNotice}</div>}

      {/* Segmented Sub-Tab Switcher (if tabs are provided) */}
      {tabs && tabs.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-1.5 p-1 rounded-lg border w-fit max-w-full overflow-x-auto no-scrollbar",
            theme === "light"
              ? "bg-slate-100 border-slate-200"
              : "bg-[#0c0d11] border-[#22242b]"
          )}
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;

            return (
              <button
                key={t.id}
                id={`subtab-${t.id}`}
                onClick={() => onTabChange?.(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? theme === "light"
                      ? "bg-white text-blue-700 shadow-xs border border-slate-200/80 font-bold"
                      : "bg-[#2563eb] text-white shadow-xs font-bold"
                    : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    : "text-zinc-400 hover:text-white hover:bg-[#14151c]"
                )}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] font-bold border",
                      isActive
                        ? theme === "light"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-blue-900/60 text-white border-blue-400/40"
                        : theme === "light"
                        ? "bg-slate-200 text-slate-700 border-slate-300"
                        : "bg-[#14151c] text-zinc-400 border-[#272935]"
                    )}
                  >
                    {t.count}
                  </span>
                )}
                {t.badge && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border",
                      t.badgeColor === "amber"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : t.badgeColor === "emerald"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
