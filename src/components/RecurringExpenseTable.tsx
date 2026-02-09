"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RecurringExpenseWithCategory } from "@/types";

interface RecurringExpenseTableProps {
  recurringExpenses: RecurringExpenseWithCategory[];
  onDelete?: (id: string) => void;
  onToggle?: (id: string, isActive: boolean) => void;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function RecurringExpenseTable({
  recurringExpenses,
  onDelete,
  onToggle,
}: RecurringExpenseTableProps) {
  if (recurringExpenses.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-500">
          No recurring expenses set up yet
        </p>
        <Link
          href="/recurring-expenses/new"
          className="btn-primary mt-4 inline-flex"
        >
          Add your first recurring expense
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Status
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">
              Vendor
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">
              Category
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
              Frequency
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">
              Next Due
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">
              Amount
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recurringExpenses.map((item) => (
            <tr
              key={item.id}
              className={`hover:bg-gray-50 transition-colors ${
                !item.isActive ? "opacity-50" : ""
              }`}
            >
              {/* Status */}
              <td className="py-3 px-4">
                <button
                  onClick={() => onToggle?.(item.id, !item.isActive)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    item.isActive
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title={
                    item.isActive ? "Click to pause" : "Click to resume"
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      item.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {item.isActive ? "Active" : "Paused"}
                </button>
              </td>
              {/* Vendor */}
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{item.vendor}</div>
                {item.description && (
                  <div className="text-xs text-gray-400 truncate max-w-[200px]">
                    {item.description}
                  </div>
                )}
              </td>
              {/* Category */}
              <td className="py-3 px-4 hidden sm:table-cell">
                {item.category ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${item.category.color}15`,
                      color: item.category.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: item.category.color }}
                    />
                    {item.category.name}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Uncategorized</span>
                )}
              </td>
              {/* Frequency */}
              <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                <div>{frequencyLabels[item.frequency] || item.frequency}</div>
                {item.frequency === "monthly" && (
                  <div className="text-xs text-gray-400">
                    on the {item.dayOfMonth}
                    {getOrdinalSuffix(item.dayOfMonth)}
                  </div>
                )}
              </td>
              {/* Next Due */}
              <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                {item.isActive ? (
                  <span
                    className={
                      new Date(item.nextDueDate) <= new Date()
                        ? "text-amber-600 font-medium"
                        : ""
                    }
                  >
                    {formatDate(item.nextDueDate)}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              {/* Amount */}
              <td className="py-3 px-4 text-right font-medium text-gray-900 whitespace-nowrap">
                {formatCurrency(item.amount)}
              </td>
              {/* Actions */}
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/recurring-expenses/${item.id}`}
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                    title="Edit"
                  >
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
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this recurring expense? Existing generated expenses will not be deleted."
                          )
                        ) {
                          onDelete(item.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
