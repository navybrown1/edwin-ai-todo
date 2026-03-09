import { NextResponse } from "next/server";
import { createPlannerEvent, createPlannerEventsBulk, getPlannerEvents } from "@/lib/planner-db";
import { sanitizeSpaceKey } from "@/lib/space-utils";
import type { PlannerEventInput } from "@/types";

export const dynamic = "force-dynamic";

function normalizeEventInput(input: Partial<PlannerEventInput>): PlannerEventInput | null {
  if (!input.date || !input.text || !input.color) {
    return null;
  }

  return {
    calendarId: typeof input.calendarId === "string" ? input.calendarId : null,
    color: input.color,
    date: input.date,
    externalId: typeof input.externalId === "string" ? input.externalId : null,
    scheduledAt: typeof input.scheduledAt === "string" || input.scheduledAt === null ? input.scheduledAt : null,
    source: input.source === "google" ? "google" : "manual",
    text: input.text,
    time: typeof input.time === "string" ? input.time : undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    return NextResponse.json(await getPlannerEvents(spaceKey));
  } catch (error) {
    console.error("GET /api/planner/events error:", error);
    return NextResponse.json({ error: "Failed to load planner events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const spaceKey = sanitizeSpaceKey(body.spaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    if (Array.isArray(body.events)) {
      const events = body.events.map(normalizeEventInput).filter(Boolean) as PlannerEventInput[];
      return NextResponse.json(await createPlannerEventsBulk(spaceKey, events), { status: 201 });
    }

    const event = normalizeEventInput(body);
    if (!event) {
      return NextResponse.json({ error: "date, text, and color are required" }, { status: 400 });
    }

    return NextResponse.json(await createPlannerEvent(spaceKey, event), { status: 201 });
  } catch (error) {
    console.error("POST /api/planner/events error:", error);
    return NextResponse.json({ error: "Failed to create planner event" }, { status: 500 });
  }
}
