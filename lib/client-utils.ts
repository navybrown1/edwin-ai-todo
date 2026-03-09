import { DEFAULT_SPACE_TITLE, getModelLabel } from "@/lib/ai-config";
import type { AiResponseMeta } from "@/types";

export function withSpaceKey(path: string, spaceKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}spaceKey=${encodeURIComponent(spaceKey)}`;
}

export function normalizeBoardTitle(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "Nova Space" || trimmed === "Orbit Board" || trimmed === "Above Board") return DEFAULT_SPACE_TITLE;
  return trimmed;
}

export function describeAiUsage(meta: AiResponseMeta) {
  if (!meta.fallbackUsed) {
    return getModelLabel(meta.model);
  }

  return `${meta.attemptedModels.map(getModelLabel).join(" -> ")}`;
}
