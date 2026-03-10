import { sql } from "@vercel/postgres";
import { ensureSchema } from "@/lib/db";
import type {
  GoogleCalendarConnection,
  PlannerEvent,
  PlannerEventInput,
  PlannerSettings,
  PlannerSettingsUpdate,
  PushSubscriptionRecord,
} from "@/types";

let plannerSchemaPromise: Promise<void> | null = null;

type PlannerEventRow = {
  id: string;
  spaceKey: string;
  date: string;
  text: string;
  color: string;
  time: string | null;
  scheduledAt: string | null;
  source: "manual" | "google";
  calendarId: string | null;
  externalId: string | null;
  created_at: string;
  updated_at: string;
};

type PlannerSettingsRow = Omit<PlannerSettings, "emailEnabled" | "pushEnabled" | "googleConnected" | "reminderLeadMinutes"> & {
  emailEnabled: boolean;
  pushEnabled: boolean;
  googleConnected: boolean;
  reminderLeadMinutes: number;
};

function normalizeLeadMinutes(value?: number) {
  if (!value || Number.isNaN(value)) return 30;
  return Math.min(Math.max(Math.round(value), 5), 24 * 60);
}

function normalizePlannerEvent(row: PlannerEventRow): PlannerEvent {
  return {
    ...row,
    time: row.time ?? undefined,
    scheduledAt: row.scheduledAt ?? null,
    calendarId: row.calendarId ?? null,
    externalId: row.externalId ?? null,
  };
}

async function ensurePlannerSettingsRow(spaceKey: string) {
  await ensurePlannerSchema();
  await sql`
    INSERT INTO planner_settings (space_key)
    VALUES (${spaceKey})
    ON CONFLICT (space_key) DO NOTHING
  `;
}

export async function ensurePlannerSchema() {
  if (!plannerSchemaPromise) {
    plannerSchemaPromise = (async () => {
      await ensureSchema();

      await sql`
        CREATE TABLE IF NOT EXISTS planner_settings (
          space_key VARCHAR(64) PRIMARY KEY REFERENCES spaces(space_key) ON DELETE CASCADE,
          email_address TEXT NOT NULL DEFAULT '',
          email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          reminder_lead_minutes INTEGER NOT NULL DEFAULT 30,
          timezone TEXT NOT NULL DEFAULT 'America/New_York',
          google_connected BOOLEAN NOT NULL DEFAULT FALSE,
          google_email TEXT NOT NULL DEFAULT '',
          google_calendar_id TEXT NOT NULL DEFAULT 'primary',
          google_calendar_label TEXT NOT NULL DEFAULT 'Primary calendar',
          last_google_sync_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS planner_events (
          id SERIAL PRIMARY KEY,
          space_key VARCHAR(64) NOT NULL REFERENCES spaces(space_key) ON DELETE CASCADE,
          event_date DATE NOT NULL,
          title TEXT NOT NULL,
          color VARCHAR(16) NOT NULL DEFAULT '#f0c040',
          time_label VARCHAR(5),
          scheduled_at TIMESTAMP WITH TIME ZONE,
          source VARCHAR(16) NOT NULL DEFAULT 'manual',
          calendar_id TEXT,
          external_id TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS google_calendar_connections (
          space_key VARCHAR(64) PRIMARY KEY REFERENCES spaces(space_key) ON DELETE CASCADE,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          token_type TEXT,
          scope TEXT,
          expiry_date TIMESTAMP WITH TIME ZONE,
          google_email TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          space_key VARCHAR(64) NOT NULL REFERENCES spaces(space_key) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS reminder_deliveries (
          id SERIAL PRIMARY KEY,
          planner_event_id INTEGER NOT NULL REFERENCES planner_events(id) ON DELETE CASCADE,
          channel VARCHAR(16) NOT NULL,
          trigger_at TIMESTAMP WITH TIME ZONE NOT NULL,
          delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(16) NOT NULL DEFAULT 'sent',
          detail TEXT NOT NULL DEFAULT ''
        )
      `;

      await sql`ALTER TABLE planner_events ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE`;
      await sql`ALTER TABLE planner_events ADD COLUMN IF NOT EXISTS time_label VARCHAR(5)`;
      await sql`ALTER TABLE planner_events ADD COLUMN IF NOT EXISTS color VARCHAR(16) NOT NULL DEFAULT '#f0c040'`;
      await sql`ALTER TABLE planner_events ADD COLUMN IF NOT EXISTS source VARCHAR(16) NOT NULL DEFAULT 'manual'`;
      await sql`ALTER TABLE planner_events ADD COLUMN IF NOT EXISTS calendar_id TEXT`;
      await sql`ALTER TABLE planner_events ADD COLUMN IF NOT EXISTS external_id TEXT`;

      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS email_address TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS reminder_lead_minutes INTEGER NOT NULL DEFAULT 30`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/New_York'`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS google_connected BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS google_email TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS google_calendar_id TEXT NOT NULL DEFAULT 'primary'`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS google_calendar_label TEXT NOT NULL DEFAULT 'Primary calendar'`;
      await sql`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS last_google_sync_at TIMESTAMP WITH TIME ZONE`;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_planner_events_external
        ON planner_events (space_key, source, external_id)
        WHERE external_id IS NOT NULL
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_planner_events_space_date
        ON planner_events (space_key, event_date ASC, scheduled_at ASC, id ASC)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_space
        ON push_subscriptions (space_key, id ASC)
      `;

      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_deliveries_unique
        ON reminder_deliveries (planner_event_id, channel, trigger_at)
      `;
    })();
  }

  await plannerSchemaPromise;
}

