import { NextResponse } from "next/server";
import { updateTask, deleteTask, getSubtasksForTask, createSubtask, updateSubtask } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await req.json();

    // Handle subtask operations
    if (body.action === "addSubtask") {
      const subtask = await createSubtask(id, body.text);
      return NextResponse.json(subtask);
    }
    if (body.action === "toggleSubtask") {
      const subtask = await updateSubtask(body.subtaskId, body.done);
      return NextResponse.json(subtask);
    }
    if (body.action === "getSubtasks") {
      const subtasks = await getSubtasksForTask(id);
      return NextResponse.json(subtasks);
    }

    // Regular task update
    const task = await updateTask(id, body);
    return NextResponse.json(task);
  } catch (err) {
    console.error("PATCH /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    await deleteTask(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
