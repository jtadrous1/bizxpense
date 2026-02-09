import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

// GET /api/plaid/accounts — list all connected accounts
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const items = await prisma.plaidItem.findMany({
    where: { userId: user.id },
    include: { accounts: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}
