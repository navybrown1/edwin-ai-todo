export interface Task {
  id: number;
  text: string;
  cat: string;
  done: boolean;
  created_at?: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: number;
  task_id: number;
  text: string;
  done: boolean;
}

export interface ParsedTask {
  text: string;
  cat: string;
}

export type PlannerEventSource = "manual" | "google";

export type ThemeMode = "dark" | "light" | "girl" | "fun";
export type GeminiModelId = "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite";

export interface Workspace {
  spaceKey: string;
  title: string;
  memory: string;
  created_at?: string;
  updated_at?: string;
}

export interface AiResponseMeta {
  model: GeminiModelId;
  attemptedModels: GeminiModelId[];
  fallbackUsed: boolean;
}

export interface PlannerEvent {
  id: string;
  spaceKey: string;
  date: string;
  text: string;
  color: string;
  time?: string;
  scheduledAt?: string | null;
  source: PlannerEventSource;
  calendarId?: string | null;
  externalId?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlannerEventInput {
  date: string;
  text: string;
  color: string;
  time?: string;
  scheduledAt?: string | null;
  source?: PlannerEventSource;
  calendarId?: string | null;
  externalId?: string | null;
}

export interface PlannerSettings {
  spaceKey: string;
  emailAddress: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  reminderLeadMinutes: number;
  timezone: string;
  googleConnected: boolean;
  googleEmail: string;
  googleCalendarId: string;
  googleCalendarLabel: string;
  lastGoogleSyncAt?: string | null;
}

export interface PlannerSettingsUpdate {
  emailAddress?: string;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  reminderLeadMinutes?: number;
  timezone?: string;
  googleCalendarId?: string;
  googleCalendarLabel?: string;
}

export interface GoogleCalendarConnection {
  spaceKey: string;
  accessToken: string;
  refreshToken: string;
  tokenType?: string | null;
  scope?: string | null;
  expiryDate?: string | null;
  googleEmail: string;
}

export interface PushSubscriptionRecord {
  id?: string;
  spaceKey: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: string;
  updated_at?: string;
}