export async function getPlannerSettings(spaceKey: string): Promise<PlannerSettings> {
  await ensurePlannerSettingsRow(spaceKey);
  const { rows } = await sql<PlannerSettingsRow>`
    SELECT
      space_key AS "spaceKey",
      email_address AS "emailAddress",
      email_enabled AS "emailEnabled",
      push_enabled AS "pushEnabled",
      reminder_lead_minutes AS "reminderLeadMinutes",
      timezone,
      google_connected AS "googleConnected",
      google_email AS "googleEmail",
      google_calendar_id AS "googleCalendarId",
      google_calendar_label AS "googleCalendarLabel",
      last_google_sync_at AS "lastGoogleSyncAt"
    FROM planner_settings
    WHERE space_key = ${spaceKey}
    LIMIT 1
  `;

  return rows[0];
}

export async function updatePlannerSettings(spaceKey: string, update: PlannerSettingsUpdate): Promise<PlannerSettings> {
  await ensurePlannerSettingsRow(spaceKey);
  const current = await getPlannerSettings(spaceKey);
  const next = {
    emailAddress: update.emailAddress ?? current.emailAddress,
    emailEnabled: update.emailEnabled ?? current.emailEnabled,
    pushEnabled: update.pushEnabled ?? current.pushEnabled,
    reminderLeadMinutes: normalizeLeadMinutes(update.reminderLeadMinutes ?? current.reminderLeadMinutes),
    timezone: update.timezone ?? current.timezone,
    googleCalendarId: update.googleCalendarId ?? current.googleCalendarId,
    googleCalendarLabel: update.googleCalendarLabel ?? current.googleCalendarLabel,
  };

  const { rows } = await sql<PlannerSettingsRow>`
    UPDATE planner_settings
    SET
      email_address = ${next.emailAddress.trim()},
      email_enabled = ${next.emailEnabled},
      push_enabled = ${next.pushEnabled},
      reminder_lead_minutes = ${next.reminderLeadMinutes},
      timezone = ${next.timezone},
      google_calendar_id = ${next.googleCalendarId},
      google_calendar_label = ${next.googleCalendarLabel},
      updated_at = NOW()
    WHERE space_key = ${spaceKey}
    RETURNING
      space_key AS "spaceKey",
      email_address AS "emailAddress",
      email_enabled AS "emailEnabled",
      push_enabled AS "pushEnabled",
      reminder_lead_minutes AS "reminderLeadMinutes",
      timezone,
      google_connected AS "googleConnected",
      google_email AS "googleEmail",
      google_calendar_id AS "googleCalendarId",
      google_calendar_label AS "googleCalendarLabel",
      last_google_sync_at AS "lastGoogleSyncAt"
  `;

  return rows[0];
}

