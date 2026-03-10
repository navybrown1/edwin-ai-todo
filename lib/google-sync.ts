import { fetchGoogleCalendarSnapshot, getValidGoogleAccessToken } from "@/lib/google-calendar";
import {
  getGoogleConnection,
  getPlannerSettings,
  listGoogleConnectionSpaceKeys,
  replaceGoogleEvents,
  upsertGoogleConnection,
} from "@/lib/planner-db";

export interface GoogleSyncResult {
  importedCount: number;
  spaceKey: string;
  synced: boolean;
}

export async function syncGoogleCalendarSpace(spaceKey: string): Promise<GoogleSyncResult> {
  const connection = await getGoogleConnection(spaceKey);
  if (!connection) {
    throw new Error("Google Calendar is not connected yet.");
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

  return {
    importedCount: snapshot.events.length,
    spaceKey,
    synced: true,
  };
}

export async function syncAllGoogleCalendarSpaces() {
  const spaceKeys = await listGoogleConnectionSpaceKeys();
  const results: GoogleSyncResult[] = [];
  const failures: Array<{ error: string; spaceKey: string }> = [];

  for (const spaceKey of spaceKeys) {
    try {
      results.push(await syncGoogleCalendarSpace(spaceKey));
    } catch (error) {
      failures.push({
        error: error instanceof Error ? error.message : "Failed to sync Google Calendar.",
        spaceKey,
      });
    }
  }

  return {
    failures,
    results,
    totalImportedCount: results.reduce((total, result) => total + result.importedCount, 0),
    totalSpaces: spaceKeys.length,
  };
}
