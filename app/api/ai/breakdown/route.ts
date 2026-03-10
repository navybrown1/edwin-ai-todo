import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "@/lib/ai-config";
import { buildFallbackMeta, fallbackBreakdownTask } from "@/lib/ai-fallbacks";
import { generateGeminiText } from "@/lib/gemini";
import type { GeminiModelId } from "@/types";

export async function POST(req: Request) {
  const { task, category, primaryModel } = await req.json();
  if (!task?.trim()) {
    return NextResponse.json({ error: "task is required" }, { status: 400 });
  }

  const preferredModel = GEMINI_MODELS.some((model) => model.id === primaryModel)
    ? (primaryModel as GeminiModelId)
    : DEFAULT_GEMINI_MODEL;

  try {
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
    console.error("AI breakdown error:", err);
    return NextResponse.json({
      meta: buildFallbackMeta(preferredModel),
      steps: fallbackBreakdownTask(task, category),
    });
  }
}
