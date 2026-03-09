import { DEFAULT_SPACE_TITLE } from "@/lib/ai-config";
import type { PlannerEvent, PlannerEventInput, PlannerSettings, Subtask, Task, Workspace } from "@/types";

const TASKS_PREFIX = "nova.tasks.";
const WORKSPACE_PREFIX = "nova.workspace.";
const PLANNER_EVENTS_PREFIX = "nova.events.";
const PLANNER_SETTINGS_PREFIX = "nova.planner.settings.";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function getNowIso() {
  return new Date().toISOString();
}

function getTimezone() {
  return typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
    : "America/New_York";
}

function normalizeSubtask(candidate: unknown, fallbackId: number, taskId: number): Subtask | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const next = candidate as Partial<Subtask>;
  const text = typeof next.text === "string" ? next.text.trim() : "";
  if (!text) {
    return null;
  }

  return {
    done: Boolean(next.done),
    id: Number.isInteger(next.id) && Number(next.id) > 0 ? Number(next.id) : fallbackId,
    task_id: Number.isInteger(next.task_id) && Number(next.task_id) > 0 ? Number(next.task_id) : taskId,
    text,
  };
}

export function loadLocalTasks(spaceKey: string): Task[] {
  const raw = readJson<unknown[]>(`${TASKS_PREFIX}${spaceKey}`, []);
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized = raw
    .map((candidate, index) => {
      if (!candidate || typeof candidate !== "object") {
        return null;
      }

      const next = candidate as Partial<Task>;
      const text = typeof next.text === "string" ? next.text.trim() : "";
      const cat = typeof next.cat === "string" ? next.cat.trim() : "";

      if (!text || !cat) {
        return null;
      }

      const id = Number.isInteger(next.id) && Number(next.id) > 0 ? Number(next.id) : index + 1;
      const subtasks = Array.isArray(next.subtasks)
        ? next.subtasks
            .map((subtask, subIndex) => normalizeSubtask(subtask, subIndex + 1, id))
            .filter(Boolean) as Subtask[]
        : [];

      return {
        cat,
        created_at: typeof next.created_at === "string" ? next.created_at : getNowIso(),
        done: Boolean(next.done),
        id,
        subtasks,
        text,
      };
    })
    .filter(Boolean) as Task[];

  writeJson(`${TASKS_PREFIX}${spaceKey}`, normalized);
  return normalized;
}

export function saveLocalTasks(spaceKey: string, tasks: Task[]) {
  writeJson(`${TASKS_PREFIX}${spaceKey}`, tasks);
}

export function nextLocalTaskId(tasks: Task[]) {
  return tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
}

export function nextLocalSubtaskId(tasks: Task[]) {
  return (
    tasks.reduce((max, task) => {
      const subtaskMax = (task.subtasks ?? []).reduce((currentMax, subtask) => Math.max(currentMax, subtask.id), 0);
      return Math.max(max, subtaskMax);
    }, 0) + 1
  );
}

export function createLocalTask(spaceKey: string, text: string, cat: string, tasks = loadLocalTasks(spaceKey)): Task {
  return {
    cat,
    created_at: getNowIso(),
    done: false,
    id: nextLocalTaskId(tasks),
    subtasks: [],
    text,
  };
}

export function loadLocalWorkspace(spaceKey: string): Workspace {
  const fallback: Workspace = {
    created_at: getNowIso(),
    memory: "",
    spaceKey,
    title: DEFAULT_SPACE_TITLE,
    updated_at: getNowIso(),
  };

  const raw = readJson<Partial<Workspace>>(`${WORKSPACE_PREFIX}${spaceKey}`, fallback);
  const next: Workspace = {
    created_at: typeof raw.created_at === "string" ? raw.created_at : fallback.created_at,
    memory: typeof raw.memory === "string" ? raw.memory : "",
    spaceKey,
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : DEFAULT_SPACE_TITLE,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : fallback.updated_at,
  };

  writeJson(`${WORKSPACE_PREFIX}${spaceKey}`, next);
  return next;
}

export function saveLocalWorkspace(spaceKey: string, fields: Partial<Pick<Workspace, "title" | "memory">>) {
  const current = loadLocalWorkspace(spaceKey);
  const next: Workspace = {
    ...current,
    memory: typeof fields.memory === "string" ? fields.memory : current.memory,
    title: typeof fields.title === "string" && fields.title.trim() ? fields.title.trim() : current.title,
    updated_at: getNowIso(),
  };

  writeJson(`${WORKSPACE_PREFIX}${spaceKey}`, next);
  return next;
}

function makeLocalPlannerEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `local-${crypto.randomUUID()}`;
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePlannerEvent(spaceKey: string, candidate: unknown): PlannerEvent | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const next = candidate as Partial<PlannerEvent>;
  const date = typeof next.date === "string" ? next.date : "";
  const text = typeof next.text === "string" ? next.text.trim() : "";
  const color = typeof next.color === "string" ? next.color : "#f0c040";

  if (!date || !text) {
    return null;
  }

  return {
    calendarId: typeof next.calendarId === "string" ? next.calendarId : null,
    color,
    created_at: typeof next.created_at === "string" ? next.created_at : getNowIso(),
    date,
    externalId: typeof next.externalId === "string" ? next.externalId : null,
    id: typeof next.id === "string" && next.id ? next.id : makeLocalPlannerEventId(),
    scheduledAt: typeof next.scheduledAt === "string" || next.scheduledAt === null ? next.scheduledAt : null,
    source: next.source === "google" ? "google" : "manual",
    spaceKey,
    text,
    time: typeof next.time === "string" ? next.time : undefined,
    updated_at: typeof next.updated_at === "string" ? next.updated_at : getNowIso(),
  };
}

