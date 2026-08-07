"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EquipmentOptionItem {
  id: string;
  name: string;
  categoryName?: string;
  rentalPricePerDay?: number | string;
  availableQuantity?: number;
  totalStock?: number;
  subtext?: string;
}

interface SearchableEquipmentSelectProps {
  options: EquipmentOptionItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function SearchableEquipmentSelect({
  options,
  value,
  onChange,
  placeholder = "Search & select equipment...",
  label,
  required = false,
}: SearchableEquipmentSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = options.filter((opt) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const nameMatch = opt.name.toLowerCase().includes(term);
    const catMatch = opt.categoryName?.toLowerCase().includes(term);
    return nameMatch || catMatch;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="font-semibold text-slate-700 text-xs block">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Selected Box / Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-left text-slate-900 flex items-center justify-between shadow-xs transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer",
          isOpen && "border-blue-600 ring-2 ring-blue-500/20"
        )}
      >
        <span className="truncate flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
          {selectedOption ? (
            <span className="font-medium">
              {selectedOption.name}
              {selectedOption.subtext ? ` (${selectedOption.subtext})` : ""}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-fade-in">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0 ml-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment by name or category..."
              autoFocus
              className="w-full bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none py-1"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching equipment items found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer",
                      isSelected && "bg-blue-50/70 text-blue-900 font-semibold"
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-900 font-medium">{opt.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {opt.categoryName ? `${opt.categoryName} • ` : ""}
                        {opt.subtext || ""}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
