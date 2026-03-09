import { NextResponse } from "next/server";
import { updateTask, deleteTask, getSubtasksForTask, createSubtask, createSubtasksBulk, updateSubtask } from "@/lib/db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    // Handle subtask operations
    if (body.action === "addSubtask") {
      const subtask = await createSubtask(id, spaceKey, body.text);
      return NextResponse.json(subtask);
    }
    if (body.action === "addSubtasksBulk") {
      const texts = Array.isArray(body.texts) ? body.texts.filter((value: unknown): value is string => typeof value === "string") : [];
      const cleanedTexts = texts.map((text: string) => text.trim()).filter(Boolean);
      const subtasks = await createSubtasksBulk(id, spaceKey, cleanedTexts);
      return NextResponse.json(subtasks);
    }
    if (body.action === "toggleSubtask") {
      const subtask = await updateSubtask(id, body.subtaskId, spaceKey, body.done);
      return NextResponse.json(subtask);
    }
    if (body.action === "getSubtasks") {
      const subtasks = await getSubtasksForTask(id, spaceKey);
      return NextResponse.json(subtasks);
    }

    // Regular task update
    const task = await updateTask(id, spaceKey, body);
    return NextResponse.json(task);
  } catch (err) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    await deleteTask(id, spaceKey);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
