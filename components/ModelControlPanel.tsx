"use client";

import { GEMINI_MODELS, getThemeOption } from "@/lib/ai-config";
import type { GeminiModelId, ThemeMode } from "@/types";

interface ModelControlPanelProps {
  primaryModel: GeminiModelId;
  themeMode: ThemeMode;
  onPrimaryModelChange: (value: GeminiModelId) => void;
}

export default function ModelControlPanel({ primaryModel, themeMode, onPrimaryModelChange }: ModelControlPanelProps) {
  const activeTheme = getThemeOption(themeMode);
  const activeModel = GEMINI_MODELS.find((model) => model.id === primaryModel) ?? GEMINI_MODELS[0];

  return (
    <div className="glass rounded-[28px] p-5 shadow-card animate-fadeUp">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-accent/20 bg-surface2/70 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-accent">
          {activeTheme.label}
        </span>
        <span className="rounded-full border border-border bg-surface2/70 px-3 py-1.5 text-[11px] font-dm uppercase tracking-[0.14em] text-muted">
          {activeModel.label}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-dm uppercase tracking-[0.16em] text-muted">Thinking</p>
        <p className="mt-2 font-syne text-[1.2rem] leading-none text-textPrimary">Choose the planning engine.</p>
        <p className="mt-2 text-sm font-dm leading-relaxed text-muted/78">
          Swap between speed and depth depending on whether you want a quick read, a clean parse, or a heavier plan.
        </p>
      </div>

      <div className="space-y-2.5">
        {GEMINI_MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => onPrimaryModelChange(model.id)}
            className={`group relative w-full overflow-hidden rounded-[20px] border px-4 py-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
              primaryModel === model.id
                ? "border-accent bg-surface shadow-glowSm"
                : "border-border bg-surface2/65 hover:-translate-y-0.5 hover:border-accent/35"
            }`}
          >
            <div className="model-card-shine" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="model-chip">
                  <span className="model-chip-dot" />
                </div>
                <div className="min-w-0">
                  <div className="font-syne text-[0.98rem] font-bold text-textPrimary">{model.label}</div>
                  <div className="mt-0.5 text-[10px] font-dm leading-relaxed text-muted/70">{model.description}</div>
                </div>
              </div>
              {model.id === primaryModel ? (
                <div className="rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-dm uppercase tracking-[0.12em] text-accent">
                  Active
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
