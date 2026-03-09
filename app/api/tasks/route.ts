import { NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";

export async function GET() {
  try {
    const tasks = await getAllTasks();
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { text, cat } = await req.json();
    if (!text?.trim() || !cat?.trim()) {
      return NextResponse.json({ error: "text and cat are required" }, { status: 400 });
    }
    const task = await createTask(text.trim(), cat.trim());
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
