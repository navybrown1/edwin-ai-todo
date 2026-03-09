import type { GeminiModelId, ThemeMode } from "@/types";

export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-2.5-flash";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export const GEMINI_MODELS: Array<{
  id: GeminiModelId;
  label: string;
  rpm: number;
  rpd: number;
  tpm: number;
  contextWindow: string;
}> = [
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    rpm: 5,
    rpd: 100,
    tpm: 250_000,
    contextWindow: "1M tokens",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    rpm: 10,
    rpd: 250,
    tpm: 250_000,
    contextWindow: "1M tokens",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    rpm: 15,
    rpd: 1_000,
    tpm: 250_000,
    contextWindow: "1M tokens",
  },
];

export const THEME_OPTIONS: Array<{
  id: ThemeMode;
  label: string;
  accent: string;
  background: string;
}> = [
  { id: "dark", label: "Dark", accent: "#f0c040", background: "#080810" },
  { id: "light", label: "Light", accent: "#c76c00", background: "#f6efe2" },
  { id: "girl", label: "Girl", accent: "#ff5ea8", background: "#130c18" },
  { id: "fun", label: "Fun", accent: "#14b8a6", background: "#08161d" },
];

export function getModelLabel(modelId: GeminiModelId): string {
  return GEMINI_MODELS.find((model) => model.id === modelId)?.label ?? modelId;
}
