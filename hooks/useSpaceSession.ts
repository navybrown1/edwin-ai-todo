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

export function useSpaceSession() {
  const [spaceKey, setSpaceKey] = useState<string | null>(null);
  const [bootingSpace, setBootingSpace] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = sanitizeSpaceKey(searchParams.get("space"));
    const fromStorage = sanitizeSpaceKey(window.localStorage.getItem(ACTIVE_SPACE_STORAGE_KEY));
    const resolvedSpaceKey = fromUrl ?? fromStorage ?? createSpaceKey();

    window.localStorage.setItem(ACTIVE_SPACE_STORAGE_KEY, resolvedSpaceKey);
    syncSpaceUrl(resolvedSpaceKey);
    setSpaceKey(resolvedSpaceKey);
    setBootingSpace(false);
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
