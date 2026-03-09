import webpush from "web-push";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function getPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "mailto:alerts@example.com";

  return {
    publicKey,
    ready: Boolean(publicKey && privateKey),
    subject,
  };
}

function configureWebPush() {
  const publicKey = requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  const privateKey = requireEnv("VAPID_PRIVATE_KEY");
  const subject = process.env.VAPID_SUBJECT ?? "mailto:alerts@example.com";
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushReminder(
  subscriptions: Array<{ endpoint: string; p256dh: string; auth: string }>,
  payload: { body: string; tag: string; title: string; url: string },
) {
  configureWebPush();

  await Promise.all(
    subscriptions.map((subscription) =>
      webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh,
          },
        },
        JSON.stringify(payload),
      ),
    ),
  );
}

export function getEmailReminderConfig() {
  return {
    fromEmail: process.env.REMINDER_FROM_EMAIL ?? "",
    ready: Boolean(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL),
  };
}

export async function sendEmailReminder(to: string, subject: string, html: string) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("REMINDER_FROM_EMAIL");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      html,
      subject,
      to: [to],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to send reminder email.");
  }

  return data;
}
