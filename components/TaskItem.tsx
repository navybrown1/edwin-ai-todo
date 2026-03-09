"use client";

import { useState } from "react";
import SubtaskPanel from "./SubtaskPanel";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  catColor?: string;
  animDelay?: string;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onSubtaskToggle: (taskId: number, subtaskId: number, done: boolean) => void;
  onBreakdown: (task: Task) => void;
  isBreaking: boolean;
}

export default function TaskItem({
  task,
  catColor = "#f0c040",
  animDelay,
  onToggle,
  onDelete,
  onSubtaskToggle,
  onBreakdown,
  isBreaking,
}: TaskItemProps) {
  const hasSubtasks       = (task.subtasks?.length ?? 0) > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.done).length ?? 0;
  const totalSubtasks     = task.subtasks?.length ?? 0;

  // Track the last-toggled id to trigger pop animation on the clicked checkbox
  const [justToggled, setJustToggled] = useState(false);

  function handleToggle() {
    setJustToggled(true);
    onToggle(task.id);
    setTimeout(() => setJustToggled(false), 350);
  }

  return (
    <div
      className={`border rounded-[12px] px-4 py-3.5 transition-all duration-300 animate-slideIn group relative overflow-hidden
        ${task.done
          ? "bg-doneBg border-[#151a15]"
          : "bg-surface border-border hover:border-[rgba(255,255,255,0.12)] hover:-translate-y-[1px]"
        }`}
      style={{
        animationDelay: animDelay,
        boxShadow: task.done ? "none" : "0 2px 12px rgba(0,0,0,0.3)",
      }}
    >
      {/* Left category color bar */}
      {!task.done && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full opacity-40"
          style={{ background: catColor }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Animated checkbox */}
        <button
          onClick={handleToggle}
          className={`w-[22px] h-[22px] rounded-[7px] border-2 flex-shrink-0 flex items-center justify-center
            transition-all duration-200 cursor-pointer relative overflow-hidden
            ${task.done
              ? "border-transparent"
              : "border-border hover:border-[rgba(255,255,255,0.25)]"
            }`}
          style={task.done ? {
            background: `linear-gradient(135deg, ${catColor}dd, ${catColor}88)`,
            boxShadow: `0 0 10px ${catColor}50`,
          } : {
            background: "transparent",
          }}
        >
          {task.done && (
            <div className={justToggled ? "pop-in" : ""}>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <polyline
                  points="1,5 5,9 11,1"
                  fill="none"
                  stroke="#080810"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="check-draw"
                />
              </svg>
            </div>
          )}
        </button>

        {/* Task text */}
        <span
          className={`flex-1 text-[14px] font-dm leading-snug transition-all duration-300
            ${task.done ? "task-text-done opacity-50" : "text-textPrimary"}`}
        >
          {task.text}
        </span>

        {/* Sub-count badge */}
        {hasSubtasks && (
          <span className="text-[10px] text-muted bg-surface2 border border-border rounded-full px-2 py-0.5 font-dm flex-shrink-0">
            {completedSubtasks}/{totalSubtasks}
          </span>
        )}

        {/* Break down button */}
        <button
          onClick={() => onBreakdown(task)}
          disabled={isBreaking}
          title="Break down with AI"
          className={`opacity-0 group-hover:opacity-100 text-[11px] font-dm text-muted
            flex-shrink-0 transition-all duration-200 px-2 py-0.5 rounded-lg border border-transparent
            hover:text-accent hover:border-accent/30 hover:bg-accent/5
            disabled:cursor-not-allowed
            ${isBreaking ? "!opacity-100 animate-pulse text-accent" : ""}`}
        >
          {isBreaking ? "✦ AI…" : "↗ Steps"}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          title="Delete task"
          className="opacity-0 group-hover:opacity-100 text-[#ff4444]/60 hover:text-[#ff4444] text-sm
            px-1.5 py-0.5 rounded-lg hover:bg-[rgba(255,68,68,0.08)] transition-all duration-200 flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Subtasks */}
      {hasSubtasks && (
        <SubtaskPanel
          taskId={task.id}
          subtasks={task.subtasks!}
          onToggle={onSubtaskToggle}
        />
      )}
    </div>
  );
}
