"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { AiResponseMeta, GeminiModelId, ParsedTask } from "@/types";

interface AddTaskBarProps {
  spaceKey: string;
  primaryModel: GeminiModelId;
  onAdd: (text: string, cat: string) => void;
  onAiParse: (tasks: ParsedTask[], meta?: AiResponseMeta) => void;
  onAiMeta: (meta: AiResponseMeta) => void;
}

function getDraftStorageKey(spaceKey: string) {
  return `nova.draft.${spaceKey}`;
}

function describeMeta(meta: AiResponseMeta) {
  if (!meta.fallbackUsed) {
    return "AI split it cleanly.";
  }

  return "AI took the faster route and still split it cleanly.";
}

export default function AddTaskBar({ spaceKey, primaryModel, onAdd, onAiParse, onAiMeta }: AddTaskBarProps) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState(CATEGORIES[0].value);
  const [parsing, setParsing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [parseMeta, setParseMeta] = useState<AiResponseMeta | null>(null);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(getDraftStorageKey(spaceKey));
      if (!raw) {
        setText("");
        setCat(CATEGORIES[0].value);
        setParsedTasks(null);
        setParseMeta(null);
        return;
      }

      const parsed = JSON.parse(raw) as { text?: string; cat?: string };
      setText(parsed.text ?? "");
      setCat(parsed.cat && CATEGORIES.some((option) => option.value === parsed.cat) ? parsed.cat : CATEGORIES[0].value);
      setParsedTasks(null);
      setParseMeta(null);
    } catch {
      setText("");
      setCat(CATEGORIES[0].value);
    }
  }, [spaceKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      getDraftStorageKey(spaceKey),
      JSON.stringify({
        text,
        cat,
      }),
    );
  }, [spaceKey, text, cat]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleBlur = useCallback(async () => {
    setFocused(false);
    if (text.trim().length < 6) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setCategorizing(true);
        const res = await fetch("/api/ai/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, primaryModel }),
        });
        const data = await res.json();
        if (data.cat) setCat(data.cat);
      } catch {
        // Silence categorization misses to keep typing fast.
      } finally {
        setCategorizing(false);
      }
    }, 700);
  }, [primaryModel, text]);

  const clearComposer = useCallback(() => {
    setText("");
    setParsedTasks(null);
    setParseMeta(null);
  }, []);

  const handleAiParse = async () => {
    if (!text.trim()) return;

    try {
      setParsing(true);
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, primaryModel }),
      });
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        setParsedTasks(data.tasks);
        setParseMeta(data.meta ?? null);
        if (data.meta) onAiMeta(data.meta);
      }
    } catch {
      // Silent fail keeps the manual path available.
    } finally {
      setParsing(false);
    }
  };

  const confirmParsed = () => {
    if (!parsedTasks) return;
    onAiParse(parsedTasks, parseMeta ?? undefined);
    clearComposer();
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), cat);
    clearComposer();
  };

  return (
    <div className="glass rounded-[28px] p-4 sm:p-5 animate-fadeDown" style={{ animationDelay: "0.2s" }}>
      <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onKeyDown={(event) => event.key === "Enter" && handleAdd()}
          placeholder="Add a task or drop in a messy thought."
          className="flex-1 min-w-0 bg-surface border border-border rounded-[18px] px-4 py-3.5 text-textPrimary font-dm text-sm outline-none transition-all duration-300 placeholder:text-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
          style={
            focused
              ? {
                  borderColor: "rgba(var(--accent-rgb),0.55)",
                  boxShadow: "0 0 0 1px rgba(var(--accent-rgb),0.18), 0 0 22px rgba(var(--accent-rgb),0.12)",
                }
              : undefined
          }
        />

        <select
          value={cat}
          onChange={(event) => setCat(event.target.value)}
          className={`bg-surface border rounded-[18px] px-3 py-3.5 text-textPrimary font-dm text-sm outline-none cursor-pointer transition-all duration-300 focus:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
            categorizing ? "border-accent/60 animate-pulse" : "border-border"
          }`}
        >
          {CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.emoji} {category.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleAiParse}
          disabled={parsing || !text.trim()}
          className="sparkle-hover bg-surface border border-accent/30 text-accent rounded-[18px] px-4 py-3.5 font-syne font-bold text-xs whitespace-nowrap transition-all duration-200 hover:bg-accent/10 hover:border-accent/60 hover:-translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
        >
          <span className={`sparkle-icon inline-block mr-1 ${parsing ? "animate-pulse" : ""}`}>✦</span>
          {parsing ? "AI..." : "AI Parse"}
        </button>

        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="bg-accent text-bg rounded-[18px] px-5 py-3.5 font-syne font-bold text-sm whitespace-nowrap transition-all duration-200 hover:-translate-y-[2px] hover:shadow-glow active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/45"
        >
          + Add
        </button>
      </div>

      {parsedTasks && parsedTasks.length > 0 && (
        <div
          className="mt-3 rounded-[18px] border border-accent/20 p-4 animate-slideIn"
          style={{ background: "rgba(var(--accent-rgb),0.08)", backdropFilter: "blur(10px)" }}
        >
          <div className="text-[11px] uppercase tracking-[0.12em] text-accent/90 font-dm mb-3 flex items-center gap-1.5">
            <span className="sparkle-icon inline-block">✦</span>
            {parsedTasks.length} task{parsedTasks.length > 1 ? "s" : ""} ready
          </div>
          <div className="flex flex-col gap-1.5 mb-3">
            {parsedTasks.map((task, index) => (
              <div key={`${task.text}-${index}`} className="flex items-center gap-2 text-sm font-dm text-textPrimary">
                <span className="text-accent text-xs">+</span>
                <span className="flex-1">{task.text}</span>
                <span className="text-[11px] text-muted bg-surface border border-border rounded-full px-2 py-0.5">
                  {task.cat.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          {parseMeta && <p className="mb-3 text-xs text-muted font-dm">{describeMeta(parseMeta)}</p>}
          <div className="flex gap-2">
            <button
              onClick={confirmParsed}
              className="bg-accent text-bg text-xs font-syne font-bold px-4 py-2 rounded-lg hover:shadow-glowSm transition-all duration-200"
            >
              Add All
            </button>
            <button
              onClick={() => {
                setParsedTasks(null);
                setParseMeta(null);
              }}
              className="text-muted text-xs font-dm px-4 py-2 rounded-lg border border-border hover:text-textPrimary hover:border-white/15 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
