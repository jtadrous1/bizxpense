import { NextRequest, NextResponse } from "next/server";
import { plaidClient } from "@/lib/plaid";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const { public_token, metadata } = await req.json();

    if (!public_token) {
      return badRequest("public_token is required");
    }

    // Exchange public token for permanent access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Get institution info
    const institutionId = metadata?.institution?.institution_id || null;
    const institutionName = metadata?.institution?.name || null;

    // Save PlaidItem to database
    const plaidItem = await prisma.plaidItem.create({
      data: {
        plaidItemId: item_id,
        accessToken: access_token,
        institutionId,
        institutionName,
        userId: user.id,
      },
    });

    // Fetch and store accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token,
    });

    for (const account of accountsResponse.data.accounts) {
      await prisma.plaidAccount.create({
        data: {
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name || null,
          type: account.type,
          subtype: account.subtype || null,
          mask: account.mask || null,
          plaidItemId: plaidItem.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      itemId: plaidItem.id,
      institutionName,
      accountCount: accountsResponse.data.accounts.length,
    });
  } catch (error: unknown) {
    console.error("Plaid token exchange error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to exchange token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
