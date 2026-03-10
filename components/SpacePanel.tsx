"use client";

import { APP_NAME, getThemeOption, THEME_OPTIONS } from "@/lib/ai-config";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeMode } from "@/types";

type SaveState = "idle" | "saving" | "saved" | "error" | "local";

interface SpacePanelProps {
  spaceKey: string;
  title: string;
  memory: string;
  remainingTasks: number;
  themeMode: ThemeMode;
  saveState: SaveState;
  onTitleChange: (value: string) => void;
  onMemoryChange: (value: string) => void;
  onThemeChange: (value: ThemeMode) => void;
  onCopyLink: () => void;
  onStartFresh: () => void;
}

function getSaveLabel(saveState: SaveState) {
  if (saveState === "saving") return "Syncing";
  if (saveState === "saved") return "Saved";
  if (saveState === "local") return "Local";
  if (saveState === "error") return "Retrying";
  return "Ready";
}

function SectionMark({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface2/80 text-accent">
      {children}
    </span>
  );
}

function LabelRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-[11px] font-dm uppercase tracking-[0.16em] text-muted">
      <SectionMark>{icon}</SectionMark>
      <span>{label}</span>
    </div>
  );
}

function JediMiniSvg() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="#f0c040" opacity="0.06" />
      <circle cx="22" cy="22" r="12" fill="#f0c040" opacity="0.08" />
      <rect x="21" y="8" width="2" height="16" rx="1" fill="#f0c040" opacity="0.6" />
      <rect x="20" y="24" width="4" height="6" rx="1.5" fill="#666" opacity="0.4" />
      <circle cx="10" cy="10" r="1" fill="#f0c040" opacity="0.5" />
      <circle cx="35" cy="8" r="0.8" fill="#f0c040" opacity="0.4" />
      <circle cx="8" cy="32" r="0.7" fill="#06b6d4" opacity="0.3" />
      <circle cx="36" cy="34" r="0.9" fill="#8b5cf6" opacity="0.3" />
    </svg>
  );
}

function ChillMiniSvg() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="16" r="7" fill="#c76c00" opacity="0.15" />
      <circle cx="22" cy="16" r="4" fill="#f59e0b" opacity="0.25" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line
          key={angle}
          x1={22 + 8 * Math.cos((angle * Math.PI) / 180)}
          y1={16 + 8 * Math.sin((angle * Math.PI) / 180)}
          x2={22 + 12 * Math.cos((angle * Math.PI) / 180)}
          y2={16 + 12 * Math.sin((angle * Math.PI) / 180)}
          stroke="#c76c00"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.2"
        />
      ))}
      <ellipse cx="14" cy="28" rx="8" ry="3.5" fill="#c76c00" opacity="0.12" />
      <ellipse cx="10" cy="27" rx="5" ry="3" fill="#c76c00" opacity="0.1" />
      <path d="M0 38C10 30 22 32 34 35C38 36 42 37 44 38V44H0Z" fill="#c76c00" opacity="0.06" />
    </svg>
  );
}

function BubblegumMiniSvg() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="6" stroke="#ff5ea8" strokeWidth="0.8" opacity="0.3" fill="none" />
      <circle cx="32" cy="20" r="8" stroke="#ff5ea8" strokeWidth="0.7" opacity="0.2" fill="none" />
      <circle cx="18" cy="32" r="5" stroke="#9333ea" strokeWidth="0.7" opacity="0.2" fill="none" />
      <path d="M30 10L31 7L32 10L35 11L32 12L31 15L30 12L27 11Z" fill="#ff5ea8" opacity="0.4" />
      <path d="M10 30C10 30 7 27 7 25C7 23.5 8.5 22.5 10 23.5C11.5 22.5 13 23.5 13 25C13 27 10 30 10 30Z" fill="#ff5ea8" opacity="0.2" />
    </svg>
  );
}

function PartyMiniSvg() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx="22" cy="18" r="8" fill="#14b8a6" fillOpacity="0.08" stroke="#14b8a6" strokeWidth="0.6" strokeOpacity="0.2" />
      <line x1="22" y1="10" x2="22" y2="4" stroke="#14b8a6" strokeWidth="0.5" opacity="0.2" />
      <rect x="8" y="12" width="4" height="2" rx="0.8" fill="#14b8a6" opacity="0.35" transform="rotate(20 8 12)" />
      <rect x="34" y="8" width="3.5" height="2" rx="0.8" fill="#f97316" opacity="0.3" transform="rotate(-25 34 8)" />
      <rect x="12" y="34" width="4" height="2" rx="0.8" fill="#0ea5e9" opacity="0.3" transform="rotate(35 12 34)" />
      <rect x="32" y="32" width="3" height="2" rx="0.8" fill="#14b8a6" opacity="0.25" transform="rotate(-10 32 32)" />
      <circle cx="8" cy="28" r="2" fill="#14b8a6" opacity="0.25" />
      <line x1="10" y1="28" x2="10" y2="22" stroke="#14b8a6" strokeWidth="0.8" opacity="0.25" />
      <polyline points="28 34 31 30 34 34 37 30" stroke="#14b8a6" strokeWidth="0.8" fill="none" opacity="0.2" />
    </svg>
  );
}

