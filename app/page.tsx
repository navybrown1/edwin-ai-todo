"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ProgressBar from "@/components/ProgressBar";
import AddTaskBar from "@/components/AddTaskBar";
import FilterTabs from "@/components/FilterTabs";
import CategorySection from "@/components/CategorySection";
import AiPanel from "@/components/AiPanel";
import Toast from "@/components/Toast";
import SpacePanel from "@/components/SpacePanel";
import { APP_NAME, DEFAULT_GEMINI_MODEL, DEFAULT_SPACE_TITLE, DEFAULT_THEME_MODE, getModelLabel } from "@/lib/ai-config";
import { createSpaceKey, sanitizeSpaceKey } from "@/lib/space-utils";
import type {
  AiResponseMeta,
  GeminiModelId,
  ParsedTask,
  Subtask,
  Task,
  ThemeMode,
  Workspace,
} from "@/types";

type Filter = "all" | "active" | "done";
type WorkspaceSaveState = "idle" | "saving" | "saved" | "error";

interface ToastState {
  show: boolean;
  message: string;
  type: "success" | "error" | "ai";
}

const ACTIVE_SPACE_STORAGE_KEY = "nova.active-space-key";
const THEME_STORAGE_KEY = "nova.theme";
const PRIMARY_MODEL_STORAGE_KEY = "nova.primary-model";

