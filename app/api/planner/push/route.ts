import { NextResponse } from "next/server";
import { deletePushSubscription, upsertPushSubscription } from "@/lib/planner-db";
import { sanitizeSpaceKey } from "@/lib/space-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const spaceKey = sanitizeSpaceKey(body.spaceKey);
    const subscription = body.subscription;

    if (!spaceKey || !subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return NextResponse.json({ error: "spaceKey and a valid PushSubscription are required" }, { status: 400 });
    }

    await upsertPushSubscription({
      auth: subscription.keys.auth,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      spaceKey,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/planner/push error:", error);
    return NextResponse.json({ error: "Failed to register push subscription" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spaceKey = sanitizeSpaceKey(searchParams.get("spaceKey"));
    const endpoint = searchParams.get("endpoint");

    if (!spaceKey || !endpoint) {
      return NextResponse.json({ error: "spaceKey and endpoint are required" }, { status: 400 });
    }

    await deletePushSubscription(spaceKey, endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/planner/push error:", error);
    return NextResponse.json({ error: "Failed to remove push subscription" }, { status: 500 });
  }
}
