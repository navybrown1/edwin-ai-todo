import { sql } from "@vercel/postgres";
import { DEFAULT_SPACE_TITLE } from "@/lib/ai-config";
import type { Task, Subtask, Workspace } from "@/types";

type TaskRow = Omit<Task, "subtasks">;

let schemaPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS spaces (
          id SERIAL PRIMARY KEY,
          space_key VARCHAR(64) UNIQUE NOT NULL,
          title VARCHAR(120) NOT NULL DEFAULT 'Above Board',
          memory TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          space_key VARCHAR(64) NOT NULL DEFAULT 'default',
          text TEXT NOT NULL,
          cat VARCHAR(150) NOT NULL,
          done BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS subtasks (
          id SERIAL PRIMARY KEY,
          task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
          text TEXT NOT NULL,
          done BOOLEAN DEFAULT FALSE
        )
      `;

      await sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS space_key VARCHAR(64) NOT NULL DEFAULT 'default'`;
      await sql`ALTER TABLE spaces ADD COLUMN IF NOT EXISTS title VARCHAR(120) NOT NULL DEFAULT 'Above Board'`;
      await sql`ALTER TABLE spaces ALTER COLUMN title SET DEFAULT 'Above Board'`;
      await sql`ALTER TABLE spaces ADD COLUMN IF NOT EXISTS memory TEXT NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE spaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;

      await sql`
        INSERT INTO spaces (space_key, title, memory)
        VALUES ('default', 'Above Board', '')
        ON CONFLICT (space_key) DO NOTHING
      `;

      await sql`CREATE INDEX IF NOT EXISTS idx_tasks_space_key_created_at ON tasks (space_key, created_at ASC, id ASC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks (task_id, id ASC)`;
    })();
  }

  await schemaPromise;
}

function withSubtasks(tasks: TaskRow[], subtasks: Subtask[]): Task[] {
  const subtasksByTask = new Map<number, Subtask[]>();

  for (const subtask of subtasks) {
    const bucket = subtasksByTask.get(subtask.task_id) ?? [];
    bucket.push(subtask);
    subtasksByTask.set(subtask.task_id, bucket);
  }

  return tasks.map((task) => ({
    ...task,
    subtasks: subtasksByTask.get(task.id) ?? [],
  }));
}

async function ensureSpace(spaceKey: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO spaces (space_key, title, memory)
    VALUES (${spaceKey}, ${DEFAULT_SPACE_TITLE}, '')
    ON CONFLICT (space_key) DO NOTHING
  `;
}

async function assertTaskInSpace(taskId: number, spaceKey: string): Promise<void> {
  await ensureSchema();
  const result = await sql`
    SELECT 1 FROM tasks
    WHERE id = ${taskId} AND space_key = ${spaceKey}
    LIMIT 1
  `;

  if (result.rowCount === 0) {
    throw new Error("Task not found in this space");
  }
}

export async function getSpace(spaceKey: string): Promise<Workspace> {
  await ensureSpace(spaceKey);
  const { rows } = await sql<Workspace>`
    SELECT
      space_key AS "spaceKey",
      title,
      memory,
      created_at,
      updated_at
    FROM spaces
    WHERE space_key = ${spaceKey}
    LIMIT 1
  `;

  return rows[0];
}

export async function updateSpace(
  spaceKey: string,
  fields: Partial<Pick<Workspace, "title" | "memory">>,
): Promise<Workspace> {
  await ensureSpace(spaceKey);

  const title = fields.title?.trim();
  const memory = fields.memory;

  if (title !== undefined && memory !== undefined) {
    const { rows } = await sql<Workspace>`
      UPDATE spaces
      SET title = ${title || DEFAULT_SPACE_TITLE}, memory = ${memory}, updated_at = NOW()
      WHERE space_key = ${spaceKey}
      RETURNING
        space_key AS "spaceKey",
        title,
        memory,
        created_at,
        updated_at
    `;
    return rows[0];
  }

  if (title !== undefined) {
    const { rows } = await sql<Workspace>`
      UPDATE spaces
      SET title = ${title || DEFAULT_SPACE_TITLE}, updated_at = NOW()
      WHERE space_key = ${spaceKey}
      RETURNING
        space_key AS "spaceKey",
        title,
        memory,
        created_at,
        updated_at
    `;
    return rows[0];
  }

  if (memory !== undefined) {
    const { rows } = await sql<Workspace>`
      UPDATE spaces
      SET memory = ${memory}, updated_at = NOW()
      WHERE space_key = ${spaceKey}
      RETURNING
        space_key AS "spaceKey",
        title,
        memory,
        created_at,
        updated_at
    `;
    return rows[0];
  }

  return getSpace(spaceKey);
}

export async function getAllTasks(spaceKey: string): Promise<Task[]> {
  await ensureSpace(spaceKey);

  const { rows: tasks } = await sql<TaskRow>`
    SELECT id, text, cat, done, created_at
    FROM tasks
    WHERE space_key = ${spaceKey}
    ORDER BY created_at ASC, id ASC
  `;

  if (tasks.length === 0) {
    return [];
  }

  const { rows: subtasks } = await sql<Subtask>`
    SELECT s.id, s.task_id, s.text, s.done
    FROM subtasks s
    INNER JOIN tasks t ON t.id = s.task_id
    WHERE t.space_key = ${spaceKey}
    ORDER BY s.id ASC
  `;

  return withSubtasks(tasks, subtasks);
}

export async function getTaskCount(spaceKey: string): Promise<number> {
  await ensureSpace(spaceKey);

  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM tasks
    WHERE space_key = ${spaceKey}
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function getTaskWithSubtasks(id: number, spaceKey: string): Promise<Task | null> {
  await ensureSpace(spaceKey);

  const { rows } = await sql<TaskRow>`
    SELECT id, text, cat, done, created_at
    FROM tasks
    WHERE id = ${id} AND space_key = ${spaceKey}
    LIMIT 1
  `;

  if (!rows[0]) return null;

  const { rows: subtasks } = await sql<Subtask>`
    SELECT s.id, s.task_id, s.text, s.done
    FROM subtasks s
    INNER JOIN tasks t ON t.id = s.task_id
    WHERE s.task_id = ${id} AND t.space_key = ${spaceKey}
    ORDER BY s.id ASC
  `;

  return { ...rows[0], subtasks };
}

export async function createTask(spaceKey: string, text: string, cat: string): Promise<Task> {
  await ensureSpace(spaceKey);
  const { rows } = await sql<Task>`
    INSERT INTO tasks (space_key, text, cat, done)
    VALUES (${spaceKey}, ${text}, ${cat}, false)
    RETURNING id, text, cat, done, created_at
  `;

  return { ...rows[0], subtasks: [] };
}

export async function createTasksBulk(
  spaceKey: string,
  tasks: Array<{
    text: string;
    cat: string;
  }>,
): Promise<Task[]> {
  await ensureSpace(spaceKey);

  if (tasks.length === 0) {
    return [];
  }

  return Promise.all(tasks.map((task) => createTask(spaceKey, task.text, task.cat)));
}

export async function updateTask(
  id: number,
  spaceKey: string,
  fields: Partial<{ done: boolean; text: string; cat: string }>,
): Promise<Task> {
  await ensureSpace(spaceKey);
  const { done, text, cat } = fields;

  if (done !== undefined && text !== undefined && cat !== undefined) {
    const { rows } = await sql<Task>`
      UPDATE tasks
      SET done = ${done}, text = ${text}, cat = ${cat}
      WHERE id = ${id} AND space_key = ${spaceKey}
      RETURNING id, text, cat, done, created_at
    `;
    if (!rows[0]) throw new Error("Task not found");
    return rows[0];
  }

  if (done !== undefined) {
    const { rows } = await sql<Task>`
      UPDATE tasks
      SET done = ${done}
      WHERE id = ${id} AND space_key = ${spaceKey}
      RETURNING id, text, cat, done, created_at
    `;
    if (!rows[0]) throw new Error("Task not found");
    return rows[0];
  }

  if (text !== undefined && cat !== undefined) {
    const { rows } = await sql<Task>`
      UPDATE tasks
      SET text = ${text}, cat = ${cat}
      WHERE id = ${id} AND space_key = ${spaceKey}
      RETURNING id, text, cat, done, created_at
    `;
    if (!rows[0]) throw new Error("Task not found");
    return rows[0];
  }

  throw new Error("No valid fields to update");
}

export async function deleteTask(id: number, spaceKey: string): Promise<void> {
  await ensureSpace(spaceKey);
  await sql`DELETE FROM tasks WHERE id = ${id} AND space_key = ${spaceKey}`;
}

export async function setTasksDoneBulk(spaceKey: string, taskIds: number[], done: boolean): Promise<Task[]> {
  await ensureSpace(spaceKey);

  if (taskIds.length === 0) {
    return [];
  }

  return Promise.all(taskIds.map((taskId) => updateTask(taskId, spaceKey, { done })));
}

export async function deleteTasksBulk(spaceKey: string, taskIds: number[]): Promise<number> {
  await ensureSpace(spaceKey);

  if (taskIds.length === 0) {
    return 0;
  }

  await Promise.all(taskIds.map((taskId) => deleteTask(taskId, spaceKey)));
  return taskIds.length;
}

export async function createSubtask(taskId: number, spaceKey: string, text: string): Promise<Subtask> {
  await assertTaskInSpace(taskId, spaceKey);

  const { rows } = await sql<Subtask>`
    INSERT INTO subtasks (task_id, text, done)
    VALUES (${taskId}, ${text}, false)
    RETURNING id, task_id, text, done
  `;

  return rows[0];
}

export async function createSubtasksBulk(taskId: number, spaceKey: string, texts: string[]): Promise<Subtask[]> {
  await assertTaskInSpace(taskId, spaceKey);

  if (texts.length === 0) {
    return [];
  }

  return Promise.all(texts.map((text) => createSubtask(taskId, spaceKey, text)));
}

export async function updateSubtask(
  taskId: number,
  subtaskId: number,
  spaceKey: string,
  done: boolean,
): Promise<Subtask> {
  await assertTaskInSpace(taskId, spaceKey);

  const { rows } = await sql<Subtask>`
    UPDATE subtasks AS s
    SET done = ${done}
    FROM tasks AS t
    WHERE
      s.id = ${subtaskId}
      AND s.task_id = ${taskId}
      AND t.id = s.task_id
      AND t.space_key = ${spaceKey}
    RETURNING s.id, s.task_id, s.text, s.done
  `;

  if (!rows[0]) {
    throw new Error("Subtask not found");
  }

  return rows[0];
}

export async function getSubtasksForTask(taskId: number, spaceKey: string): Promise<Subtask[]> {
  await assertTaskInSpace(taskId, spaceKey);

  const { rows } = await sql<Subtask>`
    SELECT s.id, s.task_id, s.text, s.done
    FROM subtasks s
    INNER JOIN tasks t ON t.id = s.task_id
    WHERE s.task_id = ${taskId} AND t.space_key = ${spaceKey}
    ORDER BY s.id ASC
  `;

  return rows;
}
