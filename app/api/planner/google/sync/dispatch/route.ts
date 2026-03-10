import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllGoogleCalendarSpaces } from "@/lib/google-sync";

export const dynamic = "force-dynamic";

async function dispatchGoogleSync(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncAllGoogleCalendarSpaces();
    return NextResponse.json({
      ok: true,
      syncedSpaces: summary.results.length,
      failedSpaces: summary.failures.length,
      totalImportedCount: summary.totalImportedCount,
      totalSpaces: summary.totalSpaces,
      failures: summary.failures,
      results: summary.results,
    });
  } catch (error) {
    console.error("Google Calendar sync dispatch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to dispatch Google Calendar sync." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return dispatchGoogleSync(req);
}

export async function POST(req: Request) {
  return dispatchGoogleSync(req);
}
