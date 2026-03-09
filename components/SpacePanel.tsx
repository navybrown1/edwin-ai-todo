"use client";

import { GEMINI_MODELS, THEME_OPTIONS } from "@/lib/ai-config";
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
  if (saveState === "saving") return "Saving...";
  if (saveState === "saved") return "Saved";
  if (saveState === "error") return "Save failed";
  return "Private link ready";
}

export default function SpacePanel({
  spaceKey,
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
  return (
    <section className="glass rounded-[28px] p-5 sm:p-6 mb-8 animate-fadeUp">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-7">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent/75 font-dm mb-2">Personal Space</p>
              <h2 className="font-syne text-[1.5rem] leading-none text-textPrimary">Your private to-do list</h2>
            </div>
            <div className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] text-muted font-dm">
              {getSaveLabel(saveState)}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted font-dm">List title</span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Nova Space"
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-textPrimary outline-none transition-all duration-200 focus:border-accent/55 focus:shadow-glowSm"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.14em] text-muted font-dm">
              Memory note
            </span>
            <textarea
              value={memory}
              onChange={(event) => onMemoryChange(event.target.value)}
              placeholder="Add context the AI should remember: deadlines, tone, priorities, or anything personal."
              rows={5}
              className="w-full resize-none rounded-[22px] border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-textPrimary outline-none transition-all duration-200 focus:border-accent/55 focus:shadow-glowSm"
            />
          </label>

          <div className="rounded-2xl border border-border bg-surface2/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted font-dm">Recovery Link</p>
                <p className="mt-1 text-sm text-textPrimary/80 font-dm">
                  This personal list lives under <span className="text-accent">#{spaceKey.slice(-8)}</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onCopyLink}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-syne font-bold text-bg transition-all duration-200 hover:-translate-y-px hover:shadow-glow"
                >
                  Copy My Link
                </button>
                <button
                  onClick={onStartFresh}
                  className="glass-subtle rounded-xl px-4 py-2 text-sm font-dm text-textPrimary transition-all duration-200 hover:-translate-y-px hover:border-accent/35 hover:text-accent"
                >
                  Start Fresh List
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted font-dm">Visual Mode</p>
            <div className="grid grid-cols-2 gap-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                    themeMode === theme.id
                      ? "border-accent bg-surface shadow-glowSm"
                      : "border-border bg-surface2/65 hover:-translate-y-px hover:border-accent/35"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="block h-4 w-4 rounded-full border border-white/10"
                      style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.background})` }}
                    />
                    <span className="font-syne text-sm font-bold text-textPrimary">{theme.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted font-dm">
                    {theme.id === "dark" && "Cinematic gold and deep midnight glass."}
                    {theme.id === "light" && "Warm paper tones with editorial contrast."}
                    {theme.id === "girl" && "Candy neon, glossy pinks, and soft drama."}
                    {theme.id === "fun" && "Teal energy with playful citrus highlights."}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-muted font-dm">Primary AI Model</p>
            <div className="space-y-3">
              {GEMINI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => onPrimaryModelChange(model.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                    primaryModel === model.id
                      ? "border-accent bg-surface shadow-glowSm"
                      : "border-border bg-surface2/65 hover:-translate-y-px hover:border-accent/35"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-syne text-sm font-bold text-textPrimary">{model.label}</div>
                      <div className="text-xs text-muted font-dm">{model.contextWindow} context window</div>
                    </div>
                    <div className="rounded-full bg-bg/60 px-2.5 py-1 text-[10px] tracking-[0.12em] text-accent font-dm uppercase">
                      {model.id === primaryModel ? "Selected" : "Available"}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted font-dm">
                    <span>RPM {model.rpm}</span>
                    <span>RPD {model.rpd}</span>
                    <span>TPM {model.tpm.toLocaleString()}</span>
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
