import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

// GET /api/expenses/export - Export expenses as CSV
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const format = searchParams.get("format") || "csv"; // csv or schedule-c

  const where: Record<string, unknown> = { userId: user.id };

  if (dateFrom || dateTo) {
    where.date = {} as Record<string, Date>;
    if (dateFrom) (where.date as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.date as Record<string, Date>).lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { category: true },
    orderBy: { date: "asc" },
  });

  if (format === "schedule-c") {
    return generateScheduleCExport(expenses);
  }

  return generateCSVExport(expenses);
}

function generateCSVExport(expenses: Array<Record<string, unknown>>) {
  const headers = [
    "Date",
    "Vendor",
    "Description",
    "Amount",
    "Category",
    "Schedule C Line",
    "Payment Method",
    "Notes",
    "Tags",
  ];

  const rows = expenses.map((e) => {
    const cat = e.category as { name: string; scheduleCCode: string | null } | null;
    const date = new Date(e.date as string);
    return [
      date.toISOString().split("T")[0],
      csvEscape(e.vendor as string),
      csvEscape((e.description as string) || ""),
      (parseFloat(e.amount as string)).toFixed(2),
      csvEscape(cat?.name || "Uncategorized"),
      csvEscape(cat?.scheduleCCode || ""),
      csvEscape((e.paymentMethod as string) || ""),
      csvEscape((e.notes as string) || ""),
      csvEscape((e.tags as string) || ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses-export.csv"`,
    },
  });
}

function generateScheduleCExport(expenses: Array<Record<string, unknown>>) {
  // Group expenses by Schedule C line
  const groups = new Map<string, { name: string; total: number; count: number }>();

  for (const e of expenses) {
    const cat = e.category as { name: string; scheduleCCode: string | null } | null;
    const line = cat?.scheduleCCode || "Uncategorized";
    const name = cat?.name || "Uncategorized";

    if (!groups.has(line)) {
      groups.set(line, { name, total: 0, count: 0 });
    }

    const group = groups.get(line)!;
    group.total += parseFloat(e.amount as string);
    group.count += 1;
  }

  const headers = ["Schedule C Line", "Category", "Total Amount", "# of Expenses"];

  const rows = Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([line, data]) => {
      return [
        csvEscape(line),
        csvEscape(data.name),
        data.total.toFixed(2),
        data.count.toString(),
      ].join(",");
    });

  // Add grand total
  const grandTotal = expenses.reduce((sum, e) => sum + parseFloat(e.amount as string), 0);
  rows.push(["", "GRAND TOTAL", grandTotal.toFixed(2), expenses.length.toString()].join(","));

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="schedule-c-export.csv"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
