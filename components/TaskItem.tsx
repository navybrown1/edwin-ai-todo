"use client";

import { useState } from "react";
import SubtaskPanel from "./SubtaskPanel";
import type { Task, Subtask } from "@/types";

interface TaskItemProps {
  task: Task;
  animDelay?: string;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onSubtaskToggle: (taskId: number, subtaskId: number, done: boolean) => void;
  onBreakdown: (task: Task) => void;
  isBreaking: boolean;
}

export default function TaskItem({
  task,
  animDelay,
  onToggle,
  onDelete,
  onSubtaskToggle,
  onBreakdown,
  isBreaking,
}: TaskItemProps) {
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.done).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <div
      className={`border rounded-[10px] px-4 py-3.5 transition-all duration-250 animate-slideIn group
        ${task.done
          ? "bg-doneBg border-[#1e2a1e]"
          : "bg-surface border-border hover:border-[#3a3a48] hover:bg-surface2"
        }`}
      style={{ animationDelay: animDelay }}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`w-5 h-5 rounded-[6px] border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 cursor-pointer
            ${task.done
              ? "bg-[#3a7a3a] border-[#3a7a3a]"
              : "border-border hover:border-accent"
            }`}
        >
          {task.done && (
            <span className="text-white text-[11px] font-bold leading-none">✓</span>
          )}
        </button>

        {/* Task text */}
        <span className={`flex-1 text-sm font-dm leading-snug transition-colors duration-200
          ${task.done ? "line-through text-doneText" : "text-textPrimary"}`}
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
          className={`opacity-0 group-hover:opacity-100 text-[11px] font-dm text-muted hover:text-accent
            flex-shrink-0 transition-all duration-200 px-1.5 py-0.5 rounded border border-transparent
            hover:border-accent/30 disabled:cursor-not-allowed
            ${isBreaking ? "opacity-100 animate-pulse text-accent" : ""}`}
        >
          {isBreaking ? "AI..." : "↗ Steps"}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          title="Delete task"
          className="opacity-0 group-hover:opacity-100 text-[#ff5555] text-sm px-1 py-0.5 rounded
            hover:bg-[rgba(255,85,85,0.1)] transition-all duration-200 flex-shrink-0"
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
