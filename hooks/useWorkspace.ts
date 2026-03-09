"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SPACE_TITLE } from "@/lib/ai-config";
import { normalizeBoardTitle } from "@/lib/client-utils";
import { loadLocalWorkspace, saveLocalWorkspace } from "@/lib/local-store";
import type { Workspace } from "@/types";

type WorkspaceSaveState = "idle" | "saving" | "saved" | "error" | "local";

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
  const saveSeqRef = useRef(0);
  const activeSpaceRef = useRef<string | null>(spaceKey);

  useEffect(() => {
    activeSpaceRef.current = spaceKey;
  }, [spaceKey]);

  const loadWorkspace = useCallback(async (nextSpaceKey: string) => {
    setLoadingWorkspace(true);

    const nextWorkspace = loadLocalWorkspace(nextSpaceKey);
    hydrationRef.current = true;
    setWorkspace(nextWorkspace);
    setTitle(normalizeBoardTitle(nextWorkspace.title));
    setMemory(nextWorkspace.memory || "");
    setSaveState("local");
    setLoadingWorkspace(false);
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
      const nextWorkspace = saveLocalWorkspace(spaceKey, { memory, title });
      if (seq === saveSeqRef.current && targetSpaceKey === activeSpaceRef.current) {
        setWorkspace(nextWorkspace);
        setSaveState("local");
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
