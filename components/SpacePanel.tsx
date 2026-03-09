"use client";

import ActivityHub from "@/components/ActivityHub";
import { APP_NAME, GEMINI_MODELS, THEME_OPTIONS } from "@/lib/ai-config";
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
      <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[0.95fr_1.05fr] xl:gap-6">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-syne text-[1.75rem] leading-none text-textPrimary">{title.trim() || APP_NAME}</h2>
            </div>
            <div className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] text-muted font-dm">
              {getSaveLabel(saveState)}
            </div>
          </div>

          <label className="block">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Name this board"
              className="w-full rounded-[20px] border border-border bg-surface px-4 py-3 text-sm text-textPrimary outline-none transition-all duration-200 focus:border-accent/55 focus:shadow-glowSm"
            />
          </label>

          <label className="block">
            <textarea
              value={memory}
              onChange={(event) => onMemoryChange(event.target.value)}
              placeholder="Drop in anything worth keeping in view."
              rows={4}
              className="w-full resize-none rounded-[22px] border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-textPrimary outline-none transition-all duration-200 focus:border-accent/55 focus:shadow-glowSm"
            />
          </label>

          <div className="flex flex-wrap gap-2.5">
            <div
              className="rounded-full border border-accent/25 bg-surface2/65 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-accent font-dm"
            >
              {activeTheme.label}
            </div>
            <div
              className="rounded-full border border-border bg-surface2/65 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-muted font-dm"
            >
              {GEMINI_MODELS.find((model) => model.id === primaryModel)?.label ?? "Everyday"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
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

        <div className="space-y-5">
          <ActivityHub />

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`rounded-[18px] border px-4 py-3 text-left transition-all duration-300 ${
                    themeMode === theme.id
                      ? "border-accent bg-surface text-textPrimary shadow-glowSm"
                      : "border-border bg-surface2/65 text-muted hover:-translate-y-0.5 hover:border-accent/35 hover:text-textPrimary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                      aria-hidden="true"
                    />
                    <p className="font-syne text-base font-bold">{theme.label}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-1">
              {GEMINI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onPrimaryModelChange(model.id)}
                  className={`w-full rounded-[18px] border px-4 py-3 text-left transition-all duration-300 ${
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
                      <div className="rounded-full bg-bg/60 px-2.5 py-1 text-[10px] tracking-[0.12em] text-accent font-dm uppercase">
                        Active
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
