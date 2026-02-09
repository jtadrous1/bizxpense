"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardCards from "@/components/DashboardCards";
import ExpenseTable from "@/components/ExpenseTable";
import type { DashboardData } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Auto-process recurring expenses on first load
  useEffect(() => {
    fetch("/api/recurring-expenses/process", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?year=${year}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your business expense overview
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Link href="/expenses/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Expense
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-brand-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : data ? (
        <>
          <DashboardCards data={data} />

          {/* Recent expenses */}
          <div className="mt-8 card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent Expenses
              </h3>
              <Link
                href="/expenses"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                View all
              </Link>
            </div>
            <ExpenseTable expenses={data.recentExpenses} />
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Failed to load dashboard data
        </div>
      )}
    </div>
  );
}
