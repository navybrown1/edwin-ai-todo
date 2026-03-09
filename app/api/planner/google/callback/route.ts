import { NextResponse } from "next/server";
import { decodeGoogleState, exchangeGoogleCode, fetchGoogleEmail } from "@/lib/google-calendar";
import { upsertGoogleConnection } from "@/lib/planner-db";

export const dynamic = "force-dynamic";

function redirectToApp(origin: string, spaceKey: string, status: string) {
  return `${origin}/?space=${encodeURIComponent(spaceKey)}&planner=${encodeURIComponent(status)}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = decodeGoogleState(url.searchParams.get("state"));
  const spaceKey = state?.spaceKey || "default";

  if (error || !code) {
    return NextResponse.redirect(redirectToApp(url.origin, spaceKey, "google-error"));
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const googleEmail = await fetchGoogleEmail(tokens.access_token);

    await upsertGoogleConnection(spaceKey, {
      accessToken: tokens.access_token,
      expiryDate: tokens.expiry_date ?? null,
      googleEmail,
      refreshToken: tokens.refresh_token ?? "",
      scope: tokens.scope ?? null,
      spaceKey,
      tokenType: tokens.token_type ?? null,
    });

    return NextResponse.redirect(redirectToApp(url.origin, spaceKey, "google-connected"));
  } catch (reason) {
    console.error("GET /api/planner/google/callback error:", reason);
    return NextResponse.redirect(redirectToApp(url.origin, spaceKey, "google-error"));
  }
}
