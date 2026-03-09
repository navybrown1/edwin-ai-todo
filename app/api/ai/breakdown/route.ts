import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "@/lib/ai-config";
import { generateGeminiText } from "@/lib/gemini";
import type { GeminiModelId } from "@/types";

export async function POST(req: Request) {
  try {
    const { task, category, primaryModel } = await req.json();
    if (!task?.trim()) {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const prompt = `Break down this task into 3-5 concrete, actionable sub-steps.

Task: "${task}"
Category: ${category}

Return ONLY a JSON array of strings (the sub-step descriptions), no markdown, no explanation:
["Step 1 description", "Step 2 description", ...]

Rules:
- Each step must be specific and immediately actionable
- Steps should be in logical order
- Keep each step under 10 words
- 3 to 5 steps maximum`;

    const preferredModel = GEMINI_MODELS.some((model) => model.id === primaryModel)
      ? (primaryModel as GeminiModelId)
      : DEFAULT_GEMINI_MODEL;

    const { text: raw, meta } = await generateGeminiText(prompt, {
      primaryModel: preferredModel,
    });

    // Robustly extract JSON array from anywhere in the response
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array in response");
    const steps = JSON.parse(raw.substring(start, end + 1));
    if (!Array.isArray(steps)) throw new Error("Expected array");

    return NextResponse.json({ steps, meta });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
    console.error("AI breakdown error:", err);
    return NextResponse.json(
      { error: isRateLimit ? "Rate limited — wait 30s and retry" : "Failed to break down task" },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
