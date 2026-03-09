import { NextResponse } from "next/server";
import { getPlannerSettings, listPushSubscriptions } from "@/lib/planner-db";
import { getEmailReminderConfig, getPushConfig, sendEmailReminder, sendPushReminder } from "@/lib/reminders";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const settings = await getPlannerSettings(spaceKey);
    const subscriptions = await listPushSubscriptions(spaceKey);
    const pushConfig = getPushConfig();
    const emailConfig = getEmailReminderConfig();

    const results: string[] = [];

    if (settings.pushEnabled && subscriptions.length > 0 && pushConfig.ready) {
      await sendPushReminder(subscriptions, {
        body: "Push reminders are connected for this planner.",
        tag: `planner-test-${spaceKey}`,
        title: "Planner alerts are ready",
        url: "/",
      });
      results.push("push");
    }

    if (settings.emailEnabled && settings.emailAddress && emailConfig.ready) {
      await sendEmailReminder(
        settings.emailAddress,
        "Planner reminders are ready",
        "<p>Your planner email reminders are connected.</p>",
      );
      results.push("email");
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: "No reminder channel is fully configured yet for this space." },
        { status: 400 },
      );
    }

    return NextResponse.json({ delivered: results });
  } catch (error) {
    console.error("POST /api/planner/reminders/test error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to send test reminder" }, { status: 500 });
  }
}
