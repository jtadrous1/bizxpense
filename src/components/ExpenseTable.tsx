"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseWithCategory } from "@/types";

interface ExpenseTableProps {
  expenses: ExpenseWithCategory[];
  onDelete?: (id: string) => void;
}

export default function ExpenseTable({ expenses, onDelete }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
        <p className="mt-3 text-sm text-gray-500">No expenses found</p>
        <Link href="/expenses/new" className="btn-primary mt-4 inline-flex">
          Add your first expense
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Vendor</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 hidden sm:table-cell">Category</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">Payment</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">Receipt</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                {formatDate(expense.date)}
              </td>
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{expense.vendor}</div>
                {expense.notes && (
                  <div className="text-xs text-gray-400 truncate max-w-[200px]">
                    {expense.notes}
                  </div>
                )}
              </td>
              <td className="py-3 px-4 hidden sm:table-cell">
                {expense.category ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${expense.category.color}15`,
                      color: expense.category.color,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                    />
                    {expense.category.name}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">Uncategorized</span>
                )}
              </td>
              <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                {expense.paymentMethod || "—"}
              </td>
              <td className="py-3 px-4 text-right font-medium text-gray-900 whitespace-nowrap">
                {formatCurrency(expense.amount)}
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                {expense.receiptPath ? (
                  <a
                    href={`/api/upload/${expense.receiptPath}`}
                    target="_blank"
                    className="text-brand-600 hover:text-brand-700 text-xs"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/expenses/${expense.id}`}
                    className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm("Delete this expense?")) {
                          onDelete(expense.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
