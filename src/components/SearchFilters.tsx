"use client";

import { useState, useEffect } from "react";
import { PAYMENT_METHODS } from "@/lib/utils";
import type { ExpenseFilters } from "@/types";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface SearchFiltersProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
}

export default function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  const handleChange = (key: keyof ExpenseFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search vendor, notes, tags..."
            value={filters.search || ""}
            onChange={(e) => handleChange("search", e.target.value)}
            className="input pl-10"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`btn-secondary ${showAdvanced ? "bg-brand-50 border-brand-200 text-brand-700" : ""}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-brand-500" />
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Category</label>
              <select
                value={filters.categoryId || ""}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                className="input"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Date from</label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleChange("dateFrom", e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Date to</label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleChange("dateTo", e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Min amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="$0.00"
                value={filters.amountMin || ""}
                onChange={(e) => handleChange("amountMin", e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Max amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="$9999.99"
                value={filters.amountMax || ""}
                onChange={(e) => handleChange("amountMax", e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Payment method</label>
              <select
                value={filters.paymentMethod || ""}
                onChange={(e) => handleChange("paymentMethod", e.target.value)}
                className="input"
              >
                <option value="">All methods</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button onClick={clearFilters} className="btn-ghost text-sm">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
