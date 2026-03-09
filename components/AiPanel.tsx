"use client";

import { APP_NAME } from "@/lib/ai-config";
import type { AiResponseMeta, GeminiModelId, Task } from "@/types";
import { useState } from "react";

interface AiPanelProps {
  tasks: Task[];
  memory: string;
  primaryModel: GeminiModelId;
  lastAiMeta: AiResponseMeta | null;
  onAiMeta: (meta: AiResponseMeta) => void;
}

function renderBriefing(text: string) {
  return text.split("\n").map((line, index) => {
    const parts = line
      .replace(/^[-*]\s+/, "")
      .split(/\*\*(.*?)\*\*/g)
      .map((part, partIndex) =>
        partIndex % 2 === 1 ? (
          <strong key={`${index}-${partIndex}`} className="text-accent font-semibold">
            {part}
          </strong>
        ) : (
          part
        ),
      );

    if (!line.trim()) {
      return <div key={index} className="h-2" />;
    }

    if (/^[-*]\s+/.test(line)) {
      return (
        <div key={index} className="mb-2 flex gap-2 text-sm font-dm leading-relaxed text-textPrimary/85">
          <span className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
          <span>{parts}</span>
        </div>
      );
    }

    return (
      <p key={index} className="mb-2 text-sm font-dm leading-relaxed text-textPrimary/85">
        {parts}
      </p>
    );
  });
}

export default function AiPanel({ tasks, memory, primaryModel, lastAiMeta: _lastAiMeta, onAiMeta }: AiPanelProps) {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const generateBriefing = async () => {
    try {
      setLoading(true);
      setOpen(true);
      const res = await fetch("/api/ai/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, memory, primaryModel }),
      });
      const data = await res.json();
      if (data.meta) onAiMeta(data.meta);
      setBriefing(data.briefing || data.error || "Could not generate briefing.");
    } catch {
      setBriefing("Failed to connect to AI. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 animate-fadeUp" style={{ animationDelay: "0.3s" }}>
      <div className="glass rounded-[24px] overflow-hidden">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-border/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="ai-orb w-8 h-8 rounded-xl flex items-center justify-center text-accent"
              style={{ background: "rgba(var(--accent-rgb),0.10)", border: "1px solid rgba(var(--accent-rgb),0.22)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path className="logo-star" d="M12 2L14.09 9.26L21.41 11.27L14.09 13.28L12 20.54L9.91 13.28L2.59 11.27L9.91 9.26L12 2Z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span className="block text-xs font-syne font-bold tracking-[0.1em] uppercase text-muted/90">{APP_NAME}</span>
              <span className="block text-[11px] text-muted font-dm">A clear read on what matters next.</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={generateBriefing}
              disabled={loading}
              className="sparkle-hover bg-accent text-bg text-xs font-syne font-bold px-3.5 py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-glowSm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Thinking..." : "Plan It"}
            </button>
          </div>
        </div>

        {open ? (
          <div className="px-5 py-4">
            {loading ? (
              <div className="space-y-2.5">
                {[72, 55, 88, 48, 65].map((width, index) => (
                  <div
                    key={index}
                    className="h-2.5 rounded-full ai-shimmer"
                    style={{ width: `${width}%`, animationDelay: `${index * 0.12}s` }}
                  />
                ))}
                <p className="text-[11px] text-muted/60 font-dm mt-3">Reading your board...</p>
              </div>
            ) : briefing ? (
              <div className="ai-prose">{renderBriefing(briefing)}</div>
            ) : null}
          </div>
        ) : (
          <div className="px-5 py-5 text-center">
            <p className="text-sm text-muted/75 font-dm leading-relaxed">Turn what is on the board into one clear plan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
