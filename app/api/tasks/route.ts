import { NextResponse } from "next/server";
import { getAllTasks, createTask } from "@/lib/db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const tasks = await getAllTasks(spaceKey);
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { text, cat, spaceKey: rawSpaceKey } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    if (!spaceKey || !text?.trim() || !cat?.trim()) {
      return NextResponse.json({ error: "spaceKey, text, and cat are required" }, { status: 400 });
    }

    const task = await createTask(spaceKey, text.trim(), cat.trim());
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
