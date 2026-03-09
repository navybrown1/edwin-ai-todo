import { NextResponse } from "next/server";
import { fetchGoogleCalendarSnapshot, getValidGoogleAccessToken } from "@/lib/google-calendar";
import { getGoogleConnection, getPlannerSettings, replaceGoogleEvents, upsertGoogleConnection } from "@/lib/planner-db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const connection = await getGoogleConnection(spaceKey);
    if (!connection) {
      return NextResponse.json({ error: "Google Calendar is not connected yet." }, { status: 400 });
    }

    const settings = await getPlannerSettings(spaceKey);
    const token = await getValidGoogleAccessToken(connection);
    await upsertGoogleConnection(spaceKey, {
      ...connection,
      accessToken: token.accessToken,
      expiryDate: token.expiryDate,
      refreshToken: token.refreshToken,
      scope: token.scope,
      tokenType: token.tokenType,
    });

    const snapshot = await fetchGoogleCalendarSnapshot(token.accessToken, settings.googleCalendarId || "primary");
    await replaceGoogleEvents(spaceKey, snapshot.calendarId, snapshot.calendarLabel, connection.googleEmail, snapshot.events);

    return NextResponse.json({
      importedCount: snapshot.events.length,
      ok: true,
    });
  } catch (error) {
    console.error("POST /api/planner/google/sync error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to sync Google Calendar." }, { status: 500 });
  }
}
