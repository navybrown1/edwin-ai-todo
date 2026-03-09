"use client";

import { useEffect, useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export default function ActivityHub() {
  const [now, setNow] = useState(() => new Date());
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

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

  const goToMonth = (direction: -1 | 1) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const jumpToToday = () => {
    const next = startOfDay(new Date());
    setMonthCursor(next);
    setSelectedDate(next);
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
              className="activity-hub-control"
            >
              <Chevron direction="left" />
            </button>
            <button
              onClick={jumpToToday}
              aria-label="Today"
              className="activity-hub-control"
            >
              <TodayIcon />
            </button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="activity-hub-control"
            >
              <Chevron direction="right" />
            </button>
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

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    if (!inMonth) {
                      setMonthCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                    }
                  }}
                  className={`calendar-day ${isSelected ? "calendar-day-selected" : ""} ${isToday ? "calendar-day-today" : ""} ${
                    inMonth ? "calendar-day-current" : "calendar-day-faded"
                  }`}
                  aria-label={day.toDateString()}
                >
                  <span>{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[selectedLabel, now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })].map((item) => (
              <div key={item} className="calendar-chip">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
