"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  label,
  error,
  icon,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    } else {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={containerRef}>
      {label && (
        <span className="text-[11px] font-bold text-zinc-500">{label}</span>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 w-full rounded-xl border border-zinc-200/80 bg-white pr-10 text-left text-xs text-zinc-800 transition-all font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 flex items-center justify-between cursor-pointer ${
            icon ? "pl-10" : "pl-4"
          } ${!value ? "text-zinc-400 font-medium" : "text-zinc-800"}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1.5 bg-white border border-zinc-200/80 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[260px] animate-in fade-in slide-in-from-top-1 duration-100">
            {/* Search Input Box */}
            <div className="relative p-2 border-b border-zinc-100 bg-zinc-50/50">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200/70 bg-white text-zinc-800 text-xs font-semibold focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Scrollable list */}
            <div
              ref={listRef}
              className="overflow-y-auto py-1 max-h-[190px] scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => {
                  const isSelected = value === option;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors hover:bg-zinc-50 ${
                        isSelected
                          ? "bg-blue-50/40 text-blue-650"
                          : "text-zinc-700"
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-xs text-zinc-400 font-medium text-center">
                  No business types found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}