export async function getPlannerEvents(spaceKey: string): Promise<PlannerEvent[]> {
  await ensurePlannerSchema();
  const { rows } = await sql<PlannerEventRow>`
    SELECT
      id::text AS id,
      space_key AS "spaceKey",
      TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
      title AS text,
      color,
      time_label AS time,
      scheduled_at::text AS "scheduledAt",
      source,
      calendar_id AS "calendarId",
      external_id AS "externalId",
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM planner_events
    WHERE space_key = ${spaceKey}
    ORDER BY event_date ASC, scheduled_at ASC NULLS LAST, id ASC
  `;

  return rows.map(normalizePlannerEvent);
}

export async function createPlannerEvent(spaceKey: string, input: PlannerEventInput): Promise<PlannerEvent> {
  await ensurePlannerSettingsRow(spaceKey);
  const { rows } = await sql<PlannerEventRow>`
    INSERT INTO planner_events (
      space_key,
      event_date,
      title,
      color,
      time_label,
      scheduled_at,
      source,
      calendar_id,
      external_id,
      updated_at
    )
    VALUES (
      ${spaceKey},
      ${input.date},
      ${input.text.trim()},
      ${input.color},
      ${input.time ?? null},
      ${input.scheduledAt ?? null},
      ${input.source ?? "manual"},
      ${input.calendarId ?? null},
      ${input.externalId ?? null},
      NOW()
    )
    RETURNING
      id::text AS id,
      space_key AS "spaceKey",
      TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
      title AS text,
      color,
      time_label AS time,
      scheduled_at::text AS "scheduledAt",
      source,
      calendar_id AS "calendarId",
      external_id AS "externalId",
      created_at::text AS created_at,
      updated_at::text AS updated_at
  `;

  return normalizePlannerEvent(rows[0]);
}

export async function createPlannerEventsBulk(spaceKey: string, inputs: PlannerEventInput[]): Promise<PlannerEvent[]> {
  await ensurePlannerSettingsRow(spaceKey);
  if (inputs.length === 0) return [];
  return Promise.all(inputs.map((input) => createPlannerEvent(spaceKey, input)));
}

export async function updatePlannerEvent(id: string, spaceKey: string, fields: Partial<PlannerEventInput>): Promise<PlannerEvent> {
  await ensurePlannerSchema();
  const existing = await sql`
    SELECT id FROM planner_events
    WHERE id = ${Number(id)} AND space_key = ${spaceKey}
    LIMIT 1
  `;

  if ((existing.rowCount ?? 0) === 0) {
    throw new Error("Planner event not found");
  }

  const current = (await getPlannerEvents(spaceKey)).find((event) => event.id === id);
  if (!current) {
    throw new Error("Planner event not found");
  }

  const next = {
    date: fields.date ?? current.date,
    text: fields.text ?? current.text,
    color: fields.color ?? current.color,
    time: fields.time === undefined ? current.time ?? null : fields.time ?? null,
    scheduledAt: fields.scheduledAt === undefined ? current.scheduledAt ?? null : fields.scheduledAt ?? null,
  };

  const { rows } = await sql<PlannerEventRow>`
    UPDATE planner_events
    SET
      event_date = ${next.date},
      title = ${next.text.trim()},
      color = ${next.color},
      time_label = ${next.time},
      scheduled_at = ${next.scheduledAt},
      updated_at = NOW()
    WHERE id = ${Number(id)} AND space_key = ${spaceKey}
    RETURNING
      id::text AS id,
      space_key AS "spaceKey",
      TO_CHAR(event_date, 'YYYY-MM-DD') AS date,
      title AS text,
      color,
      time_label AS time,
      scheduled_at::text AS "scheduledAt",
      source,
      calendar_id AS "calendarId",
      external_id AS "externalId",
      created_at::text AS created_at,
      updated_at::text AS updated_at
  `;

  return normalizePlannerEvent(rows[0]);
}

export async function deletePlannerEvent(id: string, spaceKey: string): Promise<void> {
  await ensurePlannerSchema();
  await sql`
    DELETE FROM planner_events
    WHERE id = ${Number(id)} AND space_key = ${spaceKey}
  `;
}

