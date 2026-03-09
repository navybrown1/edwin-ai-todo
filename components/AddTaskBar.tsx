"use client";

import { useState, useRef, useCallback } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { ParsedTask } from "@/types";

interface AddTaskBarProps {
  onAdd: (text: string, cat: string) => void;
  onAiParse: (tasks: ParsedTask[]) => void;
}

export default function AddTaskBar({ onAdd, onAiParse }: AddTaskBarProps) {
  const [text, setText] = useState("");
  const [cat, setCat] = useState(CATEGORIES[0].value);
  const [parsing, setParsing] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[] | null>(null);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.cat) setCat(data.cat);
      } catch {
        // silent fail
      } finally {
        setCategorizing(false);
      }
    }, 800);
  }, [text]);

  const handleAiParse = async () => {
    if (!text.trim()) return;
    try {
      setParsing(true);
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const tasks = await res.json();
      if (Array.isArray(tasks)) setParsedTasks(tasks);
    } catch {
      // silent fail
    } finally {
      setParsing(false);
    }
  };

  const confirmParsed = () => {
    if (parsedTasks) {
      onAiParse(parsedTasks);
      setParsedTasks(null);
      setText("");
    }
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text.trim(), cat);
    setText("");
  };

  return (
    <div className="mb-8 animate-fadeDown" style={{ animationDelay: "0.2s" }}>
      {/* Input row */}
      <div className="flex gap-2.5 flex-wrap sm:flex-nowrap">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Add a task — or type naturally for AI parsing…"
          className="flex-1 min-w-0 bg-surface border border-border rounded-[12px] px-4 py-3.5 text-textPrimary
            font-dm text-sm outline-none transition-all duration-300 placeholder:text-muted/50"
          style={focused ? {
            borderColor: "rgba(240,192,64,0.5)",
            boxShadow: "0 0 0 1px rgba(240,192,64,0.18), 0 0 20px rgba(240,192,64,0.07)",
          } : {}}
        />
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          className={`bg-surface border rounded-[12px] px-3 py-3.5 text-textPrimary font-dm text-sm
            outline-none cursor-pointer transition-all duration-300 focus:border-accent/50
            ${categorizing ? "border-accent/60 animate-pulse" : "border-border"}`}
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
          ))}
        </select>

        {/* AI Parse button */}
        <button
          onClick={handleAiParse}
          disabled={parsing || !text.trim()}
          title="Parse with AI — splits compound sentences into multiple tasks"
          className="sparkle-hover bg-surface border border-accent/30 text-accent rounded-[12px] px-4 py-3.5
            font-syne font-bold text-xs whitespace-nowrap transition-all duration-200
            hover:bg-accent/10 hover:border-accent/60 hover:-translate-y-[1px]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <span className={`sparkle-icon inline-block mr-1 ${parsing ? "animate-pulse" : ""}`}>✦</span>
          {parsing ? "AI…" : "AI Parse"}
        </button>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="bg-accent text-bg rounded-[12px] px-5 py-3.5 font-syne font-bold text-sm
            whitespace-nowrap transition-all duration-200 hover:bg-[#f5d060] hover:-translate-y-[2px] hover:shadow-glow
            active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          + Add
        </button>
      </div>

      {/* AI parsed tasks confirmation */}
      {parsedTasks && parsedTasks.length > 0 && (
        <div
          className="mt-3 border border-accent/20 rounded-[12px] p-4 animate-slideIn"
          style={{ background: "rgba(240,192,64,0.05)", backdropFilter: "blur(8px)" }}
        >
          <div className="text-[11px] uppercase tracking-[0.12em] text-accent/80 font-dm mb-3 flex items-center gap-1.5">
            <span className="sparkle-icon inline-block">✦</span>
            AI parsed {parsedTasks.length} task{parsedTasks.length > 1 ? "s" : ""} — confirm to add:
          </div>
          <div className="flex flex-col gap-1.5 mb-3">
            {parsedTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-dm text-textPrimary">
                <span className="text-accent text-xs">+</span>
                <span className="flex-1">{t.text}</span>
                <span className="text-[11px] text-muted bg-surface border border-border rounded-full px-2 py-0.5">
                  {t.cat.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmParsed}
              className="bg-accent text-bg text-xs font-syne font-bold px-4 py-2 rounded-lg
                hover:bg-[#f5d060] hover:shadow-glowSm transition-all duration-200"
            >
              ✓ Add All
            </button>
            <button
              onClick={() => setParsedTasks(null)}
              className="text-muted text-xs font-dm px-4 py-2 rounded-lg border border-border
                hover:text-textPrimary hover:border-[rgba(255,255,255,0.12)] transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
