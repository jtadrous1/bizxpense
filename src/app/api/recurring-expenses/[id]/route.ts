import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

// GET /api/recurring-expenses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const recurringExpense = await prisma.recurringExpense.findFirst({
    where: { id, userId: user.id },
    include: {
      category: true,
      _count: { select: { expenses: true } },
    },
  });

  if (!recurringExpense) {
    return NextResponse.json(
      { error: "Recurring expense not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(recurringExpense);
}

// PUT /api/recurring-expenses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Recurring expense not found" },
        { status: 404 }
      );
    }

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
      isActive,
    } = body;

    if (!vendor || amount === undefined) {
      return badRequest("Vendor and amount are required");
    }

    const day = parseInt(dayOfMonth) || existing.dayOfMonth;
    if (day < 1 || day > 28) {
      return badRequest("Day of month must be between 1 and 28");
    }

    // Recalculate next due date if frequency or day changed
    let nextDueDate = existing.nextDueDate;
    const freq = frequency || existing.frequency;
    if (
      day !== existing.dayOfMonth ||
      freq !== existing.frequency
    ) {
      const now = new Date();
      nextDueDate = new Date(now.getFullYear(), now.getMonth(), day);
      if (nextDueDate <= now) {
        nextDueDate = getNextDate(nextDueDate, freq);
      }
    }

    const updated = await prisma.recurringExpense.update({
      where: { id },
      data: {
        vendor,
        description: description || null,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        tags: tags || null,
        frequency: freq,
        dayOfMonth: day,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate ? new Date(endDate) : null,
        nextDueDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    return NextResponse.json(
      { error: "Failed to update recurring expense" },
      { status: 500 }
    );
  }
}

// DELETE /api/recurring-expenses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Recurring expense not found" },
      { status: 404 }
    );
  }

  await prisma.recurringExpense.delete({ where: { id } });

  return NextResponse.json({ success: true });
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
