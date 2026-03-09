"use client";

import { APP_NAME, THEME_OPTIONS } from "@/lib/ai-config";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useEffect, useState } from "react";

interface HeaderProps {
  title?: string;
}

function HeroStage({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="hero-stage glass relative overflow-hidden rounded-[30px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-accent/75 font-dm">Live Vibe Board</p>
          <h3 className="mt-2 font-syne text-[1.55rem] font-bold text-textPrimary">Shape the mood. Keep the motion.</h3>
        </div>
        <div className="rounded-full border border-accent/30 bg-surface/70 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-accent font-dm">
          SVG Driven
        </div>
      </div>

      <div className="relative z-10 mt-7 grid grid-cols-2 gap-3">
        {THEME_OPTIONS.map((theme) => (
          <div key={theme.id} className="mode-chip rounded-2xl border border-border bg-surface/65 px-3 py-2.5">
            <p className="text-sm font-syne font-bold text-textPrimary">{theme.label}</p>
            <p className="mt-1 text-[11px] text-muted font-dm">{theme.vibe}</p>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {!reducedMotion && <div className="hero-stage-glow hero-stage-glow-a" />}
        {!reducedMotion && <div className="hero-stage-glow hero-stage-glow-b" />}
        {!reducedMotion && <div className="hero-stage-glow hero-stage-glow-c" />}
        <svg className="hero-stage-svg" viewBox="0 0 420 260" fill="none">
          <circle cx="210" cy="130" r="56" stroke="rgba(var(--accent-rgb),0.45)" strokeWidth="1.5" strokeDasharray="5 7" className="hero-orbit hero-orbit-slow" />
          <circle cx="210" cy="130" r="84" stroke="rgba(var(--blob-b-rgb),0.25)" strokeWidth="1" strokeDasharray="3 9" className="hero-orbit" />
          <circle cx="210" cy="130" r="112" stroke="rgba(var(--accent2-rgb),0.2)" strokeWidth="1" strokeDasharray="6 12" className="hero-orbit hero-orbit-reverse" />
          <circle cx="210" cy="130" r="24" fill="rgba(var(--accent-rgb),0.14)" stroke="rgba(var(--accent-rgb),0.36)" strokeWidth="1.2" className="hero-core" />
          <circle cx="266" cy="130" r="8" fill="rgb(var(--accent-rgb))" className="hero-bob" />
          <circle cx="148" cy="80" r="7" fill="rgb(var(--blob-b-rgb))" className="hero-bob" style={{ animationDelay: "0.8s" }} />
          <circle cx="190" cy="218" r="9" fill="rgb(var(--accent2-rgb))" className="hero-bob" style={{ animationDelay: "1.4s" }} />
          <path d="M152 168C181 150 214 149 253 164" stroke="rgba(var(--text-rgb),0.18)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M180 54L186 66L198 72L186 78L180 90L174 78L162 72L174 66L180 54Z" fill="rgb(var(--accent-rgb))" className="hero-twinkle" />
          <path d="M286 168L290 176L298 180L290 184L286 192L282 184L274 180L282 176L286 168Z" fill="rgb(var(--accent2-rgb))" className="hero-twinkle" style={{ animationDelay: "1s" }} />
          <path d="M118 114L122 121L129 125L122 128L118 135L115 128L108 125L115 121L118 114Z" fill="rgb(var(--blob-b-rgb))" className="hero-twinkle" style={{ animationDelay: "1.8s" }} />
        </svg>
      </div>
    </div>
  );
}

export default function Header({ title = APP_NAME }: HeaderProps) {
  const [timeLabel, setTimeLabel] = useState("");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const now = new Date();
    setTimeLabel(now.toLocaleString("en-US", { month: "long", year: "numeric" }));
  }, []);

  return (
    <header className="mb-10 animate-fadeDown relative overflow-visible">
      <div className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
        <div className="relative">
          <div className="absolute -top-5 right-2 pointer-events-none select-none text-accent/80" aria-hidden>
            <svg width="130" height="80" viewBox="0 0 130 80" fill="none">
              <circle cx="110" cy="12" r="1.5" fill="currentColor" opacity="0.7">
                {!reducedMotion && <animate attributeName="opacity" values="0.7;0.15;0.7" dur="3s" repeatCount="indefinite" />}
                {!reducedMotion && <animate attributeName="r" values="1.5;2.4;1.5" dur="3s" repeatCount="indefinite" />}
              </circle>
              <circle cx="95" cy="45" r="1.8" fill="rgb(var(--accent2-rgb))" opacity="0.35">
                {!reducedMotion && (
                  <animate attributeName="opacity" values="0.35;0.8;0.35" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx="80" cy="20" r="1.1" fill="rgb(var(--blob-b-rgb))" opacity="0.5">
                {!reducedMotion && (
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" begin="2s" repeatCount="indefinite" />
                )}
              </circle>
            </svg>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="ai-orb w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-accent"
              style={{
                background: "rgba(var(--accent-rgb),0.12)",
                border: "1px solid rgba(var(--accent-rgb),0.28)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  className="logo-star"
                  d="M12 2L14.09 9.26L21.41 11.27L14.09 13.28L12 20.54L9.91 13.28L2.59 11.27L9.91 9.26L12 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-accent/70 font-dm">{timeLabel}</span>
          </div>

          <h1 className="font-syne text-[clamp(2.6rem,7vw,4.6rem)] font-extrabold leading-none tracking-tight">
            <span className="gradient-text">{title}</span>
          </h1>
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted/75 font-dm mt-3 mb-4">Mood-Driven AI Task Board</p>

          <p className="max-w-[38rem] text-[14px] font-dm text-muted/85 leading-relaxed">
            One private board, four personalities, and a cleaner way to keep your tasks, notes, and AI breakdowns in motion.
          </p>
        </div>

        <HeroStage reducedMotion={reducedMotion} />
      </div>
    </header>
  );
}
