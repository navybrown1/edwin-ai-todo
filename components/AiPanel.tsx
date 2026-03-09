"use client";

import { useState } from "react";
import type { Task } from "@/types";

interface AiPanelProps {
  tasks: Task[];
}

export default function AiPanel({ tasks }: AiPanelProps) {
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
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      setBriefing(data.briefing || data.error || "Could not generate briefing.");
    } catch {
      setBriefing("Failed to connect to AI. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  function renderBriefing(text: string) {
    return text
      .split("\n")
      .map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1
            ? <strong key={j} className="text-accent font-semibold">{part}</strong>
            : part
        );
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <li key={i} className="ml-4 mb-1 text-sm font-dm leading-relaxed text-textPrimary/80">
              {parts.slice(1)}
            </li>
          );
        }
        if (!line.trim()) return <br key={i} />;
        return (
          <p key={i} className="mb-2 text-sm font-dm leading-relaxed text-textPrimary/80">
            {parts}
          </p>
        );
      });
  }

  return (
    <div className="mt-8 animate-fadeUp" style={{ animationDelay: "0.3s" }}>
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted/60 font-dm">AI Assistant</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Panel top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2.5">
            <div
              className="ai-orb w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(240,192,64,0.10)", border: "1px solid rgba(240,192,64,0.22)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path className="logo-star" d="M12 2L14.09 9.26L21.41 11.27L14.09 13.28L12 20.54L9.91 13.28L2.59 11.27L9.91 9.26L12 2Z" fill="#f0c040" />
              </svg>
            </div>
            <span className="text-xs font-syne font-bold tracking-[0.1em] uppercase text-muted/80">
              Daily Brief
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-muted/50 font-dm">Gemini 2.5 Flash-Lite</span>
            <button
              onClick={generateBriefing}
              disabled={loading}
              className="sparkle-hover bg-accent text-bg text-xs font-syne font-bold px-3.5 py-1.5 rounded-lg
                transition-all duration-200 hover:bg-[#f5d060] hover:-translate-y-px hover:shadow-glowSm
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Thinking…" : "Generate"}
            </button>
          </div>
        </div>

        {/* Briefing content */}
        {open && (
          <div className="px-5 py-4">
            {loading ? (
              <div className="space-y-2.5">
                {[72, 55, 88, 48, 65].map((w, i) => (
                  <div
                    key={i}
                    className="h-2.5 rounded-full ai-shimmer"
                    style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
                <p className="text-[11px] text-muted/50 font-dm mt-3">Analyzing your tasks…</p>
              </div>
            ) : briefing ? (
              <div className="ai-prose">
                {renderBriefing(briefing)}
              </div>
            ) : null}
          </div>
        )}

        {!open && (
          <div className="px-5 py-5 text-center">
            <p className="text-sm text-muted/60 font-dm leading-relaxed">
              Click <strong className="text-accent font-semibold">Generate</strong> for a personalized daily action plan powered by AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
