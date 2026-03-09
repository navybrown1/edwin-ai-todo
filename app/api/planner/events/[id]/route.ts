import { NextResponse } from "next/server";
import { deletePlannerEvent, updatePlannerEvent } from "@/lib/planner-db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const spaceKey = sanitizeSpaceKey(body.spaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const event = await updatePlannerEvent(params.id, spaceKey, {
      color: typeof body.color === "string" ? body.color : undefined,
      date: typeof body.date === "string" ? body.date : undefined,
      scheduledAt: typeof body.scheduledAt === "string" || body.scheduledAt === null ? body.scheduledAt : undefined,
      text: typeof body.text === "string" ? body.text : undefined,
      time: typeof body.time === "string" || body.time === null ? body.time : undefined,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("PATCH /api/planner/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to update planner event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    await deletePlannerEvent(params.id, spaceKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/planner/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete planner event" }, { status: 500 });
  }
}
