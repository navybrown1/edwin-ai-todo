"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SPACE_TITLE } from "@/lib/ai-config";
import { fetchJson, normalizeBoardTitle, withSpaceKey, workspaceHasContent } from "@/lib/client-utils";
import { loadLocalWorkspace, saveLocalWorkspace } from "@/lib/local-store";
import type { Workspace } from "@/types";

type WorkspaceSaveState = "idle" | "saving" | "saved" | "error" | "local";

interface UseWorkspaceOptions {
  onLoadError?: () => void;
}

function mergeWorkspaceSnapshot(remoteWorkspace: Workspace, localWorkspace: Workspace) {
  if (!workspaceHasContent(localWorkspace) || workspaceHasContent(remoteWorkspace)) {
    return remoteWorkspace;
  }

  return {
    ...remoteWorkspace,
    memory: localWorkspace.memory,
    title: localWorkspace.title,
  };
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

  const loadWorkspace = useCallback(
    async (nextSpaceKey: string) => {
      setLoadingWorkspace(true);
      const localWorkspace = loadLocalWorkspace(nextSpaceKey);

      try {
        const remoteWorkspace = await fetchJson<Workspace>(withSpaceKey("/api/space", nextSpaceKey), {
          cache: "no-store",
        });
        const mergedWorkspace = mergeWorkspaceSnapshot(remoteWorkspace, localWorkspace);
        const resolvedWorkspace =
          mergedWorkspace === remoteWorkspace
            ? remoteWorkspace
            : await fetchJson<Workspace>("/api/space", {
                body: JSON.stringify({
                  memory: mergedWorkspace.memory,
                  spaceKey: nextSpaceKey,
                  title: mergedWorkspace.title,
                }),
                headers: {
                  "Content-Type": "application/json",
                },
                method: "PATCH",
              });

        hydrationRef.current = true;
        saveLocalWorkspace(nextSpaceKey, {
          memory: resolvedWorkspace.memory,
          title: resolvedWorkspace.title,
        });
        setWorkspace(resolvedWorkspace);
        setTitle(normalizeBoardTitle(resolvedWorkspace.title));
        setMemory(resolvedWorkspace.memory || "");
        setSaveState("idle");
      } catch (error) {
        console.error("Falling back to local workspace storage:", error);
        hydrationRef.current = true;
        setWorkspace(localWorkspace);
        setTitle(normalizeBoardTitle(localWorkspace.title));
        setMemory(localWorkspace.memory || "");
        setSaveState("local");
        onLoadError?.();
      } finally {
        setLoadingWorkspace(false);
      }
    },
    [onLoadError],
  );

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
    const nextTitle = title;
    const nextMemory = memory;
    setSaveState("saving");

    const timeout = setTimeout(async () => {
      const localWorkspace = saveLocalWorkspace(targetSpaceKey, {
        memory: nextMemory,
        title: nextTitle,
      });

      try {
        const nextWorkspace = await fetchJson<Workspace>("/api/space", {
          body: JSON.stringify({
            memory: nextMemory,
            spaceKey: targetSpaceKey,
            title: nextTitle,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "PATCH",
        });

        if (seq === saveSeqRef.current && targetSpaceKey === activeSpaceRef.current) {
          saveLocalWorkspace(targetSpaceKey, {
            memory: nextWorkspace.memory,
            title: nextWorkspace.title,
          });
          setWorkspace(nextWorkspace);
          setSaveState("saved");
        }
      } catch (error) {
        console.error("Saving workspace locally because cloud sync failed:", error);
        if (seq === saveSeqRef.current && targetSpaceKey === activeSpaceRef.current) {
          setWorkspace(localWorkspace);
          setSaveState("local");
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
