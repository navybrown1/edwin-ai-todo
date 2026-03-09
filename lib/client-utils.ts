import { DEFAULT_SPACE_TITLE, getModelLabel } from "@/lib/ai-config";
import type { AiResponseMeta, Workspace } from "@/types";

export function withSpaceKey(path: string, spaceKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}spaceKey=${encodeURIComponent(spaceKey)}`;
}

export function normalizeBoardTitle(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "Nova Space" || trimmed === "Orbit Board" || trimmed === "Above Board") return DEFAULT_SPACE_TITLE;
  return trimmed;
}

export function workspaceHasContent(workspace?: Pick<Workspace, "title" | "memory"> | null) {
  if (!workspace) {
    return false;
  }

  return normalizeBoardTitle(workspace.title) !== DEFAULT_SPACE_TITLE || Boolean(workspace.memory?.trim());
}

function fallbackErrorMessage(status: number) {
  if (status >= 500) return "The server could not complete the request.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 401) return "The request was not authorized.";
  if (status === 400) return "The request was invalid.";
  return "The request failed.";
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const raw = await response.text();

  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : typeof parsed === "string" && parsed.trim()
          ? parsed
          : fallbackErrorMessage(response.status);
    throw new Error(message);
  }

  return parsed as T;
}

export function describeAiUsage(meta: AiResponseMeta) {
  if (!meta.fallbackUsed) {
    return getModelLabel(meta.model);
  }

  return `${meta.attemptedModels.map(getModelLabel).join(" -> ")}`;
}
