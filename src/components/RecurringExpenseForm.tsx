"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDateInput, PAYMENT_METHODS } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface RecurringExpenseFormProps {
  recurringExpense?: {
    id: string;
    vendor: string;
    description: string | null;
    amount: string;
    categoryId: string | null;
    paymentMethod: string | null;
    notes: string | null;
    tags: string | null;
    frequency: string;
    dayOfMonth: number;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
  };
}

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function RecurringExpenseForm({
  recurringExpense,
}: RecurringExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!recurringExpense;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    vendor: recurringExpense?.vendor || "",
    description: recurringExpense?.description || "",
    amount: recurringExpense?.amount || "",
    categoryId: recurringExpense?.categoryId || "",
    paymentMethod: recurringExpense?.paymentMethod || "",
    notes: recurringExpense?.notes || "",
    tags: recurringExpense?.tags || "",
    frequency: recurringExpense?.frequency || "monthly",
    dayOfMonth: recurringExpense?.dayOfMonth?.toString() || "1",
    startDate: recurringExpense
      ? formatDateInput(recurringExpense.startDate)
      : formatDateInput(new Date()),
    endDate: recurringExpense?.endDate
      ? formatDateInput(recurringExpense.endDate)
      : "",
    isActive: recurringExpense?.isActive ?? true,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/recurring-expenses/${recurringExpense.id}`
        : "/api/recurring-expenses";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save recurring expense");
      }

      router.push("/recurring-expenses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Recurring schedule section */}
      <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg">
        <h3 className="text-sm font-semibold text-brand-800 mb-4 flex items-center gap-2">
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
          Recurring Schedule
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Frequency */}
          <div>
            <label htmlFor="frequency" className="label">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              id="frequency"
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              className="input"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Month */}
          {form.frequency === "monthly" && (
            <div>
              <label htmlFor="dayOfMonth" className="label">
                Day of Month <span className="text-red-500">*</span>
              </label>
              <select
                id="dayOfMonth"
                name="dayOfMonth"
                value={form.dayOfMonth}
                onChange={handleChange}
                className="input"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                    {getOrdinalSuffix(d)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="label">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          {/* End Date (optional) */}
          <div>
            <label htmlFor="endDate" className="label">
              End Date{" "}
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              className="input"
            />
          </div>

          {/* Active toggle (edit only) */}
          {isEditing && (
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Expense details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Amount */}
        <div>
          <label htmlFor="amount" className="label">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="input pl-7"
            />
          </div>
        </div>

        {/* Vendor */}
        <div>
          <label htmlFor="vendor" className="label">
            Vendor / Payee <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={form.vendor}
            onChange={handleChange}
            required
            placeholder="e.g. Netflix, Adobe, AWS"
            className="input"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of the recurring expense"
            className="input"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="label">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="input"
          >
            <option value="">-- Select category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label htmlFor="paymentMethod" className="label">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className="input"
          >
            <option value="">-- Select method --</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="sm:col-span-2">
          <label htmlFor="tags" className="label">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Comma-separated, e.g. subscription, software"
            className="input"
          />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="label">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Additional notes..."
            className="input resize-y"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              Saving...
            </>
          ) : (
            <>
              {isEditing
                ? "Update Recurring Expense"
                : "Create Recurring Expense"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
