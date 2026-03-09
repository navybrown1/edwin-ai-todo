"use client";

import { useCallback, useState } from "react";
import { getModelLabel } from "@/lib/ai-config";
import { describeAiUsage } from "@/lib/client-utils";
import type { AiResponseMeta, GeminiModelId, Subtask, Task } from "@/types";
import type { ToastType } from "@/hooks/useToast";

interface UseAiActionsOptions {
  notify: (message: string, type?: ToastType) => void;
  onAddSubtasksBulk: (taskId: number, texts: string[]) => Promise<Subtask[]>;
}

export function useAiActions(
  spaceKey: string | null,
  primaryModel: GeminiModelId,
  options: UseAiActionsOptions,
) {
  const { notify, onAddSubtasksBulk } = options;
  const [breakingTaskId, setBreakingTaskId] = useState<number | null>(null);
  const [lastAiMeta, setLastAiMeta] = useState<AiResponseMeta | null>(null);

  const recordAiMeta = useCallback((meta: AiResponseMeta) => {
    setLastAiMeta(meta);
  }, []);

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

        if (!res.ok || !data.steps?.length) {
          throw new Error(data.error || "No steps returned");
        }

        if (data.meta) {
          recordAiMeta(data.meta);
        }

        const created = await onAddSubtasksBulk(task.id, data.steps);
        notify(`Added ${created.length} steps via ${data.meta ? describeAiUsage(data.meta) : getModelLabel(primaryModel)}`, "ai");
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI breakdown failed";
        console.error("Breakdown failed:", error);
        notify(message.includes("Rate") ? "Rate limited. Try again in 30 seconds." : "AI breakdown failed", "error");
      } finally {
        setBreakingTaskId(null);
      }
    },
    [notify, onAddSubtasksBulk, primaryModel, recordAiMeta, spaceKey],
  );

  return {
    breakingTaskId,
    handleBreakdown,
    lastAiMeta,
    recordAiMeta,
    setLastAiMeta,
  };
}
