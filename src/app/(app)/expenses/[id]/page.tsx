"use client";

import { useEffect, useState, use } from "react";
import ExpenseForm from "@/components/ExpenseForm";

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = use(params);
  const [expense, setExpense] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/expenses/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Expense not found");
        return res.json();
      })
      .then((data) => {
        setExpense(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || "Expense not found"}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update expense details
        </p>
      </div>

      <div className="card p-6 max-w-3xl">
        <ExpenseForm
          expense={{
            id: expense.id as string,
            date: expense.date as string,
            vendor: expense.vendor as string,
            description: expense.description as string | null,
            amount: String(expense.amount),
            categoryId: expense.categoryId as string | null,
            paymentMethod: expense.paymentMethod as string | null,
            notes: expense.notes as string | null,
            tags: expense.tags as string | null,
            receiptPath: expense.receiptPath as string | null,
            receiptName: expense.receiptName as string | null,
          }}
        />
      </div>
    </div>
  );
}
