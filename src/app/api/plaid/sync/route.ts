import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";
import { syncItemTransactions } from "@/lib/plaid-sync";

// POST /api/plaid/sync  — sync transactions for all connected accounts (or one specific item)
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const itemId = body.itemId as string | undefined;

    const where = itemId
      ? { id: itemId, userId: user.id }
      : { userId: user.id };

    const plaidItems = await prisma.plaidItem.findMany({ where });

    if (plaidItems.length === 0) {
      return NextResponse.json({ synced: 0, message: "No connected accounts" });
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;

    for (const item of plaidItems) {
      const result = await syncItemTransactions(item.id, item.accessToken, item.cursor, user.id);
      totalAdded += result.added;
      totalModified += result.modified;
      totalRemoved += result.removed;
    }

    return NextResponse.json({
      synced: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
    });
  } catch (error: unknown) {
    console.error("Plaid sync error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to sync transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
