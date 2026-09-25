import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  searchable?: boolean;
  searchPlaceholder?: string;
  ariaLabel?: string;
  theme?: "dark" | "light";
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options: rawOptions,
  placeholder = "Select an option...",
  disabled = false,
  className,
  buttonClassName,
  dropdownClassName,
  size = "md",
  align = "left",
  searchable,
  searchPlaceholder = "Search options...",
  ariaLabel,
  theme,
}) => {
  const autoId = useId();
  const selectId = id || `custom-select-${autoId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Theme Detection (Dark vs Light)
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

  // Normalize options
  const options: SelectOption[] = rawOptions.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = options.find((opt) => opt.value === value);

  // Auto-enable search if there are more than 7 options unless explicitly specified
  const shouldShowSearch = searchable ?? options.length > 7;

  // Filter options if searching
  const filteredOptions = shouldShowSearch && searchTerm.trim()
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          opt.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && shouldShowSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen, shouldShowSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const currentIndex = filteredOptions.findIndex((opt) => opt.value === value);
      let nextIndex = currentIndex;

      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < filteredOptions.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === "ArrowUp") {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredOptions.length - 1;
      }

      if (filteredOptions[nextIndex]) {
        onChange(filteredOptions[nextIndex].value);
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5 h-7",
    md: "px-3 py-1.5 text-xs gap-2 min-h-8",
    lg: "px-3.5 py-2 text-sm gap-2 min-h-10",
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block w-full text-left font-sans select-none", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || (selectedOption ? selectedOption.label : placeholder)}
        className={cn(
          "w-full flex items-center justify-between font-medium rounded-md transition-all cursor-pointer",
          isLight
            ? "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 shadow-xs"
            : "bg-[#050507] hover:bg-[#0c0d11] text-white border border-[#22242b] focus:border-[#388bfd] focus:outline-none focus:ring-1 focus:ring-[#388bfd]/30 shadow-xs",
          sizeClasses[size],
          disabled && (isLight ? "opacity-50 cursor-not-allowed bg-slate-100" : "opacity-50 cursor-not-allowed bg-[#14151c]"),
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate text-left">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          {selectedOption?.badge && !selectedOption.label.startsWith(selectedOption.badge) && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border",
                isLight
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-[#14151c] text-[#38bdf8] border-[#22242b]"
              )}
            >
              {selectedOption.badge}
            </span>
          )}
          <span className={cn("truncate", !selectedOption && (isLight ? "text-slate-400" : "text-[#71717a]"))}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1.5",
            isLight ? "text-slate-400" : "text-[#71717a]",
            isOpen && (isLight ? "rotate-180 text-slate-900" : "rotate-180 text-white")
          )}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          id={`${selectId}-menu`}
          role="listbox"
          aria-labelledby={selectId}
          className={cn(
            "absolute z-50 mt-1 min-w-[180px] w-full rounded-md shadow-2xl py-1 max-h-60 overflow-y-auto no-scrollbar focus:outline-none animate-in fade-in zoom-in-95 duration-100",
            isLight
              ? "bg-white border border-slate-200 text-slate-900 shadow-xl"
              : "bg-[#0c0d11] border border-[#22242b] text-white shadow-2xl",
            align === "right" ? "right-0" : "left-0",
            dropdownClassName
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Quick Search inside dropdown if many options */}
          {shouldShowSearch && (
            <div
              className={cn(
                "px-2 py-1.5 border-b sticky top-0 z-10",
                isLight ? "bg-white border-slate-100" : "bg-[#0c0d11] border-[#1e2029]"
              )}
            >
              <div className="relative flex items-center">
                <Search
                  className={cn(
                    "w-3 h-3 absolute left-2 pointer-events-none",
                    isLight ? "text-slate-400" : "text-[#71717a]"
                  )}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "w-full rounded pl-7 pr-2 py-1 text-[11px] focus:outline-none",
                    isLight
                      ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white"
                      : "bg-[#050507] border border-[#22242b] text-white placeholder-[#71717a] focus:border-[#388bfd]"
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          {filteredOptions.length === 0 ? (
            <div className={cn("px-3 py-3 text-center text-xs", isLight ? "text-slate-400" : "text-[#71717a]")}>
              No matching options found
            </div>
          ) : (
            <div className="p-1 space-y-0.5">
              {filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors cursor-pointer group",
                      isSelected
                        ? isLight
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "bg-[#181a24] text-[#38bdf8] font-semibold"
                        : isLight
                        ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        : "text-[#d4d4d8] hover:bg-[#14151c] hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      {opt.badge && !opt.label.startsWith(opt.badge) && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border",
                            isSelected
                              ? isLight
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30"
                              : isLight
                              ? "bg-slate-100 text-slate-600 border-slate-200 group-hover:border-slate-300"
                              : "bg-[#050507] text-[#a1a1aa] border-[#22242b] group-hover:border-[#3f3f46]"
                          )}
                        >
                          {opt.badge}
                        </span>
                      )}
                      <div className="truncate flex flex-col">
                        <span className="truncate">{opt.label}</span>
                        {opt.description && (
                          <span
                            className={cn(
                              "text-[10px] truncate",
                              isSelected
                                ? isLight
                                  ? "text-blue-600"
                                  : "text-[#38bdf8]/80"
                                : isLight
                                ? "text-slate-400"
                                : "text-[#71717a]"
                            )}
                          >
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        className={cn(
                          "w-3.5 h-3.5 shrink-0 ml-2",
                          isLight ? "text-blue-600" : "text-[#38bdf8]"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
