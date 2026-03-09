"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SPACE_TITLE } from "@/lib/ai-config";
import { normalizeBoardTitle, withSpaceKey } from "@/lib/client-utils";
import type { Workspace } from "@/types";

type WorkspaceSaveState = "idle" | "saving" | "saved" | "error";

interface UseWorkspaceOptions {
  onLoadError?: () => void;
}

export function useWorkspace(spaceKey: string | null, options: UseWorkspaceOptions = {}) {
  const { onLoadError } = options;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [title, setTitle] = useState(DEFAULT_SPACE_TITLE);
  const [memory, setMemory] = useState("");
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [saveState, setSaveState] = useState<WorkspaceSaveState>("idle");
  const hydrationRef = useRef(true);
  const loadRequestRef = useRef(0);
  const saveSeqRef = useRef(0);
  const activeSpaceRef = useRef<string | null>(spaceKey);
  const onLoadErrorRef = useRef(onLoadError);

  useEffect(() => {
    activeSpaceRef.current = spaceKey;
  }, [spaceKey]);

  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  const loadWorkspace = useCallback(async (nextSpaceKey: string) => {
    const requestId = ++loadRequestRef.current;
    setLoadingWorkspace(true);

    try {
      const res = await fetch(withSpaceKey("/api/space", nextSpaceKey), { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load space");
      }

      if (requestId !== loadRequestRef.current) {
        return;
      }

      hydrationRef.current = true;
      setWorkspace(data);
      setTitle(normalizeBoardTitle(data.title));
      setMemory(data.memory || "");
      setSaveState("idle");
    } catch (error) {
      if (requestId !== loadRequestRef.current) {
        return;
      }

      console.error("Failed to load workspace:", error);
      onLoadErrorRef.current?.();
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoadingWorkspace(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!spaceKey) return;
    void loadWorkspace(spaceKey);
  }, [loadWorkspace, spaceKey]);

  useEffect(() => {
    if (!spaceKey || loadingWorkspace) return;

    if (hydrationRef.current) {
      hydrationRef.current = false;
      return;
    }

    const seq = ++saveSeqRef.current;
    const targetSpaceKey = spaceKey;
    setSaveState("saving");

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

        if (!res.ok) {
          throw new Error(data.error || "Failed to save");
        }

        if (seq === saveSeqRef.current && targetSpaceKey === activeSpaceRef.current) {
          setWorkspace(data);
          setSaveState("saved");
        }
      } catch (error) {
        console.error("Failed to save workspace:", error);
        if (seq === saveSeqRef.current && targetSpaceKey === activeSpaceRef.current) {
          setSaveState("error");
        }
      }
    }, 550);

    return () => clearTimeout(timeout);
  }, [loadingWorkspace, memory, spaceKey, title]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timeout = setTimeout(() => setSaveState("idle"), 1200);
    return () => clearTimeout(timeout);
  }, [saveState]);

  const resetWorkspace = useCallback(() => {
    hydrationRef.current = true;
    setWorkspace(null);
    setTitle(DEFAULT_SPACE_TITLE);
    setMemory("");
    setLoadingWorkspace(true);
    setSaveState("idle");
  }, []);

  return {
    loadingWorkspace,
    memory,
    resetWorkspace,
    saveState,
    setMemory,
    setTitle,
    title,
    workspace,
  };
}
