import React, { useState, useEffect } from "react";
import { Info, HelpCircle } from "lucide-react";
import { PAGE_GUIDES, PageGuide } from "../../data/pageGuides";
import { PageInfoModal } from "./PageInfoModal";
import { cn } from "../../lib/utils";

export interface PageInfoButtonProps {
  guideKey?: keyof typeof PAGE_GUIDES | string;
  customGuide?: PageGuide;
  title?: string;
  variant?: "icon" | "pill" | "subtle";
  size?: "sm" | "md";
  className?: string;
  theme?: "dark" | "light";
}

export const PageInfoButton: React.FC<PageInfoButtonProps> = ({
  guideKey,
  customGuide,
  title,
  variant = "icon",
  size = "sm",
  className,
  theme: propTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);

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

  const guide = customGuide || (guideKey ? PAGE_GUIDES[guideKey] : undefined);
  if (!guide) return null;

  return (
    <>
      {variant === "icon" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title || `Explain ${guide.title}`}
          aria-label={title || `Explain ${guide.title}`}
          className={cn(
            "inline-flex items-center justify-center rounded-full transition-all cursor-pointer shrink-0 border",
            size === "sm" ? "w-6 h-6 text-xs" : "w-7 h-7 text-sm",
            isLight
              ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300 shadow-xs"
              : "bg-blue-500/10 hover:bg-blue-500/20 text-[#38bdf8] hover:text-white border-blue-500/30 hover:border-blue-400/50 shadow-xs",
            className
          )}
        >
          <Info className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        </button>
      )}

      {variant === "pill" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title || `Explain ${guide.title}`}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 border",
            isLight
              ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              : "bg-blue-500/10 hover:bg-blue-500/20 text-[#38bdf8] hover:text-white border-blue-500/30",
            className
          )}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Page Guide</span>
        </button>
      )}

      {variant === "subtle" && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title={title || `Explain ${guide.title}`}
          className={cn(
            "inline-flex items-center gap-1 text-xs transition-colors cursor-pointer",
            isLight
              ? "text-blue-600 hover:text-blue-800"
              : "text-[#38bdf8] hover:text-white",
            className
          )}
        >
          <Info className="w-3.5 h-3.5" />
          <span>How this works</span>
        </button>
      )}

      {isOpen && (
        <PageInfoModal
          guide={guide}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          theme={isLight ? "light" : "dark"}
        />
      )}
    </>
  );
};
