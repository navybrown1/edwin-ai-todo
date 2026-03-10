import type { GoogleCalendarConnection, PlannerEventInput } from "@/types";

const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
export const GOOGLE_GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
export const GOOGLE_USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const GOOGLE_SCOPE = [
  GOOGLE_USERINFO_EMAIL_SCOPE,
  GOOGLE_CALENDAR_READONLY_SCOPE,
  GOOGLE_GMAIL_SEND_SCOPE,
  "openid",
].join(" ");

interface TokenPayload {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expiry_date?: string | null;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function getGoogleCalendarConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "",
    ready: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_OAUTH_REDIRECT_URI),
  };
}

export function encodeGoogleState(payload: Record<string, string>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeGoogleState(state: string | null) {
  if (!state) return null;

  try {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as Record<string, string>;
  } catch {
    return null;
  }
}

export function googleScopeIncludes(scope: string | null | undefined, requiredScope: string) {
  if (!scope) return false;
  return new Set(scope.split(/\s+/).filter(Boolean)).has(requiredScope);
}

export function buildGoogleAuthUrl(spaceKey: string) {
  const { clientId, redirectUri, ready } = getGoogleCalendarConfig();
  if (!ready) {
    throw new Error("Google Calendar is not configured for this environment.");
  }

  const params = new URLSearchParams({
    access_type: "offline",
    client_id: clientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    state: encodeGoogleState({ spaceKey }),
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<TokenPayload> {
  const body = new URLSearchParams({
    client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    code,
    grant_type: "authorization_code",
    redirect_uri: getRequiredEnv("GOOGLE_OAUTH_REDIRECT_URI"),
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to exchange Google authorization code.");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    token_type: data.token_type,
    scope: data.scope,
    expiry_date: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
  };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<TokenPayload> {
  const body = new URLSearchParams({
    client_id: getRequiredEnv("GOOGLE_CLIENT_ID"),
    client_secret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to refresh Google access token.");
  }

  return {
    access_token: data.access_token,
    refresh_token: refreshToken,
    token_type: data.token_type,
    scope: data.scope,
    expiry_date: data.expires_in ? new Date(Date.now() + Number(data.expires_in) * 1000).toISOString() : null,
  };
}

export async function getValidGoogleAccessToken(connection: GoogleCalendarConnection) {
  const expiryDate = connection.expiryDate ? Date.parse(connection.expiryDate) : null;
  const stillValid = expiryDate ? expiryDate - Date.now() > 60_000 : true;

  if (stillValid && connection.accessToken) {
    return {
      accessToken: connection.accessToken,
      expiryDate: connection.expiryDate ?? null,
      refreshToken: connection.refreshToken,
      scope: connection.scope ?? null,
      tokenType: connection.tokenType ?? null,
    };
  }

  const refreshed = await refreshGoogleAccessToken(connection.refreshToken);

  return {
    accessToken: refreshed.access_token,
    expiryDate: refreshed.expiry_date ?? null,
    refreshToken: refreshed.refresh_token ?? connection.refreshToken,
    scope: refreshed.scope ?? connection.scope ?? null,
    tokenType: refreshed.token_type ?? connection.tokenType ?? null,
  };
}

async function googleFetch<T>(accessToken: string, url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Google Calendar request failed.");
  }

  return data as T;
}

export async function fetchGoogleEmail(accessToken: string) {
  const data = await googleFetch<{ email: string }>(
    accessToken,
    "https://www.googleapis.com/oauth2/v2/userinfo",
  );
  return data.email;
}

function extractTimeLabel(dateTime: string) {
  const match = dateTime.match(/T(\d{2}):(\d{2})/);
  if (!match) return undefined;
  return `${match[1]}:${match[2]}`;
}

export async function fetchGoogleCalendarSnapshot(accessToken: string, calendarId = "primary") {
  const encodedCalendarId = encodeURIComponent(calendarId);
  const calendar = await googleFetch<{ id: string; summary?: string }>(
    accessToken,
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}`,
  );

  const timeMin = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const eventList = await googleFetch<{
    items?: Array<{
      id: string;
      summary?: string;
      start?: { date?: string; dateTime?: string };
      colorId?: string;
      status?: string;
    }>;
  }>(
    accessToken,
    `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
  );

  const colorPalette = ["#3b82f6", "#14b8a6", "#f59e0b", "#ff5ea8", "#8b5cf6", "#f97316"];

  const events: PlannerEventInput[] = (eventList.items ?? [])
    .filter((event) => event.status !== "cancelled" && (event.start?.date || event.start?.dateTime))
    .map((event, index) => {
      const rawDate = event.start?.date ?? event.start?.dateTime?.slice(0, 10) ?? "";
      const dateTime = event.start?.dateTime ?? null;
      return {
        calendarId: calendar.id,
        color: colorPalette[index % colorPalette.length],
        date: rawDate,
        externalId: event.id,
        scheduledAt: dateTime,
        source: "google",
        text: event.summary?.trim() || "Busy",
        time: dateTime ? extractTimeLabel(dateTime) : undefined,
      };
    });

  return {
    calendarId: calendar.id,
    calendarLabel: calendar.summary || "Primary calendar",
    events,
  };
}
