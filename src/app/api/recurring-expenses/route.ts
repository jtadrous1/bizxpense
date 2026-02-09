import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

// GET /api/recurring-expenses - List all recurring expenses
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") !== "false";

  const where = {
    userId: user.id,
    ...(activeOnly ? { isActive: true } : {}),
  };

  const recurringExpenses = await prisma.recurringExpense.findMany({
    where,
    include: {
      category: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { nextDueDate: "asc" },
  });

  return NextResponse.json(recurringExpenses);
}

// POST /api/recurring-expenses - Create a recurring expense
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const {
      vendor,
      description,
      amount,
      categoryId,
      paymentMethod,
      notes,
      tags,
      frequency,
      dayOfMonth,
      startDate,
      endDate,
    } = body;

    if (!vendor || amount === undefined || !startDate) {
      return badRequest("Vendor, amount, and start date are required");
    }

    const day = parseInt(dayOfMonth) || 1;
    if (day < 1 || day > 28) {
      return badRequest("Day of month must be between 1 and 28");
    }

    // Calculate the next due date
    const start = new Date(startDate);
    const now = new Date();
    let nextDueDate: Date;

    if (start > now) {
      // Start date is in the future, use it
      nextDueDate = new Date(start.getFullYear(), start.getMonth(), day);
      if (nextDueDate < start) {
        nextDueDate = getNextDate(nextDueDate, frequency || "monthly");
      }
    } else {
      // Start date is in the past, calculate next upcoming date
      nextDueDate = new Date(now.getFullYear(), now.getMonth(), day);
      if (nextDueDate <= now) {
        nextDueDate = getNextDate(nextDueDate, frequency || "monthly");
      }
    }

    const recurringExpense = await prisma.recurringExpense.create({
      data: {
        vendor,
        description: description || null,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        tags: tags || null,
        frequency: frequency || "monthly",
        dayOfMonth: day,
        startDate: start,
        endDate: endDate ? new Date(endDate) : null,
        nextDueDate,
        userId: user.id,
      },
      include: { category: true },
    });

    return NextResponse.json(recurringExpense, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring expense:", error);
    return NextResponse.json(
      { error: "Failed to create recurring expense" },
      { status: 500 }
    );
  }
}

function getNextDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "monthly":
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}