function withSpaceKey(path: string, spaceKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}spaceKey=${encodeURIComponent(spaceKey)}`;
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light" || value === "girl" || value === "fun";
}

function isGeminiModel(value: string | null): value is GeminiModelId {
  return value === "gemini-2.5-pro" || value === "gemini-2.5-flash" || value === "gemini-2.5-flash-lite";
}

function describeAiUsage(meta: AiResponseMeta) {
  if (!meta.fallbackUsed) {
    return getModelLabel(meta.model);
  }

  return `${meta.attemptedModels.map(getModelLabel).join(" -> ")}`;
}

function normalizeBoardTitle(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "Nova Space") return DEFAULT_SPACE_TITLE;
  return trimmed;
}

export default function Home() {
  const [spaceKey, setSpaceKey] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [title, setTitle] = useState(DEFAULT_SPACE_TITLE);
  const [memory, setMemory] = useState("");
  const [workspaceSaveState, setWorkspaceSaveState] = useState<WorkspaceSaveState>("idle");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [bootingSpace, setBootingSpace] = useState(true);
  const [breakingTaskId, setBreakingTaskId] = useState<number | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [primaryModel, setPrimaryModel] = useState<GeminiModelId>(DEFAULT_GEMINI_MODEL);
  const [lastAiMeta, setLastAiMeta] = useState<AiResponseMeta | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });
  const workspaceHydrationRef = useRef(true);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadRequestRef = useRef(0);

  const toastTimer = useCallback((message: string, type: ToastState["type"] = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2200);
  }, []);

  const applyTheme = useCallback((nextTheme: ThemeMode) => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme === "light" ? "light" : "dark";
  }, []);

  const syncSpaceUrl = useCallback((nextSpaceKey: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("space", nextSpaceKey);
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, []);

  const recordAiMeta = useCallback((meta: AiResponseMeta) => {
    setLastAiMeta(meta);
  }, []);

  const loadSpaceData = useCallback(
    async (nextSpaceKey: string) => {
      const requestId = ++loadRequestRef.current;
      setLoading(true);
      try {
        const [spaceRes, tasksRes] = await Promise.all([
          fetch(withSpaceKey("/api/space", nextSpaceKey), { cache: "no-store" }),
          fetch(withSpaceKey("/api/tasks", nextSpaceKey), { cache: "no-store" }),
        ]);

        const [spaceData, tasksData] = await Promise.all([spaceRes.json(), tasksRes.json()]);

        if (!spaceRes.ok) throw new Error(spaceData.error || "Failed to load space");
        if (!tasksRes.ok) throw new Error(tasksData.error || "Failed to load tasks");
        if (requestId !== loadRequestRef.current) return;

        workspaceHydrationRef.current = true;
        setWorkspace(spaceData);
        setTitle(normalizeBoardTitle(spaceData.title));
        setMemory(spaceData.memory || "");
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setWorkspaceSaveState("idle");
        setLastAiMeta(null);
      } catch (error) {
        if (requestId !== loadRequestRef.current) return;
        console.error("Failed to load space:", error);
        toastTimer("Failed to load this private list", "error");
      } finally {
        if (requestId === loadRequestRef.current) setLoading(false);
      }
    },
    [toastTimer],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const savedModel = window.localStorage.getItem(PRIMARY_MODEL_STORAGE_KEY);
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = sanitizeSpaceKey(searchParams.get("space"));
    const fromStorage = sanitizeSpaceKey(window.localStorage.getItem(ACTIVE_SPACE_STORAGE_KEY));
    const resolvedSpaceKey = fromUrl ?? fromStorage ?? createSpaceKey();

    if (isThemeMode(savedTheme)) {
      setThemeMode(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme(DEFAULT_THEME_MODE);
    }

    if (isGeminiModel(savedModel)) {
      setPrimaryModel(savedModel);
    }

    window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, resolvedSpaceKey);
    syncSpaceUrl(resolvedSpaceKey);
    setSpaceKey(resolvedSpaceKey);
    setBootingSpace(false);
  }, [applyTheme, syncSpaceUrl]);

  useEffect(() => {
    if (!spaceKey) return;
    void loadSpaceData(spaceKey);
  }, [spaceKey, loadSpaceData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    applyTheme(themeMode);
  }, [applyTheme, themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PRIMARY_MODEL_STORAGE_KEY, primaryModel);
  }, [primaryModel]);

  useEffect(() => {
    if (!spaceKey || !workspace) return;
    if (workspaceHydrationRef.current) {
      workspaceHydrationRef.current = false;
      return;
    }

    setWorkspaceSaveState("saving");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/space", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spaceKey,
            title,
            memory,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save");
        setWorkspace(data);
        setWorkspaceSaveState("saved");
      } catch (error) {
        console.error("Failed to save workspace:", error);
        setWorkspaceSaveState("error");
      }
    }, 550);

    return () => clearTimeout(timeout);
  }, [memory, spaceKey, title, workspace]);

  useEffect(() => {
    if (workspaceSaveState !== "saved") return;
    const timeout = setTimeout(() => setWorkspaceSaveState("idle"), 1200);
    return () => clearTimeout(timeout);
  }, [workspaceSaveState]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const total = tasks.length;
  const done = tasks.filter((task) => task.done).length;
  const remaining = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const filtered =
    filter === "active" ? tasks.filter((task) => !task.done) : filter === "done" ? tasks.filter((task) => task.done) : tasks;

  const categories = [...new Set(tasks.map((task) => task.cat))];

  const addTask = useCallback(
    async (text: string, cat: string) => {
      if (!spaceKey) return;
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, cat, spaceKey }),
        });
        const task: Task | { error?: string } = await res.json();
        if (!res.ok || !("id" in task)) throw new Error(("error" in task && task.error) || "Failed to create task");
        setTasks((prev) => [...prev, task]);
        toastTimer("Task added", "success");
      } catch (error) {
        console.error("Failed to add task:", error);
        toastTimer("Failed to add task", "error");
      }
    },
    [spaceKey, toastTimer],
  );

  const addMultipleTasks = useCallback(
    async (parsedTasks: ParsedTask[], meta?: AiResponseMeta) => {
      if (!spaceKey) return;
      try {
        const added: Task[] = [];
        for (const { text, cat } of parsedTasks) {
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, cat, spaceKey }),
          });
          const task: Task | { error?: string } = await res.json();
          if (!res.ok || !("id" in task)) throw new Error(("error" in task && task.error) || "Failed to create task");
          added.push(task);
        }
        setTasks((prev) => [...prev, ...added]);
        if (meta) {
          recordAiMeta(meta);
          toastTimer(`${added.length} tasks added via ${describeAiUsage(meta)}`, "ai");
        } else {
          toastTimer(`${added.length} tasks added by AI`, "ai");
        }
      } catch (error) {
        console.error("Failed to add parsed tasks:", error);
        toastTimer("Failed to add AI tasks", "error");
      }
    },
    [recordAiMeta, spaceKey, toastTimer],
  );

  const toggleTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      const newDone = !task.done;

      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, done: newDone } : item)));
      try {
        const res = await fetch(withSpaceKey(`/api/tasks/${id}`, spaceKey), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: newDone }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        toastTimer(newDone ? "Task completed" : "Task reopened");
      } catch (error) {
        console.error("Failed to toggle task:", error);
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, done: task.done } : item)));
        toastTimer("Task update failed", "error");
      }
    },
    [spaceKey, tasks, toastTimer],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;
      const previous = tasks;
      setTasks((prev) => prev.filter((task) => task.id !== id));
      try {
        const res = await fetch(withSpaceKey(`/api/tasks/${id}`, spaceKey), { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete task");
        toastTimer("Task deleted");
      } catch (error) {
        console.error("Failed to delete task:", error);
        setTasks(previous);
        toastTimer("Failed to delete task", "error");
      }
    },
    [spaceKey, tasks, toastTimer],
  );

  const toggleSubtask = useCallback(
    async (taskId: number, subtaskId: number, doneValue: boolean) => {
      if (!spaceKey) return;
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, subtasks: task.subtasks?.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: doneValue } : subtask)) }
            : task,
        ),
      );
      try {
        const res = await fetch(withSpaceKey(`/api/tasks/${taskId}`, spaceKey), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggleSubtask", subtaskId, done: doneValue }),
        });
        if (!res.ok) throw new Error("Failed to update subtask");
      } catch (error) {
        console.error("Failed to toggle subtask:", error);
        void loadSpaceData(spaceKey);
      }
    },
    [loadSpaceData, spaceKey],
  );

  const handleBreakdown = useCallback(
    async (task: Task) => {
      if (!spaceKey) return;
      setBreakingTaskId(task.id);
      try {
        const res = await fetch("/api/ai/breakdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: task.text, category: task.cat, primaryModel }),
        });
        const data = await res.json();
        if (!res.ok || !data.steps?.length) throw new Error(data.error || "No steps returned");

        if (data.meta) recordAiMeta(data.meta);

        const created: Subtask[] = [];
        for (const stepText of data.steps) {
          const subtaskRes = await fetch(withSpaceKey(`/api/tasks/${task.id}`, spaceKey), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addSubtask", text: stepText }),
          });
          const subtask = await subtaskRes.json();
          if (!subtaskRes.ok) throw new Error(subtask.error || "Failed to add subtask");
          created.push(subtask);
        }

        setTasks((prev) =>
          prev.map((item) => (item.id === task.id ? { ...item, subtasks: [...(item.subtasks || []), ...created] } : item)),
        );
        toastTimer(`Added ${created.length} steps via ${data.meta ? describeAiUsage(data.meta) : getModelLabel(primaryModel)}`, "ai");
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI breakdown failed";
        console.error("Breakdown failed:", error);
        toastTimer(message.includes("Rate") ? "Rate limited. Try again in 30 seconds." : "AI breakdown failed", "error");
      } finally {
        setBreakingTaskId(null);
      }
    },
    [primaryModel, recordAiMeta, spaceKey, toastTimer],
  );

  const markAllDone = useCallback(async () => {
    if (!spaceKey) return;
    const pendingTasks = tasks.filter((task) => !task.done);
    if (!pendingTasks.length) return;
    setTasks((prev) => prev.map((task) => ({ ...task, done: true })));
      try {
        await Promise.all(
          pendingTasks.map(async (task) => {
            const res = await fetch(withSpaceKey(`/api/tasks/${task.id}`, spaceKey), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ done: true }),
            });
            if (!res.ok) throw new Error("Failed to complete task");
          }),
        );
      toastTimer("All tasks completed");
    } catch (error) {
      console.error("Failed to complete all tasks:", error);
      void loadSpaceData(spaceKey);
      toastTimer("Bulk update failed", "error");
    }
  }, [loadSpaceData, spaceKey, tasks, toastTimer]);

  const resetAll = useCallback(async () => {
    if (!spaceKey) return;
    const doneTasks = tasks.filter((task) => task.done);
    if (!doneTasks.length) return;
    setTasks((prev) => prev.map((task) => ({ ...task, done: false })));
      try {
        await Promise.all(
          doneTasks.map(async (task) => {
            const res = await fetch(withSpaceKey(`/api/tasks/${task.id}`, spaceKey), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ done: false }),
            });
            if (!res.ok) throw new Error("Failed to reset task");
          }),
        );
      toastTimer("All tasks reset");
    } catch (error) {
      console.error("Failed to reset all tasks:", error);
      void loadSpaceData(spaceKey);
      toastTimer("Bulk reset failed", "error");
    }
  }, [loadSpaceData, spaceKey, tasks, toastTimer]);

  const clearDone = useCallback(async () => {
    if (!spaceKey) return;
    const doneTasks = tasks.filter((task) => task.done);
    if (!doneTasks.length) return;
    setTasks((prev) => prev.filter((task) => !task.done));
    try {
      await Promise.all(
        doneTasks.map(async (task) => {
          const res = await fetch(withSpaceKey(`/api/tasks/${task.id}`, spaceKey), { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete task");
        }),
      );
      toastTimer(`${doneTasks.length} completed tasks cleared`);
    } catch (error) {
      console.error("Failed to clear completed tasks:", error);
      void loadSpaceData(spaceKey);
      toastTimer("Failed to clear completed tasks", "error");
    }
  }, [loadSpaceData, spaceKey, tasks, toastTimer]);

  const copyRecoveryLink = useCallback(async () => {
    if (!spaceKey || typeof window === "undefined") return;
    const link = `${window.location.origin}${window.location.pathname}?space=${spaceKey}`;
    try {
      await navigator.clipboard.writeText(link);
      toastTimer("Recovery link copied");
    } catch (error) {
      console.error("Failed to copy recovery link:", error);
      toastTimer("Could not copy link", "error");
    }
  }, [spaceKey, toastTimer]);

  const startFreshList = useCallback(() => {
    if (typeof window === "undefined") return;
    const nextSpaceKey = createSpaceKey();
    window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, nextSpaceKey);
    syncSpaceUrl(nextSpaceKey);
    workspaceHydrationRef.current = true;
    setWorkspace(null);
    setTitle(DEFAULT_SPACE_TITLE);
    setMemory("");
    setTasks([]);
    setSpaceKey(nextSpaceKey);
    setWorkspaceSaveState("idle");
    setLastAiMeta(null);
    toastTimer("Started a fresh private list");
  }, [syncSpaceUrl, toastTimer]);

  if (bootingSpace || !spaceKey) {
    return (
      <main className="relative z-10 max-w-[1080px] mx-auto px-5 py-10 pb-20">
        <div className="space-y-4">
          <div className="h-24 rounded-[28px] ai-shimmer" />
          <div className="h-72 rounded-[28px] ai-shimmer" />
          <div className="h-16 rounded-[22px] ai-shimmer" />
          <div className="h-56 rounded-[28px] ai-shimmer" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 max-w-[1080px] mx-auto px-5 py-10 pb-20">
      <div className="blob blob-1" style={{ width: 400, height: 400, top: "-10%", left: "-15%", background: "rgba(var(--blob-a-rgb),0.13)" }} />
      <div className="blob blob-2" style={{ width: 350, height: 350, top: "38%", right: "-20%", background: "rgba(var(--blob-b-rgb),0.1)" }} />
      <div className="blob blob-3" style={{ width: 300, height: 300, bottom: "5%", left: "8%", background: "rgba(var(--blob-c-rgb),0.09)" }} />

      <Header title={APP_NAME} />

      <SpacePanel
        spaceKey={spaceKey}
        title={title}
        memory={memory}
        themeMode={themeMode}
        primaryModel={primaryModel}
        saveState={workspaceSaveState}
        onTitleChange={setTitle}
        onMemoryChange={setMemory}
        onThemeChange={setThemeMode}
        onPrimaryModelChange={setPrimaryModel}
        onCopyLink={copyRecoveryLink}
        onStartFresh={startFreshList}
      />

      <StatsBar total={total} remaining={remaining} done={done} />
      <ProgressBar pct={pct} />

      <AddTaskBar
        spaceKey={spaceKey}
        primaryModel={primaryModel}
        onAdd={addTask}
        onAiParse={addMultipleTasks}
        onAiMeta={recordAiMeta}
      />

      <FilterTabs active={filter} onChange={setFilter} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 rounded-[12px] ai-shimmer" style={{ width: `${85 - index * 5}%` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 flex flex-col items-center gap-4">
          {filter === "done" ? (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-35 text-accent">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M20 32L28 40L44 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </svg>
              <p className="text-muted/70 text-sm font-dm">Nothing completed yet. Knock out a few wins first.</p>
            </>
          ) : filter === "active" ? (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-45">
                <circle cx="32" cy="32" r="28" fill="rgba(52,211,153,0.08)" stroke="rgba(52,211,153,0.42)" strokeWidth="1.5" />
                <path d="M20 32L28 40L44 24" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="0.6s" fill="freeze" />
                </path>
              </svg>
              <p className="text-emerald-400/70 text-sm font-dm font-medium">All caught up.</p>
              <p className="text-muted/55 text-xs font-dm">Every active task in this private list is done.</p>
            </>
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="opacity-35 text-accent">
                <rect x="14" y="18" width="36" height="30" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 26H50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M22 34H34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M22 40H30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="32" cy="12" r="3" fill="currentColor" opacity="0.65" />
                <path d="M29 12H35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-muted/70 text-sm font-dm">This personal list is empty.</p>
              <p className="text-muted/55 text-xs font-dm">Add a task above or dump a messy thought into AI Parse.</p>
            </>
          )}
        </div>
      ) : (
        <div>
          {categories.map((category, index) => {
            const filteredTasks = filtered.filter((task) => task.cat === category);
            if (!filteredTasks.length) return null;

            return (
              <CategorySection
                key={category}
                cat={category}
                tasks={filteredTasks}
                allTasksInCat={tasks.filter((task) => task.cat === category)}
                animDelay={`${index * 0.05}s`}
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

      {tasks.length > 0 && (
        <div className="mt-8 flex gap-2.5 flex-wrap animate-fadeUp" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={markAllDone}
            className="glass-subtle rounded-xl px-4 py-2 text-xs font-dm text-muted hover:text-emerald-400 hover:border-emerald-400/20 transition-all duration-200 hover:-translate-y-[1px]"
          >
            Complete All
          </button>
          <button
            onClick={resetAll}
            className="glass-subtle rounded-xl px-4 py-2 text-xs font-dm text-muted hover:text-textPrimary hover:border-white/15 transition-all duration-200 hover:-translate-y-[1px]"
          >
            Reset All
          </button>
          {done > 0 && (
            <button
              onClick={clearDone}
              className="glass-subtle rounded-xl px-4 py-2 text-xs font-dm text-muted hover:text-[#f87171] hover:border-red-400/25 transition-all duration-200 hover:-translate-y-[1px]"
            >
              Clear Completed
            </button>
          )}
        </div>
      )}

      <AiPanel
        tasks={tasks}
        memory={memory}
        primaryModel={primaryModel}
        lastAiMeta={lastAiMeta}
        onAiMeta={recordAiMeta}
      />

      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </main>
  );
}
