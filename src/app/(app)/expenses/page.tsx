"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import SearchFilters from "@/components/SearchFilters";
import ExpenseTable from "@/components/ExpenseTable";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseWithCategory, ExpenseFilters } from "@/types";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ExpenseFilters>({});

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", "25");

    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.amountMin) params.set("amountMin", filters.amountMin);
    if (filters.amountMax) params.set("amountMax", filters.amountMax);
    if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);

    try {
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      setExpenses(data.expenses);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Calculate sum of displayed expenses
  const displayedTotal = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} expense{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link href="/expenses/new" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Expense
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="mb-6">
        <SearchFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Expense table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-brand-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            <ExpenseTable expenses={expenses} onDelete={handleDelete} />

            {/* Footer: totals + pagination */}
            {expenses.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing {formatCurrency(displayedTotal)} on this page
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="btn-ghost text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn-ghost text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
