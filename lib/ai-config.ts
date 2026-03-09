import type { GeminiModelId, ThemeMode } from "@/types";

export const APP_NAME = "My Day Guide Pro";
export const DEFAULT_SPACE_TITLE = "My Day";
export const DEFAULT_GEMINI_MODEL: GeminiModelId = "gemini-2.5-flash";
export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export interface ThemeOption {
  id: ThemeMode;
  label: string;
  vibe: string;
  description: string;
  accent: string;
  background: string;
  gradient: string;
  tagline: string;
  plannerHint: string;
  emptyTitle: string;
  emptyBody: string;
}

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

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "dark",
    label: "Jedi",
    vibe: "Midnight focus",
    description: "Cinematic gold, deep shadows, and a calm starfighter glow.",
    accent: "#f0c040",
    background: "#080810",
    gradient: "linear-gradient(90deg, #f0c040 0%, rgba(240,192,64,0.78) 34%, #e87040 64%, #f0c040 100%)",
    tagline: "Focus. Execute. Conquer.",
    plannerHint: "Protect the next two or three must-win moves before the noise shows up.",
    emptyTitle: "Plot the next mission.",
    emptyBody: "Start with one must-win move, then let the rest queue up behind it.",
  },
  {
    id: "light",
    label: "Chill",
    vibe: "Soft daylight",
    description: "Warm paper tones, airy motion, and low-stress clarity.",
    accent: "#c76c00",
    background: "#f6efe2",
    gradient: "linear-gradient(90deg, #c76c00 0%, #b45309 34%, #db4e4a 64%, #c76c00 100%)",
    tagline: "Breathe easy. Stay on track.",
    plannerHint: "Give the day one useful errand, one steady focus block, and one real exhale.",
    emptyTitle: "Leave yourself a softer start.",
    emptyBody: "Drop in the next gentle priority and let the day stay breathable.",
  },
  {
    id: "girl",
    label: "Bubblegum",
    vibe: "Glossy candy",
    description: "Pink neon, floating bubbles, and playful pop energy.",
    accent: "#ff5ea8",
    background: "#130c18",
    gradient: "linear-gradient(90deg, #ff5ea8 0%, #ffb86b 30%, #9333ea 60%, #ff5ea8 100%)",
    tagline: "Bold plans. Zero dull energy.",
    plannerHint: "Mix the must-dos with one thing you are excited to touch so the day keeps its sparkle.",
    emptyTitle: "Make the list sparkle.",
    emptyBody: "Lead with one bold move, then pad it with quick wins that keep the momentum sweet.",
  },
  {
    id: "fun",
    label: "Party",
    vibe: "Electric motion",
    description: "Teal lights, confetti sparks, and a loud little pulse.",
    accent: "#14b8a6",
    background: "#08161d",
    gradient: "linear-gradient(90deg, #14b8a6 0%, #0ea5e9 35%, #f97316 65%, #14b8a6 100%)",
    tagline: "Turn pressure into momentum.",
    plannerHint: "Give the day a beat: one anchor event, one fast win, and one clean finish line.",
    emptyTitle: "Kick the room alive.",
    emptyBody: "Throw one big moment and two fast hits onto the board to set the pace.",
  },
];

export function getModelLabel(modelId: GeminiModelId): string {
  return GEMINI_MODELS.find((model) => model.id === modelId)?.label ?? modelId;
}

export function getThemeOption(themeMode: ThemeMode): ThemeOption {
  return THEME_OPTIONS.find((theme) => theme.id === themeMode) ?? THEME_OPTIONS[0];
}