export function loadLocalPlannerEvents(spaceKey: string): PlannerEvent[] {
  const raw = readJson<unknown[]>(`${PLANNER_EVENTS_PREFIX}${spaceKey}`, []);
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized = raw
    .map((candidate) => normalizePlannerEvent(spaceKey, candidate))
    .filter(Boolean) as PlannerEvent[];

  writeJson(`${PLANNER_EVENTS_PREFIX}${spaceKey}`, normalized);
  return normalized;
}

export function saveLocalPlannerEvents(spaceKey: string, events: PlannerEvent[]) {
  writeJson(`${PLANNER_EVENTS_PREFIX}${spaceKey}`, events);
}

export function createLocalPlannerEvent(spaceKey: string, input: PlannerEventInput): PlannerEvent {
  return {
    calendarId: input.calendarId ?? null,
    color: input.color,
    created_at: getNowIso(),
    date: input.date,
    externalId: input.externalId ?? null,
    id: makeLocalPlannerEventId(),
    scheduledAt: input.scheduledAt ?? null,
    source: input.source === "google" ? "google" : "manual",
    spaceKey,
    text: input.text.trim(),
    time: input.time,
    updated_at: getNowIso(),
  };
}

export function loadLocalPlannerSettings(spaceKey: string): PlannerSettings {
  const fallback: PlannerSettings = {
    emailAddress: "",
    emailEnabled: false,
    googleCalendarId: "primary",
    googleCalendarLabel: "Primary calendar",
    googleConnected: false,
    googleEmail: "",
    lastGoogleSyncAt: null,
    pushEnabled: false,
    reminderLeadMinutes: 30,
    spaceKey,
    timezone: getTimezone(),
  };

  const raw = readJson<Partial<PlannerSettings>>(`${PLANNER_SETTINGS_PREFIX}${spaceKey}`, fallback);
  const next: PlannerSettings = {
    emailAddress: typeof raw.emailAddress === "string" ? raw.emailAddress : "",
    emailEnabled: Boolean(raw.emailEnabled),
    googleCalendarId: typeof raw.googleCalendarId === "string" ? raw.googleCalendarId : "primary",
    googleCalendarLabel: typeof raw.googleCalendarLabel === "string" ? raw.googleCalendarLabel : "Primary calendar",
    googleConnected: Boolean(raw.googleConnected),
    googleEmail: typeof raw.googleEmail === "string" ? raw.googleEmail : "",
    lastGoogleSyncAt: typeof raw.lastGoogleSyncAt === "string" || raw.lastGoogleSyncAt === null ? raw.lastGoogleSyncAt : null,
    pushEnabled: Boolean(raw.pushEnabled),
    reminderLeadMinutes:
      Number.isFinite(raw.reminderLeadMinutes) && Number(raw.reminderLeadMinutes) > 0
        ? Number(raw.reminderLeadMinutes)
        : 30,
    spaceKey,
    timezone: typeof raw.timezone === "string" && raw.timezone ? raw.timezone : getTimezone(),
  };

  writeJson(`${PLANNER_SETTINGS_PREFIX}${spaceKey}`, next);
  return next;
}

export function saveLocalPlannerSettings(spaceKey: string, update: Partial<PlannerSettings>) {
  const current = loadLocalPlannerSettings(spaceKey);
  const next: PlannerSettings = {
    ...current,
    ...update,
    emailAddress: typeof update.emailAddress === "string" ? update.emailAddress : current.emailAddress,
    reminderLeadMinutes:
      Number.isFinite(update.reminderLeadMinutes) && Number(update.reminderLeadMinutes) > 0
        ? Number(update.reminderLeadMinutes)
        : current.reminderLeadMinutes,
    spaceKey,
    timezone: typeof update.timezone === "string" && update.timezone ? update.timezone : current.timezone,
  };

  writeJson(`${PLANNER_SETTINGS_PREFIX}${spaceKey}`, next);
  return next;
}

export function localWorkspaceHasContent(spaceKey: string) {
  const workspace = loadLocalWorkspace(spaceKey);
  return workspace.title.trim() !== DEFAULT_SPACE_TITLE || Boolean(workspace.memory.trim());
}

export function localSpaceHasPlannerEvents(spaceKey: string) {
  return loadLocalPlannerEvents(spaceKey).length > 0;
}

export function localPlannerSettingsHaveChanges(spaceKey: string) {
  const settings = loadLocalPlannerSettings(spaceKey);

  return Boolean(
    settings.emailAddress.trim() ||
      settings.emailEnabled ||
      settings.pushEnabled ||
      settings.reminderLeadMinutes !== 30 ||
      settings.googleConnected ||
      settings.googleEmail.trim() ||
      settings.googleCalendarId !== "primary" ||
      settings.googleCalendarLabel !== "Primary calendar",
  );
}

export function localSpaceHasTasks(spaceKey: string) {
  return loadLocalTasks(spaceKey).length > 0;
}

export function localSpaceHasAnyData(spaceKey: string) {
  return localSpaceHasTasks(spaceKey) || localWorkspaceHasContent(spaceKey) || localSpaceHasPlannerEvents(spaceKey);
}
