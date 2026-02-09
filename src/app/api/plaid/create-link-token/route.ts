import { NextResponse } from "next/server";
import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from "@/lib/plaid";
import { getSessionUser, unauthorized } from "@/lib/auth-helpers";
import { Products, CountryCode } from "plaid";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "BizExpenseTracker",
      products: PLAID_PRODUCTS.map((p) => p as Products),
      country_codes: PLAID_COUNTRY_CODES.map((c) => c as CountryCode),
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: unknown) {
    console.error("Plaid link token error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create link token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
