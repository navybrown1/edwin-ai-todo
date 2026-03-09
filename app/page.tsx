"use client";

import { useCallback, useMemo, useState } from "react";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ProgressBar from "@/components/ProgressBar";
import AddTaskBar from "@/components/AddTaskBar";
import FilterTabs from "@/components/FilterTabs";
import CategorySection from "@/components/CategorySection";
import AiPanel from "@/components/AiPanel";
import Toast from "@/components/Toast";
import SpacePanel from "@/components/SpacePanel";
import FocusPanel from "@/components/FocusPanel";
import { APP_NAME } from "@/lib/ai-config";
import { useAiActions } from "@/hooks/useAiActions";
import { useLocalPreferences } from "@/hooks/useLocalPreferences";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSpaceSession } from "@/hooks/useSpaceSession";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/useToast";
import { useWorkspace } from "@/hooks/useWorkspace";

type Filter = "all" | "active" | "done";

export default function Home() {
  const [filter, setFilter] = useState<Filter>("all");
  const reducedMotion = useReducedMotion();
  const { toast, showToast } = useToast();
  const { bootingSpace, getRecoveryLink, spaceKey, startFreshSpace } = useSpaceSession();
  const { themeMode, setThemeMode, primaryModel, setPrimaryModel } = useLocalPreferences();
  const handleLoadError = useCallback(() => showToast("Failed to load this private list", "error"), [showToast]);
  const {
    loadingWorkspace,
    memory,
    resetWorkspace,
    saveState,
    setMemory,
    setTitle,
    title,
  } = useWorkspace(spaceKey, {
    onLoadError: handleLoadError,
  });
  const {
    addSubtasksBulk,
    addTask,
    addTasksBulk,
    clearDone,
    deleteTask,
    loadingTasks,
    markAllDone,
    resetAll,
    resetTasks,
    tasks,
    toggleSubtask,
    toggleTask,
  } = useTasks(spaceKey, {
    notify: showToast,
    onLoadError: handleLoadError,
  });
  const { breakingTaskId, handleBreakdown, lastAiMeta, recordAiMeta, setLastAiMeta } = useAiActions(spaceKey, primaryModel, {
    notify: showToast,
    onAddSubtasksBulk: addSubtasksBulk,
  });

  const loading = loadingWorkspace || loadingTasks;

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const remaining = total - done;
    const pct = total ? Math.round((done / total) * 100) : 0;

    return { done, pct, remaining, total };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "active") {
      return tasks.filter((task) => !task.done);
    }

    if (filter === "done") {
      return tasks.filter((task) => task.done);
    }

    return tasks;
  }, [filter, tasks]);

  const categories = useMemo(() => [...new Set(filteredTasks.map((task) => task.cat))], [filteredTasks]);

  const copyRecoveryLink = useCallback(async () => {
    const link = getRecoveryLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      showToast("Recovery link copied");
    } catch (error) {
      console.error("Failed to copy recovery link:", error);
      showToast("Could not copy link", "error");
    }
  }, [getRecoveryLink, showToast]);

  const startFreshList = useCallback(() => {
    const nextSpaceKey = startFreshSpace();
    if (!nextSpaceKey) return;

    resetWorkspace();
    resetTasks();
    setLastAiMeta(null);
    showToast("Started a fresh private list");
  }, [resetTasks, resetWorkspace, setLastAiMeta, showToast, startFreshSpace]);

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
        saveState={saveState}
        onTitleChange={setTitle}
        onMemoryChange={setMemory}
        onThemeChange={setThemeMode}
        onPrimaryModelChange={setPrimaryModel}
        onCopyLink={copyRecoveryLink}
        onStartFresh={startFreshList}
      />

      <StatsBar total={stats.total} remaining={stats.remaining} done={stats.done} />
      <ProgressBar pct={stats.pct} />
      <FocusPanel spaceKey={spaceKey} />

      <AddTaskBar
        spaceKey={spaceKey}
        primaryModel={primaryModel}
        onAdd={addTask}
        onAiParse={addTasksBulk}
        onAiMeta={recordAiMeta}
      />

      <FilterTabs active={filter} onChange={setFilter} />

      {loading && tasks.length === 0 ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-12 rounded-[12px] ai-shimmer" style={{ width: `${85 - index * 5}%` }} />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
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
                  {!reducedMotion && <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="0.6s" fill="freeze" />}
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
            const tasksInCategory = filteredTasks.filter((task) => task.cat === category);
            if (!tasksInCategory.length) return null;

            return (
              <CategorySection
                key={category}
                cat={category}
                tasks={tasksInCategory}
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
          {stats.done > 0 && (
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
