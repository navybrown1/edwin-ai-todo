"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ProgressBar from "@/components/ProgressBar";
import AddTaskBar from "@/components/AddTaskBar";
import FilterTabs from "@/components/FilterTabs";
import CategorySection from "@/components/CategorySection";
import AiPanel from "@/components/AiPanel";
import Toast from "@/components/Toast";
import type { Task, ParsedTask } from "@/types";

type Filter = "all" | "active" | "done";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error" | "ai";
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [breakingTaskId, setBreakingTaskId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });
  const toastTimer = useCallback((msg: string, type: ToastState["type"] = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2000);
  }, []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch {
      toastTimer("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [toastTimer]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const remaining = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = filter === "active"
    ? tasks.filter(t => !t.done)
    : filter === "done"
      ? tasks.filter(t => t.done)
      : tasks;

  // ── Categories (preserve original order) ──────────────────────────────────
  const categories = [...new Set(tasks.map(t => t.cat))];

  // ── CRUD operations ────────────────────────────────────────────────────────
  const addTask = useCallback(async (text: string, cat: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, cat }),
      });
      const task: Task = await res.json();
      setTasks(prev => [...prev, task]);
      toastTimer("✓ Task added");
    } catch {
      toastTimer("Failed to add task", "error");
    }
  }, [toastTimer]);

  const addMultipleTasks = useCallback(async (parsedTasks: ParsedTask[]) => {
    try {
      const added: Task[] = [];
      for (const { text, cat } of parsedTasks) {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, cat }),
        });
        added.push(await res.json());
      }
      setTasks(prev => [...prev, ...added]);
      toastTimer(`✦ ${added.length} tasks added by AI`, "ai");
    } catch {
      toastTimer("Failed to add AI tasks", "error");
    }
  }, [toastTimer]);

  const toggleTask = useCallback(async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: newDone }),
      });
      toastTimer(newDone ? "✓ Task completed" : "↺ Task reopened");
    } catch {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: task.done } : t));
    }
  }, [tasks, toastTimer]);

  const deleteTask = useCallback(async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      toastTimer("Task deleted");
    } catch {
      loadTasks();
    }
  }, [loadTasks, toastTimer]);

  // ── Subtask operations ─────────────────────────────────────────────────────
  const toggleSubtask = useCallback(async (taskId: number, subtaskId: number, done: boolean) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, subtasks: t.subtasks?.map(s => s.id === subtaskId ? { ...s, done } : s) }
        : t
    ));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleSubtask", subtaskId, done }),
      });
    } catch {
      loadTasks();
    }
  }, [loadTasks]);

  // ── AI Breakdown ───────────────────────────────────────────────────────────
  const handleBreakdown = useCallback(async (task: Task) => {
    setBreakingTaskId(task.id);
    try {
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.text, category: task.cat }),
      });
      const data = await res.json();
      if (!data.steps?.length) throw new Error("No steps returned");

      // Save subtasks to DB
      const created: import("@/types").Subtask[] = [];
      for (const text of data.steps) {
        const r = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "addSubtask", text }),
        });
        created.push(await r.json());
      }

      setTasks(prev => prev.map(t =>
        t.id === task.id
          ? { ...t, subtasks: [...(t.subtasks || []), ...created] }
          : t
      ));
      toastTimer(`✦ ${created.length} steps added by AI`, "ai");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI breakdown failed";
      toastTimer(msg.includes("Rate") ? "⏱ Rate limited — wait 30s" : "AI breakdown failed", "error");
    } finally {
      setBreakingTaskId(null);
    }
  }, [toastTimer]);

  // ── Bulk actions ───────────────────────────────────────────────────────────
  const markAllDone = useCallback(async () => {
    setTasks(prev => prev.map(t => ({ ...t, done: true })));
    await Promise.all(
      tasks.filter(t => !t.done).map(t =>
        fetch(`/api/tasks/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: true }),
        })
      )
    );
    toastTimer("✓ All tasks completed");
  }, [tasks, toastTimer]);

  const resetAll = useCallback(async () => {
    setTasks(prev => prev.map(t => ({ ...t, done: false })));
    await Promise.all(
      tasks.filter(t => t.done).map(t =>
        fetch(`/api/tasks/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: false }),
        })
      )
    );
    toastTimer("↺ All tasks reset");
  }, [tasks, toastTimer]);

  const clearDone = useCallback(async () => {
    const doneTasks = tasks.filter(t => t.done);
    setTasks(prev => prev.filter(t => !t.done));
    await Promise.all(
      doneTasks.map(t => fetch(`/api/tasks/${t.id}`, { method: "DELETE" }))
    );
    toastTimer(`✕ ${doneTasks.length} completed tasks cleared`);
  }, [tasks, toastTimer]);

  return (
    <main className="relative z-10 max-w-[680px] mx-auto px-5 py-10 pb-20">
      {/* Floating background blobs for depth */}
      <div className="blob blob-1" style={{ width: 400, height: 400, top: "-10%", left: "-15%", background: "rgba(240,192,64,0.055)" }} />
      <div className="blob blob-2" style={{ width: 350, height: 350, top: "40%", right: "-20%", background: "rgba(6,182,212,0.04)" }} />
      <div className="blob blob-3" style={{ width: 300, height: 300, bottom: "5%", left: "10%", background: "rgba(139,92,246,0.03)" }} />
      <Header />

      <StatsBar total={total} remaining={remaining} done={done} />
      <ProgressBar pct={pct} />

      <AddTaskBar onAdd={addTask} onAiParse={addMultipleTasks} />

      <FilterTabs active={filter} onChange={setFilter} />

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-[10px] ai-shimmer" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center gap-4">
          {filter === "done" ? (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-30">
                <circle cx="32" cy="32" r="28" stroke="#f0c040" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M20 32L28 40L44 24" stroke="#f0c040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </svg>
              <p className="text-muted/60 text-sm font-dm">Nothing completed yet — keep going!</p>
            </>
          ) : filter === "active" ? (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-40">
                <circle cx="32" cy="32" r="28" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.4)" strokeWidth="1.5" />
                <path d="M20 32L28 40L44 24" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="0.6s" fill="freeze" />
                </path>
              </svg>
              <p className="text-emerald-400/60 text-sm font-dm font-medium">All caught up! 🎉</p>
              <p className="text-muted/40 text-xs font-dm">Every active task is done.</p>
            </>
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-30">
                <rect x="14" y="18" width="36" height="30" rx="4" stroke="#f0c040" strokeWidth="1.5" />
                <path d="M14 26H50" stroke="#f0c040" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M22 34H34" stroke="#f0c040" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M22 40H30" stroke="#f0c040" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="32" cy="12" r="3" fill="#f0c040" opacity="0.6" />
                <path d="M29 12H35" stroke="#f0c040" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-muted/60 text-sm font-dm">No tasks yet.</p>
              <p className="text-muted/40 text-xs font-dm">Add one above or use ✦ AI Parse to get started.</p>
            </>
          )}
        </div>
      ) : (
        <div>
          {categories.map((cat, ci) => {
            const catFiltered = filtered.filter(t => t.cat === cat);
            if (!catFiltered.length) return null;
            return (
              <CategorySection
                key={cat}
                cat={cat}
                tasks={catFiltered}
                allTasksInCat={tasks.filter(t => t.cat === cat)}
                animDelay={`${ci * 0.05}s`}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onSubtaskToggle={toggleSubtask}
                onBreakdown={handleBreakdown}
                breakingTaskId={breakingTaskId}
              />
            );
          })}
        </div>
      )}

      {/* Bulk action buttons */}
      {tasks.length > 0 && (
        <div className="mt-8 flex gap-2.5 flex-wrap animate-fadeUp" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={markAllDone}
            className="glass-subtle rounded-xl px-4 py-2 text-xs font-dm text-muted
              hover:text-emerald-400 hover:border-emerald-400/20 transition-all duration-200 hover:-translate-y-[1px]"
          >
            ✓ Complete All
          </button>
          <button
            onClick={resetAll}
            className="glass-subtle rounded-xl px-4 py-2 text-xs font-dm text-muted
              hover:text-textPrimary hover:border-[rgba(255,255,255,0.12)] transition-all duration-200 hover:-translate-y-[1px]"
          >
            ↺ Reset All
          </button>
          {done > 0 && (
            <button
              onClick={clearDone}
              className="glass-subtle rounded-xl px-4 py-2 text-xs font-dm text-muted
                hover:text-[#f87171] hover:border-[rgba(239,68,68,0.25)] transition-all duration-200 hover:-translate-y-[1px]"
            >
              ✕ Clear Completed
            </button>
          )}
        </div>
      )}

      {/* AI Panel */}
      <AiPanel tasks={tasks} />

      {/* Toast */}
      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </main>
  );
}
