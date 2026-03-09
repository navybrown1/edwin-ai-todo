import { NextResponse } from "next/server";
import { getGoogleCalendarConfig } from "@/lib/google-calendar";
import { getPlannerSettings, updatePlannerSettings } from "@/lib/planner-db";
import { getEmailReminderConfig, getPushConfig } from "@/lib/reminders";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

function capabilities() {
  const google = getGoogleCalendarConfig();
  const push = getPushConfig();
  const email = getEmailReminderConfig();

  return {
    emailReady: email.ready,
    googleReady: google.ready,
    pushPublicKey: push.publicKey,
    pushReady: push.ready,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const settings = await getPlannerSettings(spaceKey);
    return NextResponse.json({
      ...settings,
      capabilities: capabilities(),
    });
  } catch (error) {
    console.error("GET /api/planner/settings error:", error);
    return NextResponse.json({ error: "Failed to load planner settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const spaceKey = sanitizeSpaceKey(body.spaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const settings = await updatePlannerSettings(spaceKey, {
      emailAddress: typeof body.emailAddress === "string" ? body.emailAddress : undefined,
      emailEnabled: typeof body.emailEnabled === "boolean" ? body.emailEnabled : undefined,
      googleCalendarId: typeof body.googleCalendarId === "string" ? body.googleCalendarId : undefined,
      googleCalendarLabel: typeof body.googleCalendarLabel === "string" ? body.googleCalendarLabel : undefined,
      pushEnabled: typeof body.pushEnabled === "boolean" ? body.pushEnabled : undefined,
      reminderLeadMinutes: Number.isFinite(body.reminderLeadMinutes) ? Number(body.reminderLeadMinutes) : undefined,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
    });

    return NextResponse.json({
      ...settings,
      capabilities: capabilities(),
    });
  } catch (error) {
    console.error("PATCH /api/planner/settings error:", error);
    return NextResponse.json({ error: "Failed to update planner settings" }, { status: 500 });
  }
}
