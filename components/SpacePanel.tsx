"use client";

import ActivityHub from "@/components/ActivityHub";
import { APP_NAME, GEMINI_MODELS, THEME_OPTIONS } from "@/lib/ai-config";
import type { ReactNode } from "react";
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
  const activeModel = GEMINI_MODELS.find((model) => model.id === primaryModel) ?? GEMINI_MODELS[0];

  return (
    <section className="glass rounded-[32px] p-5 sm:p-6 animate-fadeUp">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-border bg-surface/75 p-5 shadow-card">
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
                <h2 className="truncate font-syne text-[clamp(1.9rem,4vw,2.7rem)] leading-[0.94] text-textPrimary">
                  {title.trim() || APP_NAME}
                </h2>
              </div>

              <div className="rounded-full border border-accent/20 bg-surface2/75 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-accent">
                {getSaveLabel(saveState)}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block">
                <span className="sr-only">Board name</span>
                <input
                  value={title}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder="Name this board"
                  className="w-full rounded-[22px] border border-border bg-[rgba(var(--bg-rgb),0.26)] px-4 py-3.5 text-sm text-textPrimary outline-none transition-all duration-200 placeholder:text-muted/65 focus:border-accent/55 focus:shadow-glowSm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
                />
              </label>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                <button
                  onClick={onCopyLink}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-accent px-4 py-3 text-sm font-syne font-bold text-bg transition-all duration-200 hover:-translate-y-px hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
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
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-border bg-surface2/65 px-4 py-3 text-sm font-dm text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
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

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-[28px] border border-border bg-surface/75 p-5 shadow-card">
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
                rows={7}
                className="w-full resize-none rounded-[24px] border border-border bg-[rgba(var(--bg-rgb),0.26)] px-4 py-3.5 text-sm leading-relaxed text-textPrimary outline-none transition-all duration-200 placeholder:text-muted/65 focus:border-accent/55 focus:shadow-glowSm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
              />
            </div>

            <div className="rounded-[28px] border border-border bg-surface/75 p-5 shadow-card">
              <LabelRow
                label="Modes"
                icon={
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="10" cy="10" r="2.2" fill="currentColor" />
                  </svg>
                }
              />
              <div className="grid grid-cols-2 gap-2.5">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onThemeChange(theme.id)}
                    className={`rounded-[20px] border px-4 py-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
                      themeMode === theme.id
                        ? "border-accent bg-surface text-textPrimary shadow-glowSm"
                        : "border-border bg-surface2/65 text-muted hover:-translate-y-0.5 hover:border-accent/35 hover:text-textPrimary"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]"
                        style={{ backgroundColor: theme.accent }}
                        aria-hidden="true"
                      />
                      <p className="font-syne text-[0.96rem] font-bold">{theme.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <ActivityHub />

          <div className="rounded-[28px] border border-border bg-surface/75 p-5 shadow-card">
            <LabelRow
              label="Thinking"
              icon={
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 3.5C6.96 3.5 4.5 5.83 4.5 8.7C4.5 10.8 5.79 12.61 7.66 13.45V16.5L10 14.98L12.34 16.5V13.45C14.21 12.61 15.5 10.8 15.5 8.7C15.5 5.83 13.04 3.5 10 3.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            />

            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-accent/20 bg-surface2/70 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-accent">
                {activeTheme.label}
              </span>
              <span className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
                {activeModel.label}
              </span>
            </div>

            <div className="space-y-2.5">
              {GEMINI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onPrimaryModelChange(model.id)}
                  className={`w-full rounded-[20px] border px-4 py-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
                    primaryModel === model.id
                      ? "border-accent bg-surface shadow-glowSm"
                      : "border-border bg-surface2/65 hover:-translate-y-0.5 hover:border-accent/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="model-chip">
                        <span className="model-chip-dot" />
                      </div>
                      <div className="font-syne text-[1rem] font-bold text-textPrimary">{model.label}</div>
                    </div>
                    {model.id === primaryModel ? (
                      <div className="rounded-full bg-bg/60 px-2.5 py-1 text-[10px] font-dm uppercase tracking-[0.12em] text-accent">
                        Active
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
