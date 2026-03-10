import type { PlannerEvent } from "@/types";

export const EVENT_COLORS = [
  "#f0c040",
  "#14b8a6",
  "#ff5ea8",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
  "#10b981",
];

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCalendarStart(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayIndex = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - dayIndex);
  return start;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function buildCalendarDays(month: Date) {
  const start = getCalendarStart(month);
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function sortPlannerEvents(a: PlannerEvent, b: PlannerEvent) {
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time) return -1;
  if (b.time) return 1;
  return a.text.localeCompare(b.text);
}

export function formatEventTime(time?: string) {
  if (!time) return "Anytime";

  const [hours = "0", minutes = "0"] = time.split(":");
  const asDate = new Date();
  asDate.setHours(Number(hours), Number(minutes), 0, 0);

  return asDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toScheduledAt(date: string, time?: string) {
  if (!time) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

export function plannerEventStartsAt(event: PlannerEvent) {
  if (event.scheduledAt) {
    return new Date(event.scheduledAt).getTime();
  }

  if (event.time) {
    return new Date(`${event.date}T${event.time}:00`).getTime();
  }

  return new Date(`${event.date}T23:59:00`).getTime();
}
