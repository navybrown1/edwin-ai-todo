import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google-calendar";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    return NextResponse.json({
      authUrl: buildGoogleAuthUrl(spaceKey),
    });
  } catch (error) {
    console.error("GET /api/planner/google/start error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to start Google Calendar connection." }, { status: 500 });
  }
}
