import { NextResponse } from "next/server";
import { syncGoogleCalendarSpace } from "@/lib/google-sync";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const result = await syncGoogleCalendarSpace(spaceKey);
    return NextResponse.json({ ...result, ok: true });
  } catch (error) {
    console.error("POST /api/planner/google/sync error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to sync Google Calendar." }, { status: 500 });
  }
}
