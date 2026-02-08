import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

// Default categories for new users (IRS Schedule C + common extras)
const DEFAULT_CATEGORIES = [
  { name: "Advertising", color: "#EF4444", scheduleCCode: "Line 8" },
  { name: "Car & Truck Expenses", color: "#F97316", scheduleCCode: "Line 9" },
  { name: "Commissions & Fees", color: "#F59E0B", scheduleCCode: "Line 10" },
  { name: "Contract Labor", color: "#EAB308", scheduleCCode: "Line 11" },
  { name: "Depreciation", color: "#84CC16", scheduleCCode: "Line 13" },
  { name: "Insurance", color: "#22C55E", scheduleCCode: "Line 15" },
  { name: "Interest (Mortgage)", color: "#10B981", scheduleCCode: "Line 16a" },
  { name: "Interest (Other)", color: "#14B8A6", scheduleCCode: "Line 16b" },
  { name: "Legal & Professional Services", color: "#06B6D4", scheduleCCode: "Line 17" },
  { name: "Office Expense", color: "#0EA5E9", scheduleCCode: "Line 18" },
  { name: "Rent/Lease (Vehicles & Equipment)", color: "#3B82F6", scheduleCCode: "Line 20a" },
  { name: "Rent/Lease (Other)", color: "#6366F1", scheduleCCode: "Line 20b" },
  { name: "Repairs & Maintenance", color: "#8B5CF6", scheduleCCode: "Line 21" },
  { name: "Supplies", color: "#A855F7", scheduleCCode: "Line 22" },
  { name: "Taxes & Licenses", color: "#D946EF", scheduleCCode: "Line 23" },
  { name: "Travel", color: "#EC4899", scheduleCCode: "Line 24a" },
  { name: "Deductible Meals", color: "#F43F5E", scheduleCCode: "Line 24b" },
  { name: "Utilities", color: "#78716C", scheduleCCode: "Line 25" },
  { name: "Wages", color: "#64748B", scheduleCCode: "Line 26" },
  { name: "Other Expenses", color: "#6B7280", scheduleCCode: "Line 27a" },
  { name: "Software & Subscriptions", color: "#0891B2", scheduleCCode: null },
  { name: "Tools & Equipment", color: "#059669", scheduleCCode: null },
  { name: "Education & Training", color: "#7C3AED", scheduleCCode: null },
  { name: "Phone & Internet", color: "#2563EB", scheduleCCode: null },
  { name: "Bank & Merchant Fees", color: "#DC2626", scheduleCCode: null },
];

// GET /api/categories
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  // Check if user has categories; if not, create defaults
  const count = await prisma.category.count({ where: { userId: user.id } });

  if (count === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        userId: user.id,
      })),
    });
  }

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { expenses: true } },
    },
  });

  return NextResponse.json(categories);
}

// POST /api/categories
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();
    const { name, color, scheduleCCode } = body;

    if (!name) return badRequest("Category name is required");

    const existing = await prisma.category.findFirst({
      where: { name, userId: user.id },
    });

    if (existing) return badRequest("Category already exists");

    const category = await prisma.category.create({
      data: {
        name,
        color: color || "#6B7280",
        scheduleCCode: scheduleCCode || null,
        userId: user.id,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
