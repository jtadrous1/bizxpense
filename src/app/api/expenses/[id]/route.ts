import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

// GET /api/expenses/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    include: { category: true },
  });

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json(expense);
}

// PUT /api/expenses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  // Verify ownership
  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { date, vendor, description, amount, categoryId, paymentMethod, notes, tags, receiptPath, receiptName } = body;

    if (!date || !vendor || amount === undefined) {
      return badRequest("Date, vendor, and amount are required");
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: new Date(date),
        vendor,
        description: description || null,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        tags: tags || null,
        receiptPath: receiptPath !== undefined ? receiptPath : existing.receiptPath,
        receiptName: receiptName !== undefined ? receiptName : existing.receiptName,
      },
      include: { category: true },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
