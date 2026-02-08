import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

// GET /api/dashboard - Dashboard summary data
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
  const month = searchParams.get("month"); // optional, 1-12

  // Date range for the query
  let dateFrom: Date;
  let dateTo: Date;

  if (month) {
    const m = parseInt(month) - 1;
    dateFrom = new Date(year, m, 1);
    dateTo = new Date(year, m + 1, 0, 23, 59, 59, 999);
  } else {
    dateFrom = new Date(year, 0, 1);
    dateTo = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  // Get all expenses in range
  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      date: { gte: dateFrom, lte: dateTo },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  // Calculate totals
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );
  const expenseCount = expenses.length;
  const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

  // Top categories
  const categoryMap = new Map<
    string,
    { id: string; name: string; color: string; scheduleCCode: string | null; total: number; count: number }
  >();

  for (const e of expenses) {
    const catId = e.categoryId || "uncategorized";
    const catName = e.category?.name || "Uncategorized";
    const catColor = e.category?.color || "#6B7280";
    const catCode = e.category?.scheduleCCode || null;

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        name: catName,
        color: catColor,
        scheduleCCode: catCode,
        total: 0,
        count: 0,
      });
    }

    const cat = categoryMap.get(catId)!;
    cat.total += parseFloat(e.amount.toString());
    cat.count += 1;
  }

  const topCategories = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Monthly totals for the year
  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === i;
    });
    const total = monthExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount.toString()),
      0
    );
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return { month: monthNames[i], total };
  });

  // Recent expenses (last 5)
  const recentExpenses = expenses.slice(0, 5);

  return NextResponse.json({
    totalExpenses,
    expenseCount,
    avgExpense,
    topCategories,
    monthlyTotals,
    recentExpenses,
    year,
    month: month ? parseInt(month) : null,
  });
}
