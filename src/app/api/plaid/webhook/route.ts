import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncItemTransactions } from "@/app/api/plaid/sync/route";

// POST /api/plaid/webhook — called by Plaid when new transactions are available
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { webhook_type, webhook_code, item_id } = body;

    console.log(`Plaid webhook: ${webhook_type} / ${webhook_code} for item ${item_id}`);

    // We care about transaction updates
    if (webhook_type === "TRANSACTIONS") {
      const plaidItem = await prisma.plaidItem.findUnique({
        where: { plaidItemId: item_id },
      });

      if (!plaidItem) {
        console.warn(`Webhook received for unknown item: ${item_id}`);
        return NextResponse.json({ received: true });
      }

      if (
        webhook_code === "SYNC_UPDATES_AVAILABLE" ||
        webhook_code === "INITIAL_UPDATE" ||
        webhook_code === "HISTORICAL_UPDATE" ||
        webhook_code === "DEFAULT_UPDATE"
      ) {
        await syncItemTransactions(
          plaidItem.id,
          plaidItem.accessToken,
          plaidItem.cursor,
          plaidItem.userId
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Plaid webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
