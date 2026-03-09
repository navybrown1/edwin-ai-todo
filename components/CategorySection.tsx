"use client";

import { useState } from "react";
import TaskItem from "./TaskItem";
import type { Task } from "@/types";

// Per-category accent colors
function getCatColor(cat: string): string {
  if (cat.includes("Financial")) return "#f59e0b";
  if (cat.includes("Legal"))     return "#8b5cf6";
  if (cat.includes("Family"))    return "#ec4899";
  if (cat.includes("School"))    return "#3b82f6";
  if (cat.includes("Career"))    return "#10b981";
  if (cat.includes("Health"))    return "#ef4444";
  if (cat.includes("Errands"))   return "#f97316";
  if (cat.includes("Tech"))      return "#06b6d4";
  return "#f0c040";
}

interface CategorySectionProps {
  cat: string;
  tasks: Task[];
  allTasksInCat: Task[];
  animDelay?: string;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onSubtaskToggle: (taskId: number, subtaskId: number, done: boolean) => void;
  onBreakdown: (task: Task) => void;
  breakingTaskId: number | null;
}

export default function CategorySection({
  cat,
  tasks,
  allTasksInCat,
  animDelay,
  onToggle,
  onDelete,
  onSubtaskToggle,
  onBreakdown,
  breakingTaskId,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const emoji     = cat.split(" ")[0];
  const title     = cat.replace(emoji, "").trim();
  const doneCount = allTasksInCat.filter(t => t.done).length;
  const color     = getCatColor(cat);
  const pct       = allTasksInCat.length > 0
    ? Math.round((doneCount / allTasksInCat.length) * 100)
    : 0;

  return (
    <div className="mb-7 animate-fadeUp" style={{ animationDelay: animDelay }}>
      {/* Category header */}
      <div
        className="flex items-center gap-2.5 mb-3 cursor-pointer select-none group/header"
        onClick={() => setCollapsed(!collapsed)}
      >
        {/* Colored emoji icon */}
        <div
          className="w-8 h-8 flex items-center justify-center rounded-xl text-base flex-shrink-0 transition-transform duration-200 group-hover/header:scale-110"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}35`,
            boxShadow: `0 0 12px ${color}20`,
          }}
        >
          {emoji}
        </div>

        {/* Category name */}
        <span
          className="font-syne text-[11px] font-bold tracking-[0.15em] uppercase transition-colors duration-200"
          style={{ color: `${color}cc` }}
        >
          {title}
        </span>

        {/* Mini progress bar */}
        <div className="flex-1 h-[2px] rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden mx-1 max-w-[60px]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: color,
              boxShadow: `0 0 6px ${color}60`,
            }}
          />
        </div>

        {/* Count badge */}
        <span
          className="ml-auto text-[11px] rounded-full px-2.5 py-0.5 font-dm flex-shrink-0 transition-all duration-200"
          style={{
            color,
            background: `${color}14`,
            border: `1px solid ${color}28`,
          }}
        >
          {doneCount}/{allTasksInCat.length}
        </span>

        {/* Chevron */}
        <span
          className="text-[9px] transition-transform duration-300 flex-shrink-0"
          style={{
            color: `${color}70`,
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>

      {/* Animated task list */}
      <div className={`category-tasks ${collapsed ? "collapsed" : "expanded"}`}>
        <div className="tasks-inner">
          <div className="flex flex-col gap-1.5 pt-0.5">
            {tasks.map((t, ti) => (
              <TaskItem
                key={t.id}
                task={t}
                catColor={color}
                animDelay={`${ti * 0.03}s`}
                onToggle={onToggle}
                onDelete={onDelete}
                onSubtaskToggle={onSubtaskToggle}
                onBreakdown={onBreakdown}
                isBreaking={breakingTaskId === t.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
