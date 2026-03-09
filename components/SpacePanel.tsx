"use client";

import { GEMINI_MODELS, THEME_OPTIONS } from "@/lib/ai-config";
import type { CSSProperties } from "react";
import type { GeminiModelId, ThemeMode } from "@/types";

type SaveState = "idle" | "saving" | "saved" | "error";

interface SpacePanelProps {
  spaceKey: string;
  title: string;
  memory: string;
  themeMode: ThemeMode;
  primaryModel: GeminiModelId;
  saveState: SaveState;
  onTitleChange: (value: string) => void;
  onMemoryChange: (value: string) => void;
  onThemeChange: (value: ThemeMode) => void;
  onPrimaryModelChange: (value: GeminiModelId) => void;
  onCopyLink: () => void;
  onStartFresh: () => void;
}

function getSaveLabel(saveState: SaveState) {
  if (saveState === "saving") return "Syncing";
  if (saveState === "saved") return "Saved";
  if (saveState === "error") return "Retrying";
  return "Ready";
}

function ModeIllustration({ id, large = false }: { id: ThemeMode; large?: boolean }) {
  const size = large ? 176 : 92;

  if (id === "dark") {
    return (
      <svg width={size} height={size} viewBox="0 0 176 176" fill="none" aria-hidden>
        <circle cx="88" cy="88" r="44" fill="rgba(var(--accent-rgb),0.10)" stroke="rgba(var(--accent-rgb),0.42)" strokeWidth="2" />
        <circle cx="88" cy="88" r="66" stroke="rgba(var(--accent-rgb),0.26)" strokeWidth="2" strokeDasharray="8 10" className="mode-spin-slow" />
        <circle cx="88" cy="88" r="82" stroke="rgba(var(--blob-b-rgb),0.18)" strokeWidth="1.5" strokeDasharray="6 12" className="mode-spin-reverse" />
        <rect x="84" y="26" width="8" height="76" rx="4" fill="rgba(var(--text-rgb),0.92)" className="mode-saber" />
        <rect x="80" y="98" width="16" height="24" rx="8" fill="rgba(var(--accent2-rgb),0.92)" />
        <circle cx="132" cy="88" r="10" fill="rgb(var(--accent-rgb))" className="mode-bob" />
      </svg>
    );
  }

  if (id === "light") {
    return (
      <svg width={size} height={size} viewBox="0 0 176 176" fill="none" aria-hidden>
        <circle cx="62" cy="60" r="24" fill="rgba(var(--accent-rgb),0.72)" className="mode-pulse" />
        <path d="M28 110C50 95 73 95 96 110C119 125 140 125 150 118" stroke="rgba(var(--blob-b-rgb),0.55)" strokeWidth="6" strokeLinecap="round" className="mode-wave" />
        <path d="M20 128C42 113 65 113 88 128C111 143 133 143 152 132" stroke="rgba(var(--blob-b-rgb),0.35)" strokeWidth="5" strokeLinecap="round" className="mode-wave" style={{ animationDelay: "0.6s" }} />
        <circle cx="121" cy="58" r="12" fill="rgba(var(--surface-rgb),0.92)" stroke="rgba(var(--accent2-rgb),0.36)" strokeWidth="2" />
        <circle cx="135" cy="62" r="10" fill="rgba(var(--surface-rgb),0.92)" stroke="rgba(var(--accent2-rgb),0.24)" strokeWidth="2" />
      </svg>
    );
  }

  if (id === "girl") {
    return (
      <svg width={size} height={size} viewBox="0 0 176 176" fill="none" aria-hidden>
        <circle cx="76" cy="78" r="20" fill="rgba(var(--accent-rgb),0.62)" className="mode-bubble" />
        <circle cx="112" cy="64" r="16" fill="rgba(var(--accent2-rgb),0.55)" className="mode-bubble" style={{ animationDelay: "0.5s" }} />
        <circle cx="100" cy="104" r="28" fill="rgba(var(--accent-rgb),0.18)" stroke="rgba(var(--accent-rgb),0.52)" strokeWidth="2" className="mode-bubble" style={{ animationDelay: "1s" }} />
        <path d="M68 118C68 107 76 100 88 100C100 100 108 107 108 118C108 131 96 139 88 147C80 139 68 131 68 118Z" fill="rgba(var(--accent-rgb),0.88)" className="mode-bob" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 176 176" fill="none" aria-hidden>
      <circle cx="88" cy="88" r="28" fill="rgba(var(--surface-rgb),0.92)" stroke="rgba(var(--accent-rgb),0.4)" strokeWidth="2" />
      <path d="M66 66H110V110H66V66Z" stroke="rgba(var(--accent-rgb),0.4)" strokeWidth="1.6" strokeDasharray="4 7" className="mode-spin-slow" />
      <circle cx="54" cy="52" r="8" fill="rgb(var(--accent2-rgb))" className="mode-bob" />
      <circle cx="122" cy="56" r="8" fill="rgb(var(--blob-b-rgb))" className="mode-bob" style={{ animationDelay: "0.6s" }} />
      <circle cx="118" cy="124" r="8" fill="rgb(var(--accent-rgb))" className="mode-bob" style={{ animationDelay: "1.1s" }} />
      <path d="M40 114L50 128L64 118L58 138" stroke="rgba(var(--accent2-rgb),0.92)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="mode-tilt" />
      <path d="M122 116L134 124L142 110" stroke="rgba(var(--blob-b-rgb),0.92)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="mode-tilt" style={{ animationDelay: "0.7s" }} />
    </svg>
  );
}

export default function SpacePanel({
  title,
  memory,
  themeMode,
  primaryModel,
  saveState,
  onTitleChange,
  onMemoryChange,
  onThemeChange,
  onPrimaryModelChange,
  onCopyLink,
  onStartFresh,
}: SpacePanelProps) {
  const activeTheme = THEME_OPTIONS.find((theme) => theme.id === themeMode) ?? THEME_OPTIONS[0];

  return (
    <section className="glass rounded-[30px] p-5 sm:p-6 mb-8 animate-fadeUp">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:gap-7">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent/75 font-dm mb-2">Board</p>
              <h2 className="font-syne text-[1.6rem] leading-none text-textPrimary">Above</h2>
            </div>
            <div className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] text-muted font-dm">
              {getSaveLabel(saveState)}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted font-dm">Board name</span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Above Board"
              className="w-full rounded-[22px] border border-border bg-surface px-4 py-3 text-sm text-textPrimary outline-none transition-all duration-200 focus:border-accent/55 focus:shadow-glowSm"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted font-dm">Memory note</span>
            <textarea
              value={memory}
              onChange={(event) => onMemoryChange(event.target.value)}
              placeholder="Deadlines, priorities, or anything to remember."
              rows={5}
              className="w-full resize-none rounded-[24px] border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-textPrimary outline-none transition-all duration-200 focus:border-accent/55 focus:shadow-glowSm"
            />
          </label>

          <div className="rounded-[26px] border border-border bg-surface2/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-dm">Board Link</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                onClick={onCopyLink}
                className="rounded-xl bg-accent px-4 py-2.5 text-sm font-syne font-bold text-bg transition-all duration-200 hover:-translate-y-px hover:shadow-glow"
              >
                Copy Link
              </button>
              <button
                onClick={onStartFresh}
                className="glass-subtle rounded-xl px-4 py-2.5 text-sm font-dm text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35 hover:text-accent"
              >
                New Board
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="mode-stage glass-subtle relative overflow-hidden rounded-[28px] p-5">
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-accent/75 font-dm">Mode</p>
                <h3 className="mt-2 font-syne text-[1.7rem] font-bold text-textPrimary">{activeTheme.label}</h3>
              </div>
              <div className="mode-stage-figure">
                <ModeIllustration id={themeMode} large />
              </div>
            </div>
            <div className="mode-stage-backdrop mode-stage-backdrop-a" />
            <div className="mode-stage-backdrop mode-stage-backdrop-b" />
          </div>

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted font-dm">Modes</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`mode-card group relative overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-300 ${
                    themeMode === theme.id
                      ? "border-accent bg-surface shadow-glowSm"
                      : "border-border bg-surface2/65 hover:-translate-y-1 hover:border-accent/35"
                  }`}
                >
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-syne text-lg font-bold text-textPrimary">{theme.label}</p>
                    </div>
                    <div className="mode-card-figure">
                      <ModeIllustration id={theme.id} />
                    </div>
                  </div>
                  <div className="mode-card-glow" style={{ "--theme-accent": theme.accent } as CSSProperties} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted font-dm">Thinking Style</p>
            <div className="space-y-3">
              {GEMINI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onPrimaryModelChange(model.id)}
                  className={`group relative overflow-hidden w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-300 ${
                    primaryModel === model.id
                      ? "border-accent bg-surface shadow-glowSm"
                      : "border-border bg-surface2/65 hover:-translate-y-1 hover:border-accent/35"
                  }`}
                >
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="model-chip mt-0.5">
                        <span className="model-chip-dot" />
                      </div>
                      <div>
                        <div className="font-syne text-[1.05rem] font-bold text-textPrimary">{model.label}</div>
                        <p className="mt-2 max-w-[31rem] text-sm leading-relaxed text-muted font-dm">{model.description}</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-bg/60 px-2.5 py-1 text-[10px] tracking-[0.12em] text-accent font-dm uppercase">
                      {model.id === primaryModel ? "Selected" : "Ready"}
                    </div>
                  </div>
                  <div className="model-card-shine" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
