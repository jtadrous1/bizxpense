import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

// GET /api/expenses - List expenses with filters
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const amountMin = searchParams.get("amountMin") || "";
  const amountMax = searchParams.get("amountMax") || "";
  const paymentMethod = searchParams.get("paymentMethod") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const sortBy = searchParams.get("sortBy") || "date";
  const sortDir = searchParams.get("sortDir") || "desc";

  const where: Prisma.ExpenseWhereInput = {
    userId: user.id,
  };

  if (search) {
    where.OR = [
      { vendor: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) where.categoryId = categoryId;

  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  if (amountMin || amountMax) {
    where.amount = {};
    if (amountMin) where.amount.gte = parseFloat(amountMin);
    if (amountMax) where.amount.lte = parseFloat(amountMax);
  }

  if (paymentMethod) where.paymentMethod = paymentMethod;

  const orderBy: Prisma.ExpenseOrderByWithRelationInput = {};
  const validSortFields = ["date", "amount", "vendor", "createdAt"];
  const field = validSortFields.includes(sortBy) ? sortBy : "date";
  orderBy[field as keyof Prisma.ExpenseOrderByWithRelationInput] =
    sortDir === "asc" ? "asc" : "desc";

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({
    expenses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/expenses - Create expense
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { date, vendor, description, amount, categoryId, paymentMethod, notes, tags } = body;

    if (!date || !vendor || amount === undefined) {
      return badRequest("Date, vendor, and amount are required");
    }

    const expense = await prisma.expense.create({
      data: {
        date: new Date(date + "T12:00:00"),
        vendor,
        description: description || null,
        amount: parseFloat(amount),
        categoryId: categoryId || null,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        tags: tags || null,
        userId: user.id,
      },
      include: { category: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
