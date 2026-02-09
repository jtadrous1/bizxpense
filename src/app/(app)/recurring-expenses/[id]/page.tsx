"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RecurringExpenseForm from "@/components/RecurringExpenseForm";

export default function EditRecurringExpensePage() {
  const params = useParams();
  const [recurringExpense, setRecurringExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRecurringExpense() {
      try {
        const res = await fetch(`/api/recurring-expenses/${params.id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setRecurringExpense(data);
      } catch {
        setError("Recurring expense not found");
      } finally {
        setLoading(false);
      }
    }
    fetchRecurringExpense();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg
          className="animate-spin h-8 w-8 text-brand-600"
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
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Recurring Expense
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Update the details of this recurring payment.
        </p>
      </div>

      <div className="card p-6">
        <RecurringExpenseForm recurringExpense={recurringExpense} />
      </div>
    </div>
  );
}
