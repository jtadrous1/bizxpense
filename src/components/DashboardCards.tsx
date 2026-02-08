"use client";

import { formatCurrency } from "@/lib/utils";
import type { DashboardData, CategorySummary } from "@/types";

interface DashboardCardsProps {
  data: DashboardData;
}

export default function DashboardCards({ data }: DashboardCardsProps) {
  const maxMonthly = Math.max(...data.monthlyTotals.map((m) => m.total), 1);

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(data.totalExpenses)}
          subtitle={`${data.expenseCount} transactions`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="brand"
        />
        <SummaryCard
          title="Average Expense"
          value={formatCurrency(data.avgExpense)}
          subtitle="Per transaction"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
          color="emerald"
        />
        <SummaryCard
          title="Top Category"
          value={data.topCategories[0]?.name || "None"}
          subtitle={data.topCategories[0] ? formatCurrency(data.topCategories[0].total) : "No data"}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          }
          color="violet"
        />
      </div>

      {/* Monthly bar chart */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-6">Monthly Spending</h3>
        <div className="flex items-end gap-2 h-48">
          {data.monthlyTotals.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500 font-medium">
                {m.total > 0 ? formatCurrency(m.total) : ""}
              </span>
              <div
                className="w-full bg-brand-500 rounded-t-md transition-all min-h-[2px]"
                style={{
                  height: `${Math.max((m.total / maxMonthly) * 100, m.total > 0 ? 2 : 0)}%`,
                  opacity: m.total > 0 ? 1 : 0.15,
                }}
              />
              <span className="text-xs text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top categories */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Categories</h3>
        {data.topCategories.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses yet</p>
        ) : (
          <div className="space-y-3">
            {data.topCategories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                maxTotal={data.topCategories[0]?.total || 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${colorClasses[color] || colorClasses.brand}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  maxTotal,
}: {
  category: CategorySummary;
  maxTotal: number;
}) {
  const pct = (category.total / maxTotal) * 100;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: category.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 truncate">
            {category.name}
          </span>
          <span className="text-sm font-semibold text-gray-900 ml-2">
            {formatCurrency(category.total)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: category.color,
            }}
          />
        </div>
        <span className="text-xs text-gray-400">
          {category.count} expense{category.count !== 1 ? "s" : ""}
          {category.scheduleCCode ? ` · ${category.scheduleCCode}` : ""}
        </span>
      </div>
    </div>
  );
}
