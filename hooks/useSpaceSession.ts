"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, withSpaceKey, workspaceHasContent } from "@/lib/client-utils";
import { localSpaceHasAnyData } from "@/lib/local-store";
import { createSpaceKey, sanitizeSpaceKey } from "@/lib/space-utils";
import type { PlannerEvent, Task, Workspace } from "@/types";

const ACTIVE_SPACE_STORAGE_KEY = "nova.active-space-key";

function syncSpaceUrl(nextSpaceKey: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("space", nextSpaceKey);
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

async function spaceHasData(spaceKey: string) {
  try {
    const [tasks, workspace, events] = await Promise.all([
      fetchJson<Task[]>(withSpaceKey("/api/tasks", spaceKey), { cache: "no-store" }),
      fetchJson<Workspace>(withSpaceKey("/api/space", spaceKey), { cache: "no-store" }),
      fetchJson<PlannerEvent[]>(withSpaceKey("/api/planner/events", spaceKey), { cache: "no-store" }),
    ]);

    return tasks.length > 0 || events.length > 0 || workspaceHasContent(workspace);
  } catch (error) {
    console.error("Falling back to local board detection:", error);
    return localSpaceHasAnyData(spaceKey);
  }
}

export function useSpaceSession() {
  const [spaceKey, setSpaceKey] = useState<string | null>(null);
  const [bootingSpace, setBootingSpace] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const bootstrapSpace = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const fromUrl = sanitizeSpaceKey(searchParams.get("space"));
      const fromStorage = sanitizeSpaceKey(window.localStorage.getItem(ACTIVE_SPACE_STORAGE_KEY));
      let resolvedSpaceKey = fromUrl ?? fromStorage;

      if (!resolvedSpaceKey) {
        resolvedSpaceKey = (await spaceHasData("default")) ? "default" : createSpaceKey();
      } else if (!fromUrl && fromStorage && fromStorage !== "default") {
        const [storedHasData, defaultHasData] = await Promise.all([spaceHasData(fromStorage), spaceHasData("default")]);
        if (!storedHasData && defaultHasData) {
          resolvedSpaceKey = "default";
        }
      }

      if (cancelled) {
        return;
      }

      window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, resolvedSpaceKey);
      syncSpaceUrl(resolvedSpaceKey);
      setSpaceKey(resolvedSpaceKey);
      setBootingSpace(false);
    };

    void bootstrapSpace();

    return () => {
      cancelled = true;
    };
  }, []);

  const startFreshSpace = useCallback(() => {
    if (typeof window === "undefined") return null;

    const nextSpaceKey = createSpaceKey();
    window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, nextSpaceKey);
    syncSpaceUrl(nextSpaceKey);
    setSpaceKey(nextSpaceKey);

    return nextSpaceKey;
  }, []);

  const getRecoveryLink = useCallback(() => {
    if (!spaceKey || typeof window === "undefined") {
      return null;
    }

    return `${window.location.origin}${window.location.pathname}?space=${spaceKey}`;
  }, [spaceKey]);

  return {
    bootingSpace,
    getRecoveryLink,
    spaceKey,
    startFreshSpace,
  };
}
