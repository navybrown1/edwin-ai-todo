"use client";

import { useCallback, useEffect, useState } from "react";
import { createSpaceKey, sanitizeSpaceKey } from "@/lib/space-utils";

const ACTIVE_SPACE_STORAGE_KEY = "nova.active-space-key";

function syncSpaceUrl(nextSpaceKey: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("space", nextSpaceKey);
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

async function spaceHasTasks(spaceKey: string) {
  const res = await fetch(`/api/tasks?spaceKey=${encodeURIComponent(spaceKey)}`, { cache: "no-store" });
  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  return Array.isArray(data) && data.length > 0;
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
        resolvedSpaceKey = (await spaceHasTasks("default")) ? "default" : createSpaceKey();
      } else if (!fromUrl && fromStorage && fromStorage !== "default") {
        const [storedHasTasks, defaultHasTasks] = await Promise.all([spaceHasTasks(fromStorage), spaceHasTasks("default")]);
        if (!storedHasTasks && defaultHasTasks) {
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
