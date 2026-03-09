"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeAiUsage } from "@/lib/client-utils";
import { createLocalTask, loadLocalTasks, nextLocalSubtaskId, saveLocalTasks } from "@/lib/local-store";
import type { AiResponseMeta, ParsedTask, Subtask, Task } from "@/types";
import type { ToastType } from "@/hooks/useToast";

interface UseTasksOptions {
  notify: (message: string, type?: ToastType) => void;
  onLoadError?: () => void;
}

export function useTasks(spaceKey: string | null, options: UseTasksOptions) {
  const { notify, onLoadError } = options;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const tasksRef = useRef<Task[]>([]);
  const notifyRef = useRef(notify);
  const localModeNoticeRef = useRef(false);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  const loadTasks = useCallback(async (nextSpaceKey: string) => {
    setLoadingTasks(true);

    const nextTasks = loadLocalTasks(nextSpaceKey);
    tasksRef.current = nextTasks;
    setTasks(nextTasks);
    setLoadingTasks(false);
  }, []);

  useEffect(() => {
    if (!spaceKey) return;
    void loadTasks(spaceKey);
  }, [loadTasks, spaceKey]);

  const resetTasks = useCallback(() => {
    setTasks([]);
    setLoadingTasks(true);
  }, []);

  const persistTasks = useCallback((nextSpaceKey: string, nextTasks: Task[]) => {
    tasksRef.current = nextTasks;
    saveLocalTasks(nextSpaceKey, nextTasks);
    setTasks(nextTasks);
  }, []);

  const notifyLocalMode = useCallback(() => {
    if (localModeNoticeRef.current) {
      return;
    }

    localModeNoticeRef.current = true;
    notifyRef.current("Cloud sync is unavailable. Using browser storage on this device.", "error");
  }, []);

  const addTask = useCallback(
    async (text: string, cat: string) => {
      if (!spaceKey) return;

      const cleanedText = text.trim();
      const cleanedCat = cat.trim();
      if (!cleanedText || !cleanedCat) return;

      notifyLocalMode();
      const task = createLocalTask(spaceKey, cleanedText, cleanedCat, tasksRef.current);
      persistTasks(spaceKey, [...tasksRef.current, task]);
      notifyRef.current("Task added", "success");
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const addTasksBulk = useCallback(
    async (parsedTasks: ParsedTask[], meta?: AiResponseMeta) => {
      if (!spaceKey || parsedTasks.length === 0) return;

      notifyLocalMode();
      let nextId = tasksRef.current.reduce((max, task) => Math.max(max, task.id), 0) + 1;
      const createdTasks = parsedTasks
        .map((task) => ({
          cat: task.cat.trim(),
          text: task.text.trim(),
        }))
        .filter((task) => task.text && task.cat)
        .map((task) => ({
          cat: task.cat,
          created_at: new Date().toISOString(),
          done: false,
          id: nextId++,
          subtasks: [],
          text: task.text,
        }));

      persistTasks(spaceKey, [...tasksRef.current, ...createdTasks]);

      if (meta) {
        notifyRef.current(`${createdTasks.length} tasks added via ${describeAiUsage(meta)}`, "ai");
      } else {
        notifyRef.current(`${createdTasks.length} tasks added by AI`, "ai");
      }
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const toggleTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;

      const task = tasksRef.current.find((item) => item.id === id);
      if (!task) return;

      const nextDone = !task.done;
      notifyLocalMode();
      persistTasks(
        spaceKey,
        tasksRef.current.map((item) => (item.id === id ? { ...item, done: nextDone } : item)),
      );
      notifyRef.current(nextDone ? "Task completed" : "Task reopened");
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;

      notifyLocalMode();
      persistTasks(
        spaceKey,
        tasksRef.current.filter((task) => task.id !== id),
      );
      notifyRef.current("Task deleted");
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const toggleSubtask = useCallback(
    async (taskId: number, subtaskId: number, doneValue: boolean) => {
      if (!spaceKey) return;

      notifyLocalMode();
      persistTasks(
        spaceKey,
        tasksRef.current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: doneValue } : subtask)),
              }
            : task,
        ),
      );
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const addSubtasksBulk = useCallback(
    async (taskId: number, texts: string[]) => {
      if (!spaceKey || texts.length === 0) {
        return [] as Subtask[];
      }

      notifyLocalMode();
      const cleanedTexts = texts.map((text) => text.trim()).filter(Boolean);
      if (cleanedTexts.length === 0) {
        return [] as Subtask[];
      }

      const startId = nextLocalSubtaskId(tasksRef.current);
      const subtasks = cleanedTexts.map((text, index) => ({
        done: false,
        id: startId + index,
        task_id: taskId,
        text,
      }));

      persistTasks(
        spaceKey,
        tasksRef.current.map((task) =>
          task.id === taskId ? { ...task, subtasks: [...(task.subtasks || []), ...subtasks] } : task,
        ),
      );

      return subtasks;
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const markAllDone = useCallback(async () => {
    if (!spaceKey) return;

    const pendingTasks = tasksRef.current.filter((task) => !task.done);
    if (pendingTasks.length === 0) return;

    notifyLocalMode();
    persistTasks(
      spaceKey,
      tasksRef.current.map((task) => ({ ...task, done: true })),
    );
    notifyRef.current("All tasks completed");
  }, [notifyLocalMode, persistTasks, spaceKey]);

  const resetAll = useCallback(async () => {
    if (!spaceKey) return;

    const doneTasks = tasksRef.current.filter((task) => task.done);
    if (doneTasks.length === 0) return;

    notifyLocalMode();
    persistTasks(
      spaceKey,
      tasksRef.current.map((task) => ({ ...task, done: false })),
    );
    notifyRef.current("All tasks reset");
  }, [notifyLocalMode, persistTasks, spaceKey]);

  const clearDone = useCallback(async () => {
    if (!spaceKey) return;

    const doneTasks = tasksRef.current.filter((task) => task.done);
    if (doneTasks.length === 0) return;

    notifyLocalMode();
    persistTasks(
      spaceKey,
      tasksRef.current.filter((task) => !task.done),
    );
    notifyRef.current(`${doneTasks.length} completed tasks cleared`);
  }, [notifyLocalMode, persistTasks, spaceKey]);

  return {
    addSubtasksBulk,
    addTask,
    addTasksBulk,
    clearDone,
    deleteTask,
    loadingTasks,
    loadTasks,
    markAllDone,
    resetAll,
    resetTasks,
    tasks,
    toggleSubtask,
    toggleTask,
  };
}