const MODE_MINI_SVGS: Record<ThemeMode, () => JSX.Element> = {
  dark: JediMiniSvg,
  light: ChillMiniSvg,
  girl: BubblegumMiniSvg,
  fun: PartyMiniSvg,
};

export default function SpacePanel({
  title,
  memory,
  remainingTasks,
  themeMode,
  saveState,
  onTitleChange,
  onMemoryChange,
  onThemeChange,
  onCopyLink,
  onStartFresh,
}: SpacePanelProps) {
  const activeTheme = getThemeOption(themeMode);

  return (
    <section className="space-y-5 animate-fadeUp">
      <div className="glass rounded-[32px] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <LabelRow
              label="Board"
              icon={
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="3.5" y="4" width="13" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M7 11.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
            />
            <h2
              className="font-syne text-[clamp(2rem,4.3vw,3rem)] leading-[1.02] text-balance"
              style={{
                backgroundImage: activeTheme.gradient,
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "titleShimmer 5s linear infinite",
              }}
            >
              {title.trim() || APP_NAME}
            </h2>
            <p className="mt-3 max-w-[35rem] text-sm font-dm leading-relaxed text-muted/82">{activeTheme.plannerHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-accent/20 bg-surface2/75 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-accent">
              {activeTheme.label}
            </div>
            <div className="rounded-full border border-border bg-surface2/75 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
              {remainingTasks} open
            </div>
            <div className="rounded-full border border-border bg-surface2/75 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
              {getSaveLabel(saveState)}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <label className="block">
            <span className="sr-only">Board name</span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Name this board"
              className="w-full rounded-[22px] border border-border bg-bg/25 px-4 py-3.5 text-sm text-textPrimary outline-none transition-all duration-200 placeholder:text-muted/65 focus:border-accent/55 focus:shadow-glowSm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            />
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            <button
              onClick={onCopyLink}
              className="primary-action inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-syne font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M8 12L12 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path
                  d="M7 6.5H5.75C4.23 6.5 3 7.73 3 9.25V14.25C3 15.77 4.23 17 5.75 17H10.75C12.27 17 13.5 15.77 13.5 14.25V13"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 3H17V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copy Link
            </button>

            <button
              onClick={onStartFresh}
              className="secondary-action inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-3 text-sm font-dm text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 4V16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M4 10H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              New Board
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="glass rounded-[32px] p-5 sm:p-6 shadow-card">
          <LabelRow
            label="Memory"
            icon={
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M6 4.5H14C15.38 4.5 16.5 5.62 16.5 7V14.5L13.5 12L10.5 14.5L7.5 12L4.5 14.5V7C4.5 5.62 5.62 4.5 7 4.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />
          <textarea
            value={memory}
            onChange={(event) => onMemoryChange(event.target.value)}
            placeholder="Drop in anything worth keeping in view."
            rows={10}
            className="w-full resize-none rounded-[24px] border border-border bg-bg/25 px-4 py-4 text-sm leading-relaxed text-textPrimary outline-none transition-all duration-200 placeholder:text-muted/65 focus:border-accent/55 focus:shadow-glowSm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          />
        </div>

        <div className="glass rounded-[32px] p-5 sm:p-6 shadow-card">
          <LabelRow
            label="Modes"
            icon={
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="2.2" fill="currentColor" />
              </svg>
            }
          />
          <div className="grid grid-cols-1 gap-2.5">
            {THEME_OPTIONS.map((theme) => {
              const MiniSvg = MODE_MINI_SVGS[theme.id];
              const isActive = themeMode === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`mode-card group relative overflow-hidden rounded-[20px] border p-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
                    isActive
                      ? "border-[color:var(--theme-accent)] shadow-glowSm"
                      : "border-border bg-surface2/65 text-muted hover:-translate-y-0.5 hover:border-accent/35 hover:text-textPrimary"
                  }`}
                  style={
                    {
                      "--theme-accent": theme.accent,
                      background: isActive ? `linear-gradient(135deg, ${theme.accent}18, ${theme.accent}08)` : undefined,
                      borderColor: isActive ? `${theme.accent}55` : undefined,
                    } as CSSProperties
                  }
                >
                  <div className="mode-card-glow" />
                  {isActive ? (
                    <div
                      className="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 rounded-full blur-2xl"
                      style={{ background: `${theme.accent}18` }}
                    />
                  ) : null}

                  <div className="relative z-10 flex items-center gap-3">
                    <div className="mode-card-figure">
                      <MiniSvg />
                    </div>
                    <div className="min-w-0">
                      <p className="font-syne text-[0.92rem] font-bold leading-none" style={isActive ? { color: theme.accent } : undefined}>
                        {theme.label}
                      </p>
                      <p className="mt-1 text-[9px] font-dm uppercase tracking-[0.12em] text-muted/70">{theme.vibe}</p>
                      <p className="mt-2 text-[11px] font-dm leading-relaxed text-muted/78">{theme.tagline}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
