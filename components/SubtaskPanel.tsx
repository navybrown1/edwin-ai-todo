"use client";

import { useState } from "react";
import type { Subtask } from "@/types";

interface SubtaskPanelProps {
  taskId: number;
  subtasks: Subtask[];
  onToggle: (taskId: number, subtaskId: number, done: boolean) => void;
}

export default function SubtaskPanel({ taskId, subtasks, onToggle }: SubtaskPanelProps) {
  if (!subtasks.length) return null;

  return (
    <div className="mt-3 pl-8 border-l-2 border-border">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted font-dm mb-2">
        Sub-steps
      </div>
      <div className="flex flex-col gap-1.5">
        {subtasks.map((s) => (
          <div
            key={s.id}
            className="flex items-start gap-2.5 group"
          >
            <button
              onClick={() => onToggle(taskId, s.id, !s.done)}
              className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all duration-150
                ${s.done
                  ? "bg-[#3a7a3a] border-[#3a7a3a]"
                  : "border-border hover:border-accent"
                }`}
            >
              {s.done && (
                <span className="text-white text-[8px] font-bold leading-none">✓</span>
              )}
            </button>
            <span className={`text-[13px] font-dm leading-snug transition-colors
              ${s.done ? "line-through text-doneText" : "text-textPrimary"}`}
            >
              {s.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
