import type { GeminiModelId, ThemeMode } from "@/types";

export const APP_NAME = "My Day Guide Pro";
export const DEFAULT_SPACE_TITLE = "My Day";
export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-2.5-flash";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export const GEMINI_MODELS: Array<{
  id: GeminiModelId;
  label: string;
  description: string;
}> = [
  {
    id: "gemini-2.5-pro",
    label: "Deep",
    description: "Maximum depth for long plans, richer briefs, and heavier reasoning.",
  },
  {
    id: "gemini-2.5-flash",
    label: "Everyday",
    description: "Balanced speed and quality for everyday task work.",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Quick",
    description: "Fastest fallback when the heavier models hit limits.",
  },
];

export const THEME_OPTIONS: Array<{
  id: ThemeMode;
  label: string;
  vibe: string;
  description: string;
  accent: string;
  background: string;
}> = [
  {
    id: "dark",
    label: "Jedi",
    vibe: "Midnight focus",
    description: "Cinematic gold, deep shadows, and a calm starfighter glow.",
    accent: "#f0c040",
    background: "#080810",
  },
  {
    id: "light",
    label: "Chill",
    vibe: "Soft daylight",
    description: "Warm paper tones, airy motion, and low-stress clarity.",
    accent: "#c76c00",
    background: "#f6efe2",
  },
  {
    id: "girl",
    label: "Bubblegum",
    vibe: "Glossy candy",
    description: "Pink neon, floating bubbles, and playful pop energy.",
    accent: "#ff5ea8",
    background: "#130c18",
  },
  {
    id: "fun",
    label: "Party",
    vibe: "Electric motion",
    description: "Teal lights, confetti sparks, and a loud little pulse.",
    accent: "#14b8a6",
    background: "#08161d",
  },
];

export function getModelLabel(modelId: GeminiModelId): string {
  return GEMINI_MODELS.find((model) => model.id === modelId)?.label ?? modelId;
}
