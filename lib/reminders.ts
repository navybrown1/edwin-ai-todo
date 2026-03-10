import webpush from "web-push";
import {
  GOOGLE_GMAIL_SEND_SCOPE,
  getValidGoogleAccessToken,
  googleScopeIncludes,
} from "@/lib/google-calendar";
import { getGoogleConnection, upsertGoogleConnection } from "@/lib/planner-db";

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
  const resendReady = Boolean(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL);
  return {
    provider: resendReady ? "resend" : "none",
    fromEmail: process.env.REMINDER_FROM_EMAIL ?? "",
    ready: resendReady,
  };
}

export async function getEmailReminderCapability(spaceKey: string) {
  const resend = getEmailReminderConfig();
  if (resend.ready) {
    return resend;
  }

  const connection = await getGoogleConnection(spaceKey);
  if (!connection) {
    return {
      fromEmail: "",
      provider: "none" as const,
      ready: false,
    };
  }

  if (googleScopeIncludes(connection.scope, GOOGLE_GMAIL_SEND_SCOPE)) {
    return {
      fromEmail: connection.googleEmail,
      provider: "gmail" as const,
      ready: true,
    };
  }

  return {
    fromEmail: connection.googleEmail,
    provider: "google-reconnect" as const,
    ready: false,
  };
}

function buildRawEmail(from: string, to: string, subject: string, html: string) {
  const raw = [
    `From: Planner Ops <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
  ].join("\r\n");

  return Buffer.from(raw).toString("base64url");
}

export async function sendEmailReminder(spaceKey: string, to: string, subject: string, html: string) {
  const resend = getEmailReminderConfig();
  if (resend.ready) {
    return sendViaResendReminder(to, subject, html);
  }

  const connection = await getGoogleConnection(spaceKey);
  if (!connection) {
    throw new Error("Email reminders need either Resend credentials or a connected Google account.");
  }

  if (!googleScopeIncludes(connection.scope, GOOGLE_GMAIL_SEND_SCOPE)) {
    throw new Error("Reconnect Google once to grant Gmail send access for email reminders.");
  }

  const token = await getValidGoogleAccessToken(connection);
  await upsertGoogleConnection(spaceKey, {
    ...connection,
    accessToken: token.accessToken,
    expiryDate: token.expiryDate,
    refreshToken: token.refreshToken,
    scope: token.scope ?? connection.scope ?? null,
    tokenType: token.tokenType ?? connection.tokenType ?? null,
  });

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: buildRawEmail(connection.googleEmail, to, subject, html),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || "Failed to send reminder email.");
  }

  return data;
}

async function sendViaResendReminder(to: string, subject: string, html: string) {
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
