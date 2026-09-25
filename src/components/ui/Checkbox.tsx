import React, { useId, useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  theme?: "dark" | "light";
  ariaLabel?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  size = "md",
  theme,
  ariaLabel,
}) => {
  const generatedId = useId();
  const inputId = id || `cb-${generatedId}`;

  const [isLight, setIsLight] = useState<boolean>(() => {
    if (theme) return theme === "light";
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("light");
    }
    return false;
  });

  useEffect(() => {
    if (theme) {
      setIsLight(theme === "light");
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
  }, [theme]);

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex items-start gap-2.5 cursor-pointer select-none group",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="relative flex items-center justify-center mt-0.5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel}
          className="sr-only"
        />
        <div
          className={cn(
            "rounded border flex items-center justify-center transition-all duration-150",
            size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4",
            checked
              ? "bg-blue-600 border-blue-600 text-white shadow-xs"
              : isLight
              ? "bg-white border-slate-300 group-hover:border-slate-400"
              : "bg-[#0c0d11] border-[#2e313d] group-hover:border-[#4b5162]"
          )}
        >
          {checked && (
            <Check
              className={cn(
                "text-white stroke-[3]",
                size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"
              )}
            />
          )}
        </div>
      </div>

      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && (
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isLight
                  ? "text-slate-700 group-hover:text-slate-900"
                  : "text-zinc-200 group-hover:text-white"
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className={cn(
                "text-[11px] mt-0.5",
                isLight ? "text-slate-500" : "text-zinc-400"
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
