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

function ControlIcon({ kind }: { kind: "play" | "pause" | "reset" | "skip" }) {
  if (kind === "pause") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="4" y="3.5" width="3.2" height="11" rx="1.2" fill="currentColor" />
        <rect x="10.8" y="3.5" width="3.2" height="11" rx="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "reset") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M4.5 9A4.5 4.5 0 1 0 6 5.66" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 3.75V6.8H7.55" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "skip") {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M4 4.5L9.8 9L4 13.5V4.5Z" fill="currentColor" />
        <path d="M10 4.5L15.8 9L10 13.5V4.5Z" fill="currentColor" opacity="0.72" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5.25 4.2L13.8 9L5.25 13.8V4.2Z" fill="currentColor" />
    </svg>
  );
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
    <section className="glass rounded-[30px] p-5 sm:p-6 animate-fadeUp">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-muted">Focus</p>
          <p className="mt-2 font-syne text-[1.45rem] leading-none text-textPrimary">{MODE_LABELS[mode]}</p>
        </div>
        <div className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
          Round {completedFocusRounds + 1}
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <div className="relative h-[208px] w-[208px]">
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
            <span className="font-syne text-[3rem] font-extrabold leading-none text-textPrimary">{formatTime(remainingSeconds)}</span>
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

      <div className="mt-5 grid grid-cols-3 gap-2">
        {(Object.keys(MODE_LABELS) as PomodoroMode[]).map((option) => (
          <button
            key={option}
            onClick={() => setMode(option)}
            className={`rounded-[16px] px-4 py-2.5 text-xs font-dm uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
              mode === option
                ? "bg-accent text-bg shadow-glowSm"
                : "glass-subtle text-muted hover:text-textPrimary hover:border-accent/35"
            }`}
          >
            {MODE_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="mt-4 glass-subtle rounded-[24px] px-5 py-5">
        <p className="font-syne text-[1.2rem] leading-snug text-textPrimary">{phrase}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <button
          onClick={toggleRunning}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          className="inline-flex items-center justify-center rounded-2xl bg-accent px-5 py-3 text-bg transition-all duration-200 hover:-translate-y-px hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
        >
          <ControlIcon kind={isRunning ? "pause" : "play"} />
        </button>
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="inline-flex items-center justify-center glass-subtle rounded-2xl px-4 py-3 text-sm font-syne text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
        >
          <ControlIcon kind="reset" />
        </button>
        <button
          onClick={skip}
          aria-label="Skip timer"
          className="inline-flex items-center justify-center glass-subtle rounded-2xl px-4 py-3 text-sm font-syne text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
        >
          <ControlIcon kind="skip" />
        </button>
      </div>
    </section>
  );
}
