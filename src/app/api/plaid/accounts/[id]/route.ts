import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";

// DELETE /api/plaid/accounts/:id — disconnect an institution
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const plaidItem = await prisma.plaidItem.findFirst({
    where: { id, userId: user.id },
  });

  if (!plaidItem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Remove item from Plaid
  try {
    await plaidClient.itemRemove({ access_token: plaidItem.accessToken });
  } catch (error) {
    console.warn("Plaid item remove failed (may already be removed):", error);
  }

  // Delete from our database (cascades to PlaidAccount)
  await prisma.plaidItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
