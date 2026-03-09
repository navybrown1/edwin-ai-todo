import { NextResponse } from "next/server";
import { clearGoogleConnection } from "@/lib/planner-db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    await clearGoogleConnection(spaceKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/planner/google/disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect Google Calendar." }, { status: 500 });
  }
}
