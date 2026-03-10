import { NextResponse } from "next/server";
import {
  getDueReminderJobs,
  getPlannerSettings,
  listPushSubscriptions,
  recordReminderDelivery,
  wasReminderDelivered,
} from "@/lib/planner-db";
import { getEmailReminderCapability, getPushConfig, sendEmailReminder, sendPushReminder } from "@/lib/reminders";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const bearer = req.headers.get("authorization");
  const userAgent = req.headers.get("user-agent") || "";

  if (userAgent.includes("vercel-cron/1.0")) {
    return true;
  }

  if (!secret) {
    return true;
  }

  return bearer === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function dispatchReminders(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await getDueReminderJobs();
    const pushConfig = getPushConfig();
    const now = Date.now();

    let sent = 0;
    let skipped = 0;

    for (const job of jobs) {
      const scheduledAt = Date.parse(job.scheduledAt);
      const triggerAtIso = new Date(scheduledAt - job.reminderLeadMinutes * 60_000).toISOString();

      if (Date.parse(triggerAtIso) > now) {
        continue;
      }

      const settings = await getPlannerSettings(job.spaceKey);
      const emailConfig = await getEmailReminderCapability(job.spaceKey);

      if (job.emailEnabled && settings.emailAddress && emailConfig.ready) {
        const alreadySent = await wasReminderDelivered(job.eventId, "email", triggerAtIso);
        if (!alreadySent) {
          try {
            await sendEmailReminder(
              job.spaceKey,
              settings.emailAddress,
              `Upcoming: ${job.text}`,
              `<p><strong>${job.text}</strong> starts at ${job.time ?? "soon"} on ${job.date}.</p>`,
            );
            await recordReminderDelivery(job.eventId, "email", triggerAtIso, "sent");
            sent += 1;
          } catch (error) {
            await recordReminderDelivery(job.eventId, "email", triggerAtIso, "failed", error instanceof Error ? error.message : "Email send failed");
          }
        } else {
          skipped += 1;
        }
      }

      if (job.pushEnabled && pushConfig.ready) {
        const subscriptions = await listPushSubscriptions(job.spaceKey);
        if (subscriptions.length > 0) {
          const alreadySent = await wasReminderDelivered(job.eventId, "push", triggerAtIso);
          if (!alreadySent) {
            try {
              await sendPushReminder(subscriptions, {
                body: `${job.text} starts at ${job.time ?? "soon"}.`,
                tag: `planner-${job.eventId}-${triggerAtIso}`,
                title: "Upcoming planner event",
                url: `/?space=${encodeURIComponent(job.spaceKey)}`,
              });
              await recordReminderDelivery(job.eventId, "push", triggerAtIso, "sent");
              sent += 1;
            } catch (error) {
              await recordReminderDelivery(job.eventId, "push", triggerAtIso, "failed", error instanceof Error ? error.message : "Push send failed");
            }
          } else {
            skipped += 1;
          }
        }
      }
    }

    return NextResponse.json({ ok: true, sent, skipped });
  } catch (error) {
    console.error("POST /api/planner/reminders/dispatch error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to dispatch reminders" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return dispatchReminders(req);
}

export async function POST(req: Request) {
  return dispatchReminders(req);
}
