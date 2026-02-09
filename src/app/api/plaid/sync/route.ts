import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";
import { RemovedTransaction, Transaction } from "plaid";

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

export async function syncItemTransactions(
  plaidItemDbId: string,
  accessToken: string,
  cursor: string | null,
  userId: string
) {
  let hasMore = true;
  let currentCursor = cursor || undefined;
  let added: Transaction[] = [];
  let modified: Transaction[] = [];
  let removed: RemovedTransaction[] = [];

  // Paginate through all available updates
  while (hasMore) {
    const response = await plaidClient.transactionsSync({
      access_token: accessToken,
      cursor: currentCursor,
    });

    added = added.concat(response.data.added);
    modified = modified.concat(response.data.modified);
    removed = removed.concat(response.data.removed);
    hasMore = response.data.has_more;
    currentCursor = response.data.next_cursor;
  }

  // Process added transactions
  for (const txn of added) {
    // Skip pending transactions — we only want posted ones
    if (txn.pending) continue;

    // Plaid amounts are positive for debits (money spent) which is what we want
    const amount = Math.abs(txn.amount);

    await prisma.expense.upsert({
      where: { plaidTransactionId: txn.transaction_id },
      update: {
        date: new Date(txn.date),
        vendor: txn.merchant_name || txn.name,
        description: txn.name,
        amount,
        paymentMethod: "Credit Card",
      },
      create: {
        plaidTransactionId: txn.transaction_id,
        date: new Date(txn.date),
        vendor: txn.merchant_name || txn.name,
        description: txn.name,
        amount,
        paymentMethod: "Credit Card",
        userId,
      },
    });
  }

  // Process modified transactions
  for (const txn of modified) {
    if (txn.pending) continue;

    const amount = Math.abs(txn.amount);

    await prisma.expense.upsert({
      where: { plaidTransactionId: txn.transaction_id },
      update: {
        date: new Date(txn.date),
        vendor: txn.merchant_name || txn.name,
        description: txn.name,
        amount,
      },
      create: {
        plaidTransactionId: txn.transaction_id,
        date: new Date(txn.date),
        vendor: txn.merchant_name || txn.name,
        description: txn.name,
        amount,
        paymentMethod: "Credit Card",
        userId,
      },
    });
  }

  // Process removed transactions — delete the linked expense
  for (const txn of removed) {
    if (txn.transaction_id) {
      await prisma.expense.deleteMany({
        where: { plaidTransactionId: txn.transaction_id },
      });
    }
  }

  // Persist the cursor so next sync is incremental
  await prisma.plaidItem.update({
    where: { id: plaidItemDbId },
    data: { cursor: currentCursor, lastSynced: new Date() },
  });

  return {
    added: added.filter((t) => !t.pending).length,
    modified: modified.filter((t) => !t.pending).length,
    removed: removed.length,
  };
}
