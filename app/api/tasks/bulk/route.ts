import { NextResponse } from "next/server";
import { createTasksBulk, deleteTasksBulk, setTasksDoneBulk } from "@/lib/db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

function normalizeTaskIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [...new Set(ids.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
}

export async function POST(req: Request) {
  try {
    const { tasks, spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    const normalizedTasks = Array.isArray(tasks)
      ? tasks
          .map((task) => ({
            text: typeof task?.text === "string" ? task.text.trim() : "",
            cat: typeof task?.cat === "string" ? task.cat.trim() : "",
          }))
          .filter((task) => task.text && task.cat)
      : [];

    if (!spaceKey || normalizedTasks.length === 0) {
      return NextResponse.json({ error: "spaceKey and at least one valid task are required" }, { status: 400 });
    }

    const createdTasks = await createTasksBulk(spaceKey, normalizedTasks);
    return NextResponse.json(createdTasks, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks/bulk error:", err);
    return NextResponse.json({ error: "Failed to create tasks" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { ids, done, spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);
    const taskIds = normalizeTaskIds(ids);

    if (!spaceKey || taskIds.length === 0 || typeof done !== "boolean") {
      return NextResponse.json({ error: "spaceKey, ids, and done are required" }, { status: 400 });
    }

    const updatedTasks = await setTasksDoneBulk(spaceKey, taskIds, done);
    return NextResponse.json(updatedTasks);
  } catch (err) {
    console.error("PATCH /api/tasks/bulk error:", err);
    return NextResponse.json({ error: "Failed to update tasks" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { ids, spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);
    const taskIds = normalizeTaskIds(ids);

    if (!spaceKey || taskIds.length === 0) {
      return NextResponse.json({ error: "spaceKey and ids are required" }, { status: 400 });
    }

    const deletedCount = await deleteTasksBulk(spaceKey, taskIds);
    return NextResponse.json({ success: true, deletedCount });
  } catch (err) {
    console.error("DELETE /api/tasks/bulk error:", err);
    return NextResponse.json({ error: "Failed to delete tasks" }, { status: 500 });
  }
}
