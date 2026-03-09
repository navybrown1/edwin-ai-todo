"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeAiUsage, fetchJson, withSpaceKey } from "@/lib/client-utils";
import { createLocalTask, loadLocalTasks, nextLocalSubtaskId, saveLocalTasks } from "@/lib/local-store";
import type { AiResponseMeta, ParsedTask, Subtask, Task } from "@/types";
import type { ToastType } from "@/hooks/useToast";

interface UseTasksOptions {
  notify: (message: string, type?: ToastType) => void;
  onLoadError?: () => void;
}

function mergeTask(tasks: Task[], nextTask: Task) {
  return tasks.map((task) => (task.id === nextTask.id ? nextTask : task));
}

function syncTaskMirror(spaceKey: string, tasks: Task[]) {
  saveLocalTasks(spaceKey, tasks);
  return tasks;
}

async function migrateLocalTasks(spaceKey: string, localTasks: Task[]) {
  for (const localTask of localTasks) {
    let remoteTask = await fetchJson<Task>("/api/tasks", {
      body: JSON.stringify({
        cat: localTask.cat,
        spaceKey,
        text: localTask.text,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (localTask.done) {
      remoteTask = await fetchJson<Task>(withSpaceKey(`/api/tasks/${remoteTask.id}`, spaceKey), {
        body: JSON.stringify({ done: true }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
    }

    if ((localTask.subtasks ?? []).length > 0) {
      const createdSubtasks = await fetchJson<Subtask[]>(withSpaceKey(`/api/tasks/${remoteTask.id}`, spaceKey), {
        body: JSON.stringify({
          action: "addSubtasksBulk",
          texts: localTask.subtasks?.map((subtask) => subtask.text) ?? [],
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const doneSubtasks = (localTask.subtasks ?? []).filter((subtask) => subtask.done);
      for (const doneSubtask of doneSubtasks) {
        const createdSubtask = createdSubtasks.find((subtask) => subtask.text === doneSubtask.text && !subtask.done);
        if (!createdSubtask) {
          continue;
        }

        await fetchJson<Subtask>(withSpaceKey(`/api/tasks/${remoteTask.id}`, spaceKey), {
          body: JSON.stringify({
            action: "toggleSubtask",
            done: true,
            subtaskId: createdSubtask.id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });
      }
    }
  }

  return fetchJson<Task[]>(withSpaceKey("/api/tasks", spaceKey), { cache: "no-store" });
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

  const persistTasks = useCallback((nextSpaceKey: string, nextTasks: Task[]) => {
    const mirroredTasks = syncTaskMirror(nextSpaceKey, nextTasks);
    tasksRef.current = mirroredTasks;
    setTasks(mirroredTasks);
  }, []);

  const notifyLocalMode = useCallback(() => {
    if (localModeNoticeRef.current) {
      return;
    }

    localModeNoticeRef.current = true;
    notifyRef.current("Cloud sync is unavailable. Using browser storage on this device.", "error");
  }, []);

  const loadTasks = useCallback(
    async (nextSpaceKey: string) => {
      setLoadingTasks(true);
      const localTasks = loadLocalTasks(nextSpaceKey);

      try {
        let remoteTasks = await fetchJson<Task[]>(withSpaceKey("/api/tasks", nextSpaceKey), {
          cache: "no-store",
        });

        if (remoteTasks.length === 0 && localTasks.length > 0) {
          remoteTasks = await migrateLocalTasks(nextSpaceKey, localTasks);
          notifyRef.current("Recovered your saved tasks into cloud sync.", "success");
        }

        localModeNoticeRef.current = false;
        persistTasks(nextSpaceKey, remoteTasks);
      } catch (error) {
        console.error("Falling back to local tasks:", error);
        persistTasks(nextSpaceKey, localTasks);
        notifyLocalMode();
        onLoadError?.();
      } finally {
        setLoadingTasks(false);
      }
    },
    [notifyLocalMode, onLoadError, persistTasks],
  );

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

      const cleanedText = text.trim();
      const cleanedCat = cat.trim();
      if (!cleanedText || !cleanedCat) return;

      try {
        const task = await fetchJson<Task>("/api/tasks", {
          body: JSON.stringify({
            cat: cleanedCat,
            spaceKey,
            text: cleanedText,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        localModeNoticeRef.current = false;
        persistTasks(spaceKey, [...tasksRef.current, task]);
      } catch (error) {
        console.error("Saving task locally because cloud sync failed:", error);
        notifyLocalMode();
        const task = createLocalTask(spaceKey, cleanedText, cleanedCat, tasksRef.current);
        persistTasks(spaceKey, [...tasksRef.current, task]);
      }

      notifyRef.current("Task added", "success");
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const addTasksBulk = useCallback(
    async (parsedTasks: ParsedTask[], meta?: AiResponseMeta) => {
      if (!spaceKey || parsedTasks.length === 0) return;

      const normalizedTasks = parsedTasks
        .map((task) => ({
          cat: task.cat.trim(),
          text: task.text.trim(),
        }))
        .filter((task) => task.text && task.cat);

      if (normalizedTasks.length === 0) {
        return;
      }

      try {
        const createdTasks = await fetchJson<Task[]>("/api/tasks/bulk", {
          body: JSON.stringify({
            spaceKey,
            tasks: normalizedTasks,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        localModeNoticeRef.current = false;
        persistTasks(spaceKey, [...tasksRef.current, ...createdTasks]);
      } catch (error) {
        console.error("Saving AI tasks locally because cloud sync failed:", error);
        notifyLocalMode();
        let nextId = tasksRef.current.reduce((max, task) => Math.max(max, task.id), 0) + 1;
        const createdTasks = normalizedTasks.map((task) => ({
          cat: task.cat,
          created_at: new Date().toISOString(),
          done: false,
          id: nextId++,
          subtasks: [],
          text: task.text,
        }));
        persistTasks(spaceKey, [...tasksRef.current, ...createdTasks]);
      }

      if (meta) {
        notifyRef.current(`${normalizedTasks.length} tasks added via ${describeAiUsage(meta)}`, "ai");
      } else {
        notifyRef.current(`${normalizedTasks.length} tasks added by AI`, "ai");
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

      try {
        const updatedTask = await fetchJson<Task>(withSpaceKey(`/api/tasks/${id}`, spaceKey), {
          body: JSON.stringify({ done: nextDone }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });

        localModeNoticeRef.current = false;
        persistTasks(spaceKey, mergeTask(tasksRef.current, updatedTask));
      } catch (error) {
        console.error("Updating task locally because cloud sync failed:", error);
        notifyLocalMode();
        persistTasks(
          spaceKey,
          tasksRef.current.map((item) => (item.id === id ? { ...item, done: nextDone } : item)),
        );
      }

      notifyRef.current(nextDone ? "Task completed" : "Task reopened");
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const deleteTask = useCallback(
    async (id: number) => {
      if (!spaceKey) return;

      try {
        await fetchJson<{ success: boolean }>(withSpaceKey(`/api/tasks/${id}`, spaceKey), {
          method: "DELETE",
        });
        localModeNoticeRef.current = false;
      } catch (error) {
        console.error("Deleting task locally because cloud sync failed:", error);
        notifyLocalMode();
      }

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

      try {
        const updatedSubtask = await fetchJson<Subtask>(withSpaceKey(`/api/tasks/${taskId}`, spaceKey), {
          body: JSON.stringify({
            action: "toggleSubtask",
            done: doneValue,
            subtaskId,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });

        localModeNoticeRef.current = false;
        persistTasks(
          spaceKey,
          tasksRef.current.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks?.map((subtask) => (subtask.id === subtaskId ? updatedSubtask : subtask)),
                }
              : task,
          ),
        );
      } catch (error) {
        console.error("Updating subtask locally because cloud sync failed:", error);
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
      }
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const addSubtasksBulk = useCallback(
    async (taskId: number, texts: string[]) => {
      if (!spaceKey || texts.length === 0) {
        return [] as Subtask[];
      }

      const cleanedTexts = texts.map((text) => text.trim()).filter(Boolean);
      if (cleanedTexts.length === 0) {
        return [] as Subtask[];
      }

      try {
        const subtasks = await fetchJson<Subtask[]>(withSpaceKey(`/api/tasks/${taskId}`, spaceKey), {
          body: JSON.stringify({
            action: "addSubtasksBulk",
            texts: cleanedTexts,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });

        localModeNoticeRef.current = false;
        persistTasks(
          spaceKey,
          tasksRef.current.map((task) =>
            task.id === taskId ? { ...task, subtasks: [...(task.subtasks || []), ...subtasks] } : task,
          ),
        );

        return subtasks;
      } catch (error) {
        console.error("Saving subtasks locally because cloud sync failed:", error);
        notifyLocalMode();

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
      }
    },
    [notifyLocalMode, persistTasks, spaceKey],
  );

  const markAllDone = useCallback(async () => {
    if (!spaceKey) return;

    const pendingTasks = tasksRef.current.filter((task) => !task.done);
    if (pendingTasks.length === 0) return;

    try {
      await fetchJson<Task[]>("/api/tasks/bulk", {
        body: JSON.stringify({
          done: true,
          ids: pendingTasks.map((task) => task.id),
          spaceKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      localModeNoticeRef.current = false;
    } catch (error) {
      console.error("Marking tasks locally because cloud sync failed:", error);
      notifyLocalMode();
    }

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

    try {
      await fetchJson<Task[]>("/api/tasks/bulk", {
        body: JSON.stringify({
          done: false,
          ids: doneTasks.map((task) => task.id),
          spaceKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      localModeNoticeRef.current = false;
    } catch (error) {
      console.error("Resetting tasks locally because cloud sync failed:", error);
      notifyLocalMode();
    }

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

    try {
      await fetchJson<{ deletedCount: number; success: boolean }>("/api/tasks/bulk", {
        body: JSON.stringify({
          ids: doneTasks.map((task) => task.id),
          spaceKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });
      localModeNoticeRef.current = false;
    } catch (error) {
      console.error("Clearing completed tasks locally because cloud sync failed:", error);
      notifyLocalMode();
    }

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