export async function upsertGoogleConnection(spaceKey: string, connection: GoogleCalendarConnection) {
  await ensurePlannerSettingsRow(spaceKey);
  await sql`
    INSERT INTO google_calendar_connections (
      space_key,
      access_token,
      refresh_token,
      token_type,
      scope,
      expiry_date,
      google_email,
      updated_at
    )
    VALUES (
      ${spaceKey},
      ${connection.accessToken},
      ${connection.refreshToken},
      ${connection.tokenType ?? null},
      ${connection.scope ?? null},
      ${connection.expiryDate ?? null},
      ${connection.googleEmail},
      NOW()
    )
    ON CONFLICT (space_key)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(NULLIF(EXCLUDED.refresh_token, ''), google_calendar_connections.refresh_token),
      token_type = EXCLUDED.token_type,
      scope = EXCLUDED.scope,
      expiry_date = EXCLUDED.expiry_date,
      google_email = EXCLUDED.google_email,
      updated_at = NOW()
  `;

  await sql`
    UPDATE planner_settings
    SET
      google_connected = TRUE,
      google_email = ${connection.googleEmail},
      updated_at = NOW()
    WHERE space_key = ${spaceKey}
  `;
}

export async function getGoogleConnection(spaceKey: string): Promise<GoogleCalendarConnection | null> {
  await ensurePlannerSchema();
  const { rows } = await sql<{
    spaceKey: string;
    accessToken: string;
    refreshToken: string;
    tokenType: string | null;
    scope: string | null;
    expiryDate: string | null;
    googleEmail: string;
  }>`
    SELECT
      space_key AS "spaceKey",
      access_token AS "accessToken",
      refresh_token AS "refreshToken",
      token_type AS "tokenType",
      scope,
      expiry_date::text AS "expiryDate",
      google_email AS "googleEmail"
    FROM google_calendar_connections
    WHERE space_key = ${spaceKey}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function listGoogleConnectionSpaceKeys(): Promise<string[]> {
  await ensurePlannerSchema();
  const { rows } = await sql<{ spaceKey: string }>`
    SELECT space_key AS "spaceKey"
    FROM google_calendar_connections
    ORDER BY updated_at ASC, space_key ASC
  `;

  return rows.map((row) => row.spaceKey);
}

export async function clearGoogleConnection(spaceKey: string) {
  await ensurePlannerSchema();
  await sql`DELETE FROM google_calendar_connections WHERE space_key = ${spaceKey}`;
  await sql`
    UPDATE planner_settings
    SET
      google_connected = FALSE,
      google_email = '',
      last_google_sync_at = NULL,
      updated_at = NOW()
    WHERE space_key = ${spaceKey}
  `;
  await sql`
    DELETE FROM planner_events
    WHERE space_key = ${spaceKey} AND source = 'google'
  `;
}

export async function replaceGoogleEvents(
  spaceKey: string,
  calendarId: string,
  calendarLabel: string,
  googleEmail: string,
  events: PlannerEventInput[],
) {
  await ensurePlannerSettingsRow(spaceKey);
  await sql`
    DELETE FROM planner_events
    WHERE
      space_key = ${spaceKey}
      AND source = 'google'
      AND calendar_id = ${calendarId}
  `;

  for (const event of events) {
    await sql`
      INSERT INTO planner_events (
        space_key,
        event_date,
        title,
        color,
        time_label,
        scheduled_at,
        source,
        calendar_id,
        external_id,
        updated_at
      )
      VALUES (
        ${spaceKey},
        ${event.date},
        ${event.text.trim()},
        ${event.color},
        ${event.time ?? null},
        ${event.scheduledAt ?? null},
        'google',
        ${calendarId},
        ${event.externalId ?? null},
        NOW()
      )
      ON CONFLICT (space_key, source, external_id)
      WHERE external_id IS NOT NULL
      DO UPDATE SET
        event_date = EXCLUDED.event_date,
        title = EXCLUDED.title,
        color = EXCLUDED.color,
        time_label = EXCLUDED.time_label,
        scheduled_at = EXCLUDED.scheduled_at,
        calendar_id = EXCLUDED.calendar_id,
        updated_at = NOW()
    `;
  }

  await sql`
    UPDATE planner_settings
    SET
      google_connected = TRUE,
      google_email = ${googleEmail},
      google_calendar_id = ${calendarId},
      google_calendar_label = ${calendarLabel},
      last_google_sync_at = NOW(),
      updated_at = NOW()
    WHERE space_key = ${spaceKey}
  `;
}

export async function listPushSubscriptions(spaceKey: string): Promise<PushSubscriptionRecord[]> {
  await ensurePlannerSchema();
  const { rows } = await sql<PushSubscriptionRecord>`
    SELECT
      id::text AS id,
      space_key AS "spaceKey",
      endpoint,
      p256dh,
      auth,
      created_at::text AS created_at,
      updated_at::text AS updated_at
    FROM push_subscriptions
    WHERE space_key = ${spaceKey}
    ORDER BY id ASC
  `;

  return rows;
}

export async function upsertPushSubscription(record: PushSubscriptionRecord) {
  await ensurePlannerSettingsRow(record.spaceKey);
  await sql`
    INSERT INTO push_subscriptions (
      space_key,
      endpoint,
      p256dh,
      auth,
      updated_at
    )
    VALUES (
      ${record.spaceKey},
      ${record.endpoint},
      ${record.p256dh},
      ${record.auth},
      NOW()
    )
    ON CONFLICT (endpoint)
    DO UPDATE SET
      space_key = EXCLUDED.space_key,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth,
      updated_at = NOW()
  `;
}

export async function deletePushSubscription(spaceKey: string, endpoint: string) {
  await ensurePlannerSchema();
  await sql`
    DELETE FROM push_subscriptions
    WHERE space_key = ${spaceKey} AND endpoint = ${endpoint}
  `;
}

export async function getDueReminderJobs(now = new Date()) {
  await ensurePlannerSchema();
  const { rows } = await sql<{
    eventId: string;
    spaceKey: string;
    text: string;
    date: string;
    time: string | null;
    scheduledAt: string;
    emailEnabled: boolean;
    emailAddress: string;
    pushEnabled: boolean;
    reminderLeadMinutes: number;
    timezone: string;
  }>`
    SELECT
      e.id::text AS "eventId",
      e.space_key AS "spaceKey",
      e.title AS text,
      TO_CHAR(e.event_date, 'YYYY-MM-DD') AS date,
      e.time_label AS time,
      e.scheduled_at::text AS "scheduledAt",
      s.email_enabled AS "emailEnabled",
      s.email_address AS "emailAddress",
      s.push_enabled AS "pushEnabled",
      s.reminder_lead_minutes AS "reminderLeadMinutes",
      s.timezone
    FROM planner_events e
    INNER JOIN planner_settings s ON s.space_key = e.space_key
    WHERE
      e.scheduled_at IS NOT NULL
      AND (s.email_enabled = TRUE OR s.push_enabled = TRUE)
      AND e.scheduled_at >= ${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}
      AND e.scheduled_at <= ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()}
    ORDER BY e.scheduled_at ASC
  `;

  return rows;
}

export async function wasReminderDelivered(eventId: string, channel: "email" | "push", triggerAt: string) {
  await ensurePlannerSchema();
  const { rowCount } = await sql`
    SELECT 1
    FROM reminder_deliveries
    WHERE
      planner_event_id = ${Number(eventId)}
      AND channel = ${channel}
      AND trigger_at = ${triggerAt}
    LIMIT 1
  `;

  return (rowCount ?? 0) > 0;
}

export async function recordReminderDelivery(
  eventId: string,
  channel: "email" | "push",
  triggerAt: string,
  status: "sent" | "skipped" | "failed",
  detail = "",
) {
  await ensurePlannerSchema();
  await sql`
    INSERT INTO reminder_deliveries (
      planner_event_id,
      channel,
      trigger_at,
      status,
      detail
    )
    VALUES (
      ${Number(eventId)},
      ${channel},
      ${triggerAt},
      ${status},
      ${detail}
    )
    ON CONFLICT (planner_event_id, channel, trigger_at)
    DO NOTHING
  `;
}
