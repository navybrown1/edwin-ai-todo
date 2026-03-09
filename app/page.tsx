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
import { APP_NAME, getThemeOption } from "@/lib/ai-config";
import { useAiActions } from "@/hooks/useAiActions";
import { useLocalPreferences } from "@/hooks/useLocalPreferences";
import { useModeClickFx } from "@/hooks/useModeClickFx";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSpaceSession } from "@/hooks/useSpaceSession";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/useToast";
import { useUiSounds } from "@/hooks/useUiSounds";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { ThemeMode } from "@/types";

type Filter = "all" | "active" | "done";

function ModeEmptyIllustration({ themeMode }: { themeMode: ThemeMode }) {
  if (themeMode === "light") {
    return (
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="text-accent opacity-45">
        <circle cx="48" cy="18" r="8" fill="currentColor" opacity="0.16" />
        <circle cx="48" cy="18" r="4" fill="currentColor" opacity="0.32" />
        <path d="M8 52C18 36 31 39 42 46C49 41 56 40 60 44V60H8V52Z" fill="currentColor" opacity="0.08" />
        <path d="M12 28C15 25 19 25 22 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M25 22C28 19 32 19 35 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      </svg>
    );
  }

  if (themeMode === "girl") {
    return (
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="text-accent opacity-55">
        <circle cx="18" cy="42" r="10" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
        <circle cx="46" cy="20" r="12" stroke="currentColor" strokeWidth="1.2" opacity="0.26" />
        <circle cx="38" cy="46" r="8" stroke="#9333ea" strokeWidth="1.2" opacity="0.28" />
        <path d="M22 24L24 18L26 24L32 26L26 28L24 34L22 28L16 26Z" fill="currentColor" opacity="0.35" />
        <path d="M49 50C49 50 43 45 43 40.5C43 37.8 45.2 36 47.8 36.8C49 35 51 34.6 52.8 35.2C55.4 36 57 38 57 40.5C57 45 49 50 49 50Z" fill="currentColor" opacity="0.22" />
      </svg>
    );
  }

  if (themeMode === "fun") {
    return (
      <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="text-accent opacity-45">
        <circle cx="44" cy="18" r="10" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
        <path d="M44 8V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.24" />
        <path d="M12 46L17 39L22 46L27 39L32 46" stroke="#0ea5e9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
        <rect x="14" y="18" width="5" height="3" rx="1" fill="currentColor" opacity="0.32" transform="rotate(18 14 18)" />
        <rect x="50" y="36" width="5" height="3" rx="1" fill="#f97316" opacity="0.34" transform="rotate(-20 50 36)" />
        <circle cx="22" cy="52" r="3.2" fill="currentColor" opacity="0.28" />
      </svg>
    );
  }

  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none" className="text-accent opacity-45">
      <circle cx="34" cy="34" r="20" stroke="currentColor" strokeWidth="1.4" opacity="0.26" />
      <circle cx="34" cy="34" r="11" stroke="currentColor" strokeWidth="1.2" opacity="0.18" />
      <path d="M34 13V24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.56" />
      <path d="M21 52L47 16" stroke="#06b6d4" strokeWidth="1.4" strokeLinecap="round" opacity="0.34" />
      <circle cx="17" cy="18" r="1.3" fill="currentColor" opacity="0.4" />
      <circle cx="52" cy="46" r="1.1" fill="#8b5cf6" opacity="0.36" />
    </svg>
  );
}

export default function Home() {
  const [filter, setFilter] = useState<Filter>("all");
  const reducedMotion = useReducedMotion();
  const { toast, showToast } = useToast();
  const { bootingSpace, getRecoveryLink, spaceKey, startFreshSpace } = useSpaceSession();
  const { themeMode, setThemeMode, primaryModel, setPrimaryModel } = useLocalPreferences();
  useUiSounds();
  useModeClickFx(themeMode);
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
  const themeMeta = useMemo(() => getThemeOption(themeMode), [themeMode]);

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
      <main className="relative z-10 max-w-[1220px] mx-auto px-5 py-10 pb-20">
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
    <main className="relative z-10 max-w-[1220px] mx-auto px-5 py-10 pb-20">
      <div className="blob blob-1" style={{ width: 400, height: 400, top: "-10%", left: "-15%", background: "rgb(var(--blob-a-rgb) / 0.13)" }} />
      <div className="blob blob-2" style={{ width: 350, height: 350, top: "38%", right: "-20%", background: "rgb(var(--blob-b-rgb) / 0.1)" }} />
      <div className="blob blob-3" style={{ width: 300, height: 300, bottom: "5%", left: "8%", background: "rgb(var(--blob-c-rgb) / 0.09)" }} />

      <Header title={APP_NAME} themeMode={themeMode} />

      <SpacePanel
        spaceKey={spaceKey}
        title={title}
        memory={memory}
        remainingTasks={stats.remaining}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-4">
          <StatsBar total={stats.total} remaining={stats.remaining} done={stats.done} />
          <ProgressBar pct={stats.pct} />

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
                  <ModeEmptyIllustration themeMode={themeMode} />
                  <p className="text-textPrimary/88 text-base font-syne">{themeMeta.emptyTitle}</p>
                  <p className="max-w-sm text-muted/68 text-sm font-dm leading-relaxed">{themeMeta.emptyBody}</p>
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
            <div className="flex gap-2.5 flex-wrap animate-fadeUp" style={{ animationDelay: "0.3s" }}>
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
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <FocusPanel spaceKey={spaceKey} />
          <AiPanel
            tasks={tasks}
            memory={memory}
            primaryModel={primaryModel}
            lastAiMeta={lastAiMeta}
            onAiMeta={recordAiMeta}
          />
        </aside>
      </div>

      <Toast show={toast.show} message={toast.message} type={toast.type} />
    </main>
  );
}
