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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBlur = useCallback(async () => {
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
          onBlur={handleBlur}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="Add a task — or type naturally for AI parsing…"
          className="flex-1 min-w-0 bg-surface border border-border rounded-[10px] px-4 py-3.5 text-textPrimary
            font-dm text-sm outline-none transition-colors duration-200 placeholder:text-muted
            focus:border-accent"
        />
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          className={`bg-surface border rounded-[10px] px-3 py-3.5 text-textPrimary font-dm text-sm
            outline-none cursor-pointer transition-all duration-200 focus:border-accent
            ${categorizing ? "border-accent animate-pulse" : "border-border"}`}
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
          className="bg-surface2 border border-accent/40 text-accent rounded-[10px] px-4 py-3.5
            font-syne font-bold text-xs whitespace-nowrap transition-all duration-200
            hover:bg-accent hover:text-bg hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {parsing ? "⟳ AI..." : "✦ AI Parse"}
        </button>
        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="bg-accent text-bg rounded-[10px] px-5 py-3.5 font-syne font-bold text-sm
            whitespace-nowrap transition-all duration-150 hover:bg-[#f5d060] hover:-translate-y-px
            active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add
        </button>
      </div>

      {/* AI parsed tasks confirmation */}
      {parsedTasks && parsedTasks.length > 0 && (
        <div className="mt-3 bg-[#1e1a0e] border border-[#7a6020] rounded-[10px] p-4 animate-slideIn">
          <div className="text-[11px] uppercase tracking-[0.1em] text-[#f0c040] font-dm mb-2.5">
            ✦ AI parsed {parsedTasks.length} task{parsedTasks.length > 1 ? "s" : ""} — confirm to add:
          </div>
          <div className="flex flex-col gap-1.5 mb-3">
            {parsedTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-dm text-textPrimary">
                <span className="text-accent">+</span>
                <span className="flex-1">{t.text}</span>
                <span className="text-[11px] text-muted bg-surface2 border border-border rounded-full px-2 py-0.5">
                  {t.cat.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmParsed}
              className="bg-accent text-bg text-xs font-syne font-bold px-4 py-2 rounded-lg
                hover:bg-[#f5d060] transition-colors"
            >
              ✓ Add All
            </button>
            <button
              onClick={() => setParsedTasks(null)}
              className="text-muted text-xs font-dm px-4 py-2 rounded-lg border border-border
                hover:text-textPrimary hover:border-[#4a4a5a] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
