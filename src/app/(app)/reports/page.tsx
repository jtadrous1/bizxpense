"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData, CategorySummary } from "@/types";

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?year=${year}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("API error")))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year]);

  const handleExport = async (format: "csv" | "schedule-c") => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        dateFrom: `${year}-01-01`,
        dateTo: `${year}-12-31`,
        format,
      });

      const res = await fetch(`/api/expenses/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "schedule-c"
          ? `schedule-c-${year}.csv`
          : `expenses-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Export</h1>
          <p className="mt-1 text-sm text-gray-500">
            Year-end summaries and tax exports
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="input w-auto"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Export buttons */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Export Data
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Download your {year} expenses for tax preparation or record-keeping.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleExport("csv")}
                disabled={exporting}
                className="btn-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download All Expenses (CSV)
              </button>
              <button
                onClick={() => handleExport("schedule-c")}
                disabled={exporting}
                className="btn-secondary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Schedule C Summary (CSV)
              </button>
            </div>
          </div>

          {/* Annual summary */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {year} Annual Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(data.totalExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.expenseCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average per Transaction</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(data.avgExpense)}
                </p>
              </div>
            </div>
          </div>

          {/* Schedule C breakdown */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Category Breakdown
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Schedule C line items for tax filing
            </p>

            {data.topCategories.length === 0 ? (
              <p className="text-sm text-gray-400">No expenses recorded for {year}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Schedule C</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-500">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.topCategories.map((cat: CategorySummary) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-medium text-gray-900">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {cat.scheduleCCode || "—"}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {cat.count}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(cat.total)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-500">
                          {data.totalExpenses > 0
                            ? ((cat.total / data.totalExpenses) * 100).toFixed(1)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 font-semibold">
                      <td className="py-3 px-4 text-gray-900">Total</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-center text-gray-900">
                        {data.expenseCount}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {formatCurrency(data.totalExpenses)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Monthly breakdown */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Month</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 w-1/2">Visual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.monthlyTotals.map((m) => {
                    const maxMonthly = Math.max(
                      ...data.monthlyTotals.map((mt) => mt.total),
                      1
                    );
                    const pct = (m.total / maxMonthly) * 100;
                    return (
                      <tr key={m.month} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {m.month}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {m.total > 0 ? formatCurrency(m.total) : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-brand-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Failed to load report data
        </div>
      )}
    </div>
  );
}
