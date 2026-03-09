"use client";

import { useState } from "react";
import TaskItem from "./TaskItem";
import type { Task } from "@/types";

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

  const emoji = cat.split(" ")[0];
  const title = cat.replace(emoji, "").trim();
  const doneCount = allTasksInCat.filter(t => t.done).length;

  return (
    <div className="mb-7 animate-fadeUp" style={{ animationDelay: animDelay }}>
      {/* Category header */}
      <div
        className="flex items-center gap-2.5 mb-3 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="w-8 h-8 flex items-center justify-center bg-surface2 border border-border rounded-lg text-base flex-shrink-0">
          {emoji}
        </div>
        <span className="font-syne text-[11px] font-bold tracking-[0.15em] uppercase text-muted">
          {title}
        </span>
        <span className="ml-auto text-[11px] text-muted bg-surface2 border border-border rounded-full px-2.5 py-0.5 font-dm">
          {doneCount}/{allTasksInCat.length}
        </span>
        <span className={`text-[10px] text-muted transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}>
          ▼
        </span>
      </div>

      {/* Task list */}
      {!collapsed && (
        <div className="flex flex-col gap-1.5">
          {tasks.map((t, ti) => (
            <TaskItem
              key={t.id}
              task={t}
              animDelay={`${ti * 0.03}s`}
              onToggle={onToggle}
              onDelete={onDelete}
              onSubtaskToggle={onSubtaskToggle}
              onBreakdown={onBreakdown}
              isBreaking={breakingTaskId === t.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
