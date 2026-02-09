"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDateInput, PAYMENT_METHODS } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseFormProps {
  expense?: {
    id: string;
    date: string;
    vendor: string;
    description: string | null;
    amount: string;
    categoryId: string | null;
    paymentMethod: string | null;
    notes: string | null;
    tags: string | null;
    receiptPath: string | null;
    receiptName: string | null;
  };
}

export default function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expense;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [form, setForm] = useState({
    date: expense ? formatDateInput(expense.date) : formatDateInput(new Date()),
    vendor: expense?.vendor || "",
    description: expense?.description || "",
    amount: expense?.amount || "",
    categoryId: expense?.categoryId || "",
    paymentMethod: expense?.paymentMethod || "",
    notes: expense?.notes || "",
    tags: expense?.tags || "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then(setCategories)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save expense");
      }

      const savedExpense = await res.json();

      // Upload receipt if selected
      if (receiptFile) {
        setUploadingReceipt(true);
        const formData = new FormData();
        formData.append("file", receiptFile);
        formData.append("expenseId", savedExpense.id);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          console.error("Receipt upload failed");
        }
        setUploadingReceipt(false);
      }

      router.push("/expenses");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Date */}
        <div>
          <label htmlFor="date" className="label">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="label">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
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
        <div className="sm:col-span-2">
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
            placeholder="e.g. Amazon, Home Depot, Uber"
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
            placeholder="Brief description of the expense"
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
            placeholder="Comma-separated, e.g. client-work, project-alpha"
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

        {/* Receipt Upload */}
        <div className="sm:col-span-2">
          <label className="label">Receipt</label>
          {expense?.receiptName && !receiptFile && (
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              <span>Current: {expense.receiptName}</span>
              <a
                href={`/api/upload/${expense.receiptPath}`}
                target="_blank"
                className="text-brand-600 hover:underline"
              >
                View
              </a>
            </div>
          )}
          <div className="flex items-center gap-4">
            <label className="btn-secondary cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {receiptFile ? "Change file" : "Upload receipt"}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </label>
            {receiptFile && (
              <span className="text-sm text-gray-600">
                {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            JPEG, PNG, GIF, WebP, or PDF. Max 10MB.
          </p>
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
        <button
          type="submit"
          disabled={loading || uploadingReceipt}
          className="btn-primary"
        >
          {loading || uploadingReceipt ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            <>{isEditing ? "Update Expense" : "Add Expense"}</>
          )}
        </button>
      </div>
    </form>
  );
}
