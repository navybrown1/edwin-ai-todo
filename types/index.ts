export interface Task {
  id: number;
  text: string;
  cat: string;
  done: boolean;
  created_at?: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: number;
  task_id: number;
  text: string;
  done: boolean;
}

export interface ParsedTask {
  text: string;
  cat: string;
}

export type ThemeMode = "dark" | "light" | "girl" | "fun";
export type GeminiModelId = "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite";

export interface Workspace {
  spaceKey: string;
  title: string;
  memory: string;
  created_at?: string;
  updated_at?: string;
}

export interface AiResponseMeta {
  model: GeminiModelId;
  attemptedModels: GeminiModelId[];
  fallbackUsed: boolean;
}
