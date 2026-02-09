"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import RecurringExpenseTable from "@/components/RecurringExpenseTable";
import { formatCurrency } from "@/lib/utils";
import type { RecurringExpenseWithCategory } from "@/types";

export default function RecurringExpensesPage() {
  const [recurringExpenses, setRecurringExpenses] = useState<
    RecurringExpenseWithCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  const fetchRecurringExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/recurring-expenses?active=${!showAll}`
      );
      const data = await res.json();
      setRecurringExpenses(data);
    } catch (err) {
      console.error("Failed to fetch recurring expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => {
    fetchRecurringExpenses();
  }, [fetchRecurringExpenses]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recurring-expenses/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchRecurringExpenses();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const item = recurringExpenses.find((r) => r.id === id);
      if (!item) return;

      const res = await fetch(`/api/recurring-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          isActive,
        }),
      });
      if (res.ok) {
        fetchRecurringExpenses();
      }
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const handleProcessNow = async () => {
    setProcessing(true);
    setProcessResult(null);
    try {
      const res = await fetch("/api/recurring-expenses/process", {
        method: "POST",
      });
      const data = await res.json();
      if (data.generated > 0) {
        setProcessResult(
          `Generated ${data.generated} expense${data.generated !== 1 ? "s" : ""} from ${data.processed} recurring payment${data.processed !== 1 ? "s" : ""}.`
        );
      } else {
        setProcessResult("No recurring expenses are due right now.");
      }
      fetchRecurringExpenses();
    } catch (err) {
      console.error("Failed to process:", err);
      setProcessResult("Failed to process recurring expenses.");
    } finally {
      setProcessing(false);
    }
  };

  // Calculate monthly total
  const monthlyTotal = recurringExpenses
    .filter((r) => r.isActive)
    .reduce((sum, r) => {
      const amount = parseFloat(r.amount);
      switch (r.frequency) {
        case "weekly":
          return sum + amount * 4.33;
        case "yearly":
          return sum + amount / 12;
        default:
          return sum + amount;
      }
    }, 0);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Recurring Expenses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {recurringExpenses.filter((r) => r.isActive).length} active
            recurring expense
            {recurringExpenses.filter((r) => r.isActive).length !== 1
              ? "s"
              : ""}{" "}
            &middot; ~{formatCurrency(monthlyTotal)}/mo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessNow}
            disabled={processing}
            className="btn-secondary"
            title="Generate any due expenses now"
          >
            {processing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182"
                  />
                </svg>
                Process Now
              </>
            )}
          </button>
          <Link href="/recurring-expenses/new" className="btn-primary">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Recurring
          </Link>
        </div>
      </div>

      {/* Process result message */}
      {processResult && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center justify-between">
          <span>{processResult}</span>
          <button
            onClick={() => setProcessResult(null)}
            className="text-blue-400 hover:text-blue-600"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Show all toggle */}
      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          Show paused recurring expenses
        </label>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg
              className="animate-spin h-6 w-6 text-brand-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <RecurringExpenseTable
            recurringExpenses={recurringExpenses}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        )}
      </div>
    </div>
  );
}
