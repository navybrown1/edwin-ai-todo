import { sql } from "@vercel/postgres";
import type { Task, Subtask } from "@/types";

export async function getAllTasks(): Promise<Task[]> {
  const { rows } = await sql<Task>`
    SELECT id, text, cat, done, created_at
    FROM tasks
    ORDER BY created_at ASC
  `;
  return rows;
}

export async function getTaskWithSubtasks(id: number): Promise<Task | null> {
  const { rows } = await sql<Task>`
    SELECT id, text, cat, done, created_at FROM tasks WHERE id = ${id}
  `;
  if (!rows[0]) return null;
  const task = rows[0];
  const { rows: subtasks } = await sql<Subtask>`
    SELECT id, task_id, text, done FROM subtasks WHERE task_id = ${id} ORDER BY id ASC
  `;
  return { ...task, subtasks };
}

export async function createTask(text: string, cat: string): Promise<Task> {
  const { rows } = await sql<Task>`
    INSERT INTO tasks (text, cat, done)
    VALUES (${text}, ${cat}, false)
    RETURNING id, text, cat, done, created_at
  `;
  return rows[0];
}

export async function updateTask(
  id: number,
  fields: Partial<{ done: boolean; text: string; cat: string }>
): Promise<Task> {
  const { done, text, cat } = fields;
  if (done !== undefined && text !== undefined && cat !== undefined) {
    const { rows } = await sql<Task>`
      UPDATE tasks SET done = ${done}, text = ${text}, cat = ${cat}
      WHERE id = ${id} RETURNING id, text, cat, done, created_at
    `;
    return rows[0];
  }
  if (done !== undefined) {
    const { rows } = await sql<Task>`
      UPDATE tasks SET done = ${done} WHERE id = ${id}
      RETURNING id, text, cat, done, created_at
    `;
    return rows[0];
  }
  if (text !== undefined && cat !== undefined) {
    const { rows } = await sql<Task>`
      UPDATE tasks SET text = ${text}, cat = ${cat} WHERE id = ${id}
      RETURNING id, text, cat, done, created_at
    `;
    return rows[0];
  }
  throw new Error("No valid fields to update");
}

export async function deleteTask(id: number): Promise<void> {
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function createSubtask(taskId: number, text: string): Promise<Subtask> {
  const { rows } = await sql<Subtask>`
    INSERT INTO subtasks (task_id, text, done)
    VALUES (${taskId}, ${text}, false)
    RETURNING id, task_id, text, done
  `;
  return rows[0];
}

export async function updateSubtask(id: number, done: boolean): Promise<Subtask> {
  const { rows } = await sql<Subtask>`
    UPDATE subtasks SET done = ${done} WHERE id = ${id}
    RETURNING id, task_id, text, done
  `;
  return rows[0];
}

export async function getSubtasksForTask(taskId: number): Promise<Subtask[]> {
  const { rows } = await sql<Subtask>`
    SELECT id, task_id, text, done FROM subtasks WHERE task_id = ${taskId} ORDER BY id ASC
  `;
  return rows;
}
