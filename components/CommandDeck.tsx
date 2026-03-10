"use client";

import { useEffect, useMemo, useState } from "react";
import FocusPanel from "@/components/FocusPanel";
import { usePlannerEvents } from "@/hooks/usePlannerEvents";
import { formatEventTime, isSameDay, plannerEventStartsAt, startOfDay, toDateKey } from "@/lib/planner-calendar";
import { getThemeOption } from "@/lib/ai-config";
import type { ThemeMode } from "@/types";

interface CommandDeckProps {
  onOpenBoard: () => void;
  onOpenCalendar: () => void;
  remainingTasks: number;
  spaceKey: string;
  themeMode: ThemeMode;
}

function formatShortDate(date: Date, today: Date) {
  if (isSameDay(date, today)) return "Today";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function CommandDeck({ onOpenBoard, onOpenCalendar, remainingTasks, spaceKey, themeMode }: CommandDeckProps) {
  const themeMeta = getThemeOption(themeMode);
  const { events, statusMessage, syncMode } = usePlannerEvents(spaceKey);
  const [now, setNow] = useState(() => new Date());
  const today = useMemo(() => startOfDay(now), [now]);
  const todayKey = toDateKey(today);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const todayEvents = useMemo(() => events.filter((event) => event.date === todayKey), [events, todayKey]);
  const upcomingEvents = useMemo(
    () =>
      [...events]
        .sort((a, b) => plannerEventStartsAt(a) - plannerEventStartsAt(b))
        .filter((event) => plannerEventStartsAt(event) >= now.getTime())
        .slice(0, 4),
    [events, now],
  );

  const nextFiveDays = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const dateKey = toDateKey(date);
        const count = events.filter((event) => event.date === dateKey).length;
        return {
          count,
          date,
          dateKey,
        };
      }),
    [events, today],
  );

  const deckCopy =
    todayEvents.length > 0
      ? `${todayEvents.length} ${todayEvents.length === 1 ? "appointment is" : "appointments are"} already locked in for today.`
      : "No appointments are locked in yet. Use the calendar tab to block the next move before the day crowds in.";

  return (
    <section className="mb-6 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
      <FocusPanel spaceKey={spaceKey} variant="compact" />

      <div className="glass rounded-[30px] p-5 shadow-card animate-fadeUp" style={{ animationDelay: "0.08s" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[38rem]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/20 bg-surface2/70 px-3 py-1 text-[11px] font-dm uppercase tracking-[0.16em] text-accent">
                Command Deck
              </span>
              <span className="rounded-full border border-border bg-surface2/70 px-3 py-1 text-[11px] font-dm uppercase tracking-[0.16em] text-muted">
                {syncMode === "cloud" ? "Cloud sync" : "Local backup"}
              </span>
            </div>
            <h2 className="mt-3 font-syne text-[1.8rem] leading-[1.02] text-textPrimary">Calendar and focus stay in view now.</h2>
            <p className="mt-2 max-w-[34rem] text-sm font-dm leading-relaxed text-muted/80">
              {deckCopy} {remainingTasks > 0 ? `${remainingTasks} board ${remainingTasks === 1 ? "task is" : "tasks are"} still open.` : "The task board is clear."}
            </p>
            {statusMessage ? <p className="mt-2 text-[11px] font-dm text-accent/82">{statusMessage}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCalendar}
              className="primary-action inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-syne font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            >
              Open Calendar
            </button>
            <button
              onClick={onOpenBoard}
              className="secondary-action inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-dm text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
            >
              Board Studio
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-border/80 bg-surface/75 p-4">
            <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-muted">Next five days</p>
            <div className="mt-3 grid gap-2">
              {nextFiveDays.map((day) => (
                <div
                  key={day.dateKey}
                  className="flex items-center justify-between rounded-[18px] border border-border/75 bg-bg/15 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-syne text-textPrimary">{formatShortDate(day.date, today)}</p>
                    <p className="mt-1 text-[11px] font-dm text-muted/70">
                      {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                  </div>
                  <div className="rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-[11px] font-dm uppercase tracking-[0.14em] text-accent">
                    {day.count} {day.count === 1 ? "item" : "items"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-border/80 bg-surface/75 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-muted">Appointments</p>
                <h3 className="mt-2 font-syne text-[1.25rem] text-textPrimary">
                  {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
              </div>
              <div className="rounded-full border border-accent/15 bg-accent/10 px-3 py-1 text-[11px] font-dm uppercase tracking-[0.14em] text-accent">
                {themeMeta.label}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const eventDate = new Date(`${event.date}T12:00:00`);

                  return (
                    <div key={event.id} className="flex items-start gap-3 rounded-[18px] border border-border/75 bg-bg/15 px-3 py-3">
                      <span
                        className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: event.color, color: event.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-dm uppercase tracking-[0.12em] text-muted">
                          <span>{formatShortDate(eventDate, today)}</span>
                          <span>{formatEventTime(event.time)}</span>
                          <span>{event.source === "google" ? "Google" : "Manual"}</span>
                        </div>
                        <p className="mt-1 text-sm font-dm leading-relaxed text-textPrimary/90">{event.text}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[18px] border border-dashed border-border/75 bg-bg/15 px-4 py-4">
                  <p className="text-sm font-dm text-textPrimary/88">No upcoming appointments are queued yet.</p>
                  <p className="mt-1 text-[12px] font-dm leading-relaxed text-muted/72">{themeMeta.plannerHint}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
