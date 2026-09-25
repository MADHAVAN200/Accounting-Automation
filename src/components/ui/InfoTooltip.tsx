import React, { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/utils";

export interface InfoTooltipProps {
  text: string;
  title?: string;
  formula?: string;
  className?: string;
  iconClassName?: string;
  size?: "xs" | "sm" | "md";
  position?: "top" | "bottom" | "left" | "right";
  theme?: "dark" | "light";
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  text,
  title,
  formula,
  className,
  iconClassName,
  size = "sm",
  position = "top",
  theme: propTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const sizeStyles = {
    xs: "w-3.5 h-3.5 text-[10px]",
    sm: "w-4 h-4 text-[11px]",
    md: "w-5 h-5 text-xs",
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center align-middle", className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={title || "Information"}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500/50 cursor-pointer",
          sizeStyles[size],
          isLight
            ? "text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 border border-blue-200"
            : "text-[#38bdf8] bg-blue-500/10 hover:bg-blue-500/20 hover:text-white border border-blue-500/30",
          isOpen && (isLight ? "bg-blue-200 text-blue-900 border-blue-400" : "bg-blue-500/30 text-white border-blue-400")
        )}
      >
        <Info className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", iconClassName)} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 w-64 p-2.5 rounded-lg text-left shadow-xl transition-all animate-in fade-in zoom-in-95 pointer-events-auto",
            positionClasses[position],
            isLight
              ? "bg-white text-slate-800 border border-slate-200 shadow-slate-300/50"
              : "bg-[#14151c] text-zinc-200 border border-[#272935] shadow-black/80"
          )}
        >
          {title && (
            <div className={cn("text-[11px] font-bold mb-1 flex items-center gap-1", isLight ? "text-slate-900" : "text-white")}>
              <span>{title}</span>
            </div>
          )}
          <p className={cn("text-[11px] leading-relaxed", isLight ? "text-slate-600" : "text-zinc-300")}>
            {text}
          </p>
          {formula && (
            <div
              className={cn(
                "mt-2 p-1.5 rounded font-mono text-[10px] border leading-tight",
                isLight
                  ? "bg-slate-50 text-blue-700 border-slate-200"
                  : "bg-[#090a0f] text-[#38bdf8] border-[#22242b]"
              )}
            >
              <span className="font-semibold text-zinc-400 block mb-0.5">Formula / Rule:</span>
              {formula}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
