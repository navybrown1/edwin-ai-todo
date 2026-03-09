"use client";

import { getThemeOption } from "@/lib/ai-config";
import { createLocalPlannerEvent, loadLocalPlannerEvents, saveLocalPlannerEvents } from "@/lib/local-store";
import type { PlannerEvent, ThemeMode } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarEvent = PlannerEvent;

const EVENT_COLORS = [
  "#f0c040",
  "#14b8a6",
  "#ff5ea8",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
  "#10b981",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCalendarStart(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayIndex = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - dayIndex);
  return start;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarDays(month: Date) {
  const start = getCalendarStart(month);
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function sortEvents(a: CalendarEvent, b: CalendarEvent) {
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time) return -1;
  if (b.time) return 1;
  return a.text.localeCompare(b.text);
}

function formatEventTime(time?: string) {
  if (!time) return "Anytime";

  const [hours = "0", minutes = "0"] = time.split(":");
  const asDate = new Date();
  asDate.setHours(Number(hours), Number(minutes), 0, 0);

  return asDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toScheduledAt(date: string, time?: string) {
  if (!time) return null;

  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M9.75 3.5L5.25 8L9.75 12.5" : "M6.25 3.5L10.75 8L6.25 12.5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TodayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.2" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 7H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 3H10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4.5 3V2.2C4.5 1.76 4.86 1.4 5.3 1.4H6.7C7.14 1.4 7.5 1.76 7.5 2.2V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3 3L3.5 10.2C3.53 10.64 3.9 11 4.35 11H7.65C8.1 11 8.47 10.64 8.5 10.2L9 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M7.25 2.25L9.75 4.75M2 10H4.1C4.39 10 4.66 9.88 4.86 9.68L9.17 5.37C9.56 4.98 9.56 4.35 9.17 3.96L8.04 2.83C7.65 2.44 7.02 2.44 6.63 2.83L2.32 7.14C2.12 7.34 2 7.61 2 7.9V10Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ActivityHubProps {
  spaceKey: string;
  themeMode: ThemeMode;
  remainingTasks: number;
}

export default function ActivityHub({ spaceKey, themeMode, remainingTasks }: ActivityHubProps) {
  const activeTheme = getThemeOption(themeMode);
  const [now, setNow] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventText, setNewEventText] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[0]);
  const palette = useMemo(
    () => [activeTheme.accent, ...EVENT_COLORS.filter((color) => color.toLowerCase() !== activeTheme.accent.toLowerCase())],
    [activeTheme.accent],
  );

  const loadEvents = useCallback(async () => {
    if (!spaceKey) return;

    setEvents(loadLocalPlannerEvents(spaceKey).sort(sortEvents));
  }, [spaceKey]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadEvents();
    };

    window.addEventListener("planner-events-refresh", handleRefresh);
    return () => window.removeEventListener("planner-events-refresh", handleRefresh);
  }, [loadEvents]);

  useEffect(() => {
    if (!showForm && !editingEventId) {
      setNewEventColor(palette[0]);
    }
  }, [editingEventId, palette, showForm]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const today = useMemo(() => startOfDay(now), [now]);
  const monthLabel = useMemo(
    () => monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [monthCursor],
  );
  const selectedLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [selectedDate],
  );
  const days = useMemo(() => buildCalendarDays(monthCursor), [monthCursor]);
  const selectedIsToday = isSameDay(selectedDate, today);
  const selectedDateKey = toDateKey(selectedDate);
  const todayKey = toDateKey(today);
  const eventsByDate = useMemo(() => {
    const nextMap = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const bucket = nextMap.get(event.date) ?? [];
      bucket.push(event);
      nextMap.set(event.date, bucket);
    }
    for (const bucket of nextMap.values()) {
      bucket.sort(sortEvents);
    }
    return nextMap;
  }, [events]);

  const eventsForDate = eventsByDate.get(selectedDateKey) ?? [];
  const todayEvents = eventsByDate.get(todayKey) ?? [];
  const upcomingEvent = eventsForDate.find((event) => event.time) ?? eventsForDate[0];
  const selectedPlanCopy = useMemo(() => {
    if (eventsForDate.length > 0) {
      const planCountCopy = `${eventsForDate.length} ${eventsForDate.length === 1 ? "plan is" : "plans are"} locked for ${
        selectedIsToday ? "today" : "this day"
      }.`;
      const upcomingCopy = upcomingEvent ? ` Next up: ${formatEventTime(upcomingEvent.time)}.` : "";
      const taskCopy =
        remainingTasks > 0
          ? ` ${remainingTasks} ${remainingTasks === 1 ? "task is" : "tasks are"} still open on the board.`
          : " The board is clear.";
      return `${planCountCopy}${upcomingCopy}${taskCopy}`;
    }

    if (remainingTasks > 0) {
      return `No time is blocked yet. Protect space for ${Math.min(remainingTasks, 3)} ${
        remainingTasks === 1 ? "board priority" : "board priorities"
      } before the day fills up.`;
    }

    return activeTheme.plannerHint;
  }, [activeTheme.plannerHint, eventsForDate.length, remainingTasks, selectedIsToday, upcomingEvent]);

  const goToMonth = (direction: -1 | 1) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const jumpToToday = () => {
    const next = startOfDay(new Date());
    setMonthCursor(next);
    setSelectedDate(next);
  };

  const resetComposer = useCallback(() => {
    setShowForm(false);
    setEditingEventId(null);
    setNewEventText("");
    setNewEventTime("");
    setNewEventColor(palette[0]);
  }, [palette]);

  const openComposer = useCallback(() => {
    setShowForm(true);
    setEditingEventId(null);
    setNewEventText("");
    setNewEventTime("");
    setNewEventColor(palette[0]);
  }, [palette]);

  const startEditing = (event: CalendarEvent) => {
    setShowForm(true);
    setEditingEventId(event.id);
    setNewEventText(event.text);
    setNewEventTime(event.time ?? "");
    setNewEventColor(event.color);
  };

  const submitEvent = async () => {
    if (!newEventText.trim()) return;

    if (editingEventId) {
      const nextEvents = events
        .map((event) =>
          event.id === editingEventId
            ? {
                ...event,
                color: newEventColor,
                date: selectedDateKey,
                scheduledAt: toScheduledAt(selectedDateKey, newEventTime || undefined),
                text: newEventText.trim(),
                time: newEventTime || undefined,
                updated_at: new Date().toISOString(),
              }
            : event,
        )
        .sort(sortEvents);

      saveLocalPlannerEvents(spaceKey, nextEvents);
      setEvents(nextEvents);
      resetComposer();
      return;
    }

    const nextEvent = createLocalPlannerEvent(spaceKey, {
      color: newEventColor,
      date: selectedDateKey,
      scheduledAt: toScheduledAt(selectedDateKey, newEventTime || undefined),
      text: newEventText.trim(),
      time: newEventTime || undefined,
    });
    const nextEvents = [...events, nextEvent].sort(sortEvents);
    saveLocalPlannerEvents(spaceKey, nextEvents);
    setEvents(nextEvents);
    resetComposer();
  };

  const deleteEvent = async (id: string) => {
    const nextEvents = events.filter((event) => event.id !== id);
    saveLocalPlannerEvents(spaceKey, nextEvents);
    setEvents(nextEvents);
  };

  return (
    <div className="activity-hub glass-subtle relative overflow-hidden rounded-[28px] p-4 sm:p-5">
      <div className="activity-hub-noise" aria-hidden="true" />
      <div className="activity-hub-orbit activity-hub-orbit-a" aria-hidden="true" />
      <div className="activity-hub-orbit activity-hub-orbit-b" aria-hidden="true" />
      <div className="activity-hub-spark activity-hub-spark-a" aria-hidden="true" />
      <div className="activity-hub-spark activity-hub-spark-b" aria-hidden="true" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-syne text-[1.45rem] font-bold text-textPrimary">{monthLabel}</h3>
            {selectedIsToday ? <span className="calendar-today-pill">Today</span> : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="activity-hub-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            >
              <Chevron direction="left" />
            </button>
            <button
              onClick={jumpToToday}
              aria-label="Today"
              className="activity-hub-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            >
              <TodayIcon />
            </button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="activity-hub-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            >
              <Chevron direction="right" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="planner-spotlight">
            <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-accent/78">
              {selectedIsToday ? "Today's Plan" : `${activeTheme.label} Planning`}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h4 className="font-syne text-[1.08rem] font-bold text-textPrimary">{selectedLabel}</h4>
              {eventsForDate.length > 0 ? (
                <span className="calendar-today-pill">{eventsForDate.length} locked</span>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] font-dm leading-relaxed text-muted/82">{selectedPlanCopy}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="planning-metric">
              <span>Selected</span>
              <strong>{eventsForDate.length}</strong>
            </div>
            <div className="planning-metric">
              <span>Today</span>
              <strong>{todayEvents.length}</strong>
            </div>
            <div className="planning-metric">
              <span>Open tasks</span>
              <strong>{remainingTasks}</strong>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-border/80 bg-surface/75 p-4 shadow-card">
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="text-center text-[10px] uppercase tracking-[0.14em] text-muted font-dm">
                {label}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {days.map((day) => {
              const inMonth = day.getMonth() === monthCursor.getMonth();
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDate);
              const dateKey = toDateKey(day);
              const dayEvents = eventsByDate.get(dateKey) ?? [];
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    if (!inMonth) {
                      setMonthCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                    }
                  }}
                  className={`calendar-day focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45 ${isSelected ? "calendar-day-selected" : ""} ${isToday ? "calendar-day-today" : ""} ${
                    inMonth ? "calendar-day-current" : "calendar-day-faded"
                  }`}
                  aria-label={day.toDateString()}
                >
                  <span>{day.getDate()}</span>
                  {hasEvents && (
                    <span className={`calendar-day-dots ${isToday ? "calendar-day-dots-today" : ""}`}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className="calendar-day-dot" style={{ backgroundColor: event.color }} />
                      ))}
                      {dayEvents.length > 3 ? <span className="calendar-day-dot-more">+</span> : null}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date info & events */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="calendar-chip flex-1">{selectedLabel}</div>
              <div className="calendar-chip">
                {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </div>
            </div>

            {/* Events list */}
            {eventsForDate.length > 0 && (
              <div className="mt-3 space-y-2">
                {eventsForDate.map((event) => (
                  <div
                    key={event.id}
                    className="event-card group/event"
                  >
                    <span
                      className="h-[8px] w-[8px] flex-shrink-0 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: event.color, color: event.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-dm text-muted">
                        <ClockIcon />
                        <span>{formatEventTime(event.time)}</span>
                      </div>
                      <p className="mt-1 break-words text-[12px] font-dm leading-relaxed text-textPrimary/92">{event.text}</p>
                    </div>
                    <div className="event-card-actions">
                      <button
                        onClick={() => startEditing(event)}
                        className="rounded-full p-1 text-muted transition-colors duration-150 hover:text-accent"
                        aria-label="Edit event"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="rounded-full p-1 text-muted transition-colors duration-150 hover:text-[#f87171]"
                        aria-label="Delete event"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {eventsForDate.length === 0 ? (
              <div className="mt-3 rounded-[16px] border border-dashed border-border/70 bg-surface2/18 px-3.5 py-3">
                <p className="text-[12px] font-dm text-textPrimary/88">
                  {selectedIsToday ? "Nothing is protected on today's calendar yet." : "This day is still wide open."}
                </p>
                <p className="mt-1 text-[11px] font-dm leading-relaxed text-muted/78">{activeTheme.plannerHint}</p>
              </div>
            ) : null}

            {/* Add event form */}
            {showForm ? (
              <div className="mt-3 rounded-[18px] border border-accent/25 bg-accent/10 p-3.5 space-y-3 animate-fadeUp">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-accent/82">
                      {editingEventId ? "Edit plan" : "Plan the day"}
                    </p>
                    <p className="mt-1 text-[12px] font-dm text-muted/80">{selectedLabel}</p>
                  </div>
                </div>
                <input
                  value={newEventText}
                  onChange={(e) => setNewEventText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEvent()}
                  placeholder="What's happening?"
                  autoFocus
                  className="w-full bg-surface border border-border rounded-[12px] px-3 py-2 text-[12px] text-textPrimary font-dm outline-none placeholder:text-muted/55 focus:border-accent/50 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="bg-surface border border-border rounded-[10px] px-2 py-1.5 text-[11px] text-textPrimary font-dm outline-none focus:border-accent/50 transition-colors"
                  />
                  <div className="flex gap-1 flex-1">
                    {palette.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewEventColor(color)}
                        className={`h-4 w-4 rounded-full border border-transparent transition-all duration-150 ${
                          newEventColor === color ? "scale-110 opacity-100" : "opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: color,
                          boxShadow: newEventColor === color ? `0 0 0 2px ${color}45` : undefined,
                          borderColor: newEventColor === color ? color : "transparent",
                        }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={submitEvent}
                    disabled={!newEventText.trim()}
                    className="primary-action rounded-[10px] px-3 py-1.5 text-[11px] font-syne font-bold disabled:opacity-40"
                  >
                    {editingEventId ? "Save" : "Add"}
                  </button>
                  <button
                    onClick={resetComposer}
                    className="secondary-action rounded-[10px] px-3 py-1.5 text-[11px] font-dm text-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={openComposer}
                className="secondary-action mt-3 flex w-full items-center justify-center gap-1.5 rounded-[14px] border-dashed px-3 py-2 text-[11px] font-dm text-muted"
              >
                <PlusIcon />
                {eventsForDate.length > 0 ? "Add another event" : selectedIsToday ? "Plan today" : "Plan this day"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
