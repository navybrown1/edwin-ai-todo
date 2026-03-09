import { NextResponse } from "next/server";
import { getSpace, updateSpace } from "@/lib/db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const workspace = await getSpace(spaceKey);
    return NextResponse.json(workspace);
  } catch (err) {
    console.error("GET /api/space error:", err);
    return NextResponse.json({ error: "Failed to load space" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { spaceKey: rawSpaceKey, title, memory } = await req.json();
    const spaceKey = sanitizeSpaceKey(rawSpaceKey);

    if (!spaceKey) {
      return NextResponse.json({ error: "Valid spaceKey is required" }, { status: 400 });
    }

    const workspace = await updateSpace(spaceKey, {
      title: typeof title === "string" ? title : undefined,
      memory: typeof memory === "string" ? memory : undefined,
    });

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("PATCH /api/space error:", err);
    return NextResponse.json({ error: "Failed to update space" }, { status: 500 });
  }
}
