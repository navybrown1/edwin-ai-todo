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
