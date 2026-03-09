"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeAiUsage, withSpaceKey } from "@/lib/client-utils";
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
  const loadRequestRef = useRef(0);
  const tasksRef = useRef<Task[]>([]);
  const notifyRef = useRef(notify);
  const onLoadErrorRef = useRef(onLoadError);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  const loadTasks = useCallback(async (nextSpaceKey: string) => {
    const requestId = ++loadRequestRef.current;
    setLoadingTasks(true);

    try {
      const res = await fetch(withSpaceKey("/api/tasks", nextSpaceKey), { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load tasks");
      }

      if (requestId !== loadRequestRef.current) {
        return;
      }

      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      if (requestId !== loadRequestRef.current) {
        return;
      }

      console.error("Failed to load tasks:", error);
      onLoadErrorRef.current?.();
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoadingTasks(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!spaceKey) return;
    void loadTasks(spaceKey);
  }, [loadTasks, spaceKey]);

  const resetTasks = useCallback(() => {
    setTasks([]);
    setLoadingTasks(true);
  }, []);

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

        if (!res.ok || !("id" in task)) {
          throw new Error(("error" in task && task.error) || "Failed to create task");
        }

        setTasks((prev) => [...prev, task]);
        notifyRef.current("Task added", "success");
      } catch (error) {
        console.error("Failed to add task:", error);
        notifyRef.current("Failed to add task", "error");
      }
    },
    [spaceKey],
  );

  const addTasksBulk = useCallback(
    async (parsedTasks: ParsedTask[], meta?: AiResponseMeta) => {
      if (!spaceKey || parsedTasks.length === 0) return;

      try {
        const res = await fetch("/api/tasks/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spaceKey, tasks: parsedTasks }),
        });
        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
          throw new Error(data.error || "Failed to create tasks");
        }

        setTasks((prev) => [...prev, ...data]);

        if (meta) {
          notifyRef.current(`${data.length} tasks added via ${describeAiUsage(meta)}`, "ai");
        } else {
          notifyRef.current(`${data.length} tasks added by AI`, "ai");
        }
      } catch (error) {
        console.error("Failed to add parsed tasks:", error);
        notifyRef.current("Failed to add AI tasks", "error");
      }
    },
    [spaceKey],
  );

  const toggleTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;

      const task = tasksRef.current.find((item) => item.id === id);
      if (!task) return;

      const nextDone = !task.done;
      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, done: nextDone } : item)));

      try {
        const res = await fetch(withSpaceKey(`/api/tasks/${id}`, spaceKey), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ done: nextDone }),
        });

        if (!res.ok) {
          throw new Error("Failed to update task");
        }

        notifyRef.current(nextDone ? "Task completed" : "Task reopened");
      } catch (error) {
        console.error("Failed to toggle task:", error);
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, done: task.done } : item)));
        notifyRef.current("Task update failed", "error");
      }
    },
    [spaceKey],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;

      const previous = tasksRef.current;
      setTasks((prev) => prev.filter((task) => task.id !== id));

      try {
        const res = await fetch(withSpaceKey(`/api/tasks/${id}`, spaceKey), { method: "DELETE" });

        if (!res.ok) {
          throw new Error("Failed to delete task");
        }

        notifyRef.current("Task deleted");
      } catch (error) {
        console.error("Failed to delete task:", error);
        setTasks(previous);
        notifyRef.current("Failed to delete task", "error");
      }
    },
    [spaceKey],
  );

  const toggleSubtask = useCallback(
    async (taskId: number, subtaskId: number, doneValue: boolean) => {
      if (!spaceKey) return;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: doneValue } : subtask)),
              }
            : task,
        ),
      );

      try {
        const res = await fetch(withSpaceKey(`/api/tasks/${taskId}`, spaceKey), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggleSubtask", subtaskId, done: doneValue }),
        });

        if (!res.ok) {
          throw new Error("Failed to update subtask");
        }
      } catch (error) {
        console.error("Failed to toggle subtask:", error);
        void loadTasks(spaceKey);
      }
    },
    [loadTasks, spaceKey],
  );

  const addSubtasksBulk = useCallback(
    async (taskId: number, texts: string[]) => {
      if (!spaceKey || texts.length === 0) {
        return [] as Subtask[];
      }

      const res = await fetch(withSpaceKey(`/api/tasks/${taskId}`, spaceKey), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addSubtasksBulk", texts }),
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error(data.error || "Failed to add subtasks");
      }

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, subtasks: [...(task.subtasks || []), ...data] } : task)),
      );

      return data as Subtask[];
    },
    [spaceKey],
  );

  const markAllDone = useCallback(async () => {
    if (!spaceKey) return;

    const pendingTasks = tasksRef.current.filter((task) => !task.done);
    if (pendingTasks.length === 0) return;

    setTasks((prev) => prev.map((task) => ({ ...task, done: true })));

    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceKey,
          ids: pendingTasks.map((task) => task.id),
          done: true,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete tasks");
      }

      notifyRef.current("All tasks completed");
    } catch (error) {
      console.error("Failed to complete all tasks:", error);
      void loadTasks(spaceKey);
      notifyRef.current("Bulk update failed", "error");
    }
  }, [loadTasks, spaceKey]);

  const resetAll = useCallback(async () => {
    if (!spaceKey) return;

    const doneTasks = tasksRef.current.filter((task) => task.done);
    if (doneTasks.length === 0) return;

    setTasks((prev) => prev.map((task) => ({ ...task, done: false })));

    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceKey,
          ids: doneTasks.map((task) => task.id),
          done: false,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to reset tasks");
      }

      notifyRef.current("All tasks reset");
    } catch (error) {
      console.error("Failed to reset all tasks:", error);
      void loadTasks(spaceKey);
      notifyRef.current("Bulk reset failed", "error");
    }
  }, [loadTasks, spaceKey]);

  const clearDone = useCallback(async () => {
    if (!spaceKey) return;

    const doneTasks = tasksRef.current.filter((task) => task.done);
    if (doneTasks.length === 0) return;

    setTasks((prev) => prev.filter((task) => !task.done));

    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceKey,
          ids: doneTasks.map((task) => task.id),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete tasks");
      }

      notifyRef.current(`${doneTasks.length} completed tasks cleared`);
    } catch (error) {
      console.error("Failed to clear completed tasks:", error);
      void loadTasks(spaceKey);
      notifyRef.current("Failed to clear completed tasks", "error");
    }
  }, [loadTasks, spaceKey]);

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
