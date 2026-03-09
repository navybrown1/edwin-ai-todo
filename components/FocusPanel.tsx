"use client";

import { useMemo } from "react";
import { usePomodoro, type PomodoroMode } from "@/hooks/usePomodoro";

interface FocusPanelProps {
  spaceKey: string;
}

const MODE_LABELS: Record<PomodoroMode, string> = {
  focus: "Focus",
  break: "Break",
  long: "Long",
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FocusPanel({ spaceKey }: FocusPanelProps) {
  const {
    completedFocusRounds,
    isRunning,
    mode,
    phrase,
    remainingSeconds,
    reset,
    setMode,
    skip,
    toggleRunning,
    totalSeconds,
  } = usePomodoro(spaceKey);

  const progress = useMemo(() => {
    if (!totalSeconds) return 0;
    return (totalSeconds - remainingSeconds) / totalSeconds;
  }, [remainingSeconds, totalSeconds]);

  const circumference = 2 * Math.PI * 84;
  const dashOffset = circumference - progress * circumference;

  return (
    <section className="glass rounded-[28px] p-5 sm:p-6 mb-8 animate-fadeUp">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex justify-center">
          <div className="relative h-[220px] w-[220px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220" fill="none" aria-hidden="true">
              <circle cx="110" cy="110" r="84" stroke="rgba(var(--border-rgb),0.9)" strokeWidth="12" />
              <circle
                cx="110"
                cy="110"
                r="84"
                stroke="rgb(var(--accent-rgb))"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.45s ease" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] uppercase tracking-[0.22em] text-accent/75 font-dm">{MODE_LABELS[mode]}</span>
              <span className="mt-3 font-syne text-[3.1rem] font-extrabold leading-none text-textPrimary">{formatTime(remainingSeconds)}</span>
              <div className="mt-4 flex gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full border border-accent/30 ${
                      index < completedFocusRounds % 4 ? "bg-accent shadow-glowSm" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MODE_LABELS) as PomodoroMode[]).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                className={`rounded-full px-4 py-2 text-xs font-dm tracking-[0.14em] uppercase transition-all duration-200 ${
                  mode === option
                    ? "bg-accent text-bg shadow-glowSm"
                    : "glass-subtle text-muted hover:text-textPrimary hover:border-accent/35"
                }`}
              >
                {MODE_LABELS[option]}
              </button>
            ))}
          </div>

          <div className="glass-subtle rounded-[24px] px-5 py-5">
            <p className="font-syne text-[1.35rem] leading-snug text-textPrimary">{phrase}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={toggleRunning}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
              className="rounded-2xl bg-accent px-5 py-3 text-bg transition-all duration-200 hover:-translate-y-px hover:shadow-glow"
            >
              <span className="font-syne text-lg font-bold">{isRunning ? "II" : ">"}</span>
            </button>
            <button
              onClick={reset}
              aria-label="Reset timer"
              className="glass-subtle rounded-2xl px-4 py-3 text-sm font-syne text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35"
            >
              ↺
            </button>
            <button
              onClick={skip}
              aria-label="Skip timer"
              className="glass-subtle rounded-2xl px-4 py-3 text-sm font-syne text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35"
            >
              »
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
