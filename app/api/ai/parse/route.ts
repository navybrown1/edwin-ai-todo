import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_MODEL } from "@/lib/ai-config";
import { generateGeminiText } from "@/lib/gemini";
import { CATEGORY_VALUES } from "@/lib/categories";
import { GEMINI_MODELS } from "@/lib/ai-config";
import type { GeminiModelId } from "@/types";

export async function POST(req: Request) {
  try {
    const { text, primaryModel } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const prompt = `You are a task parser for a personal to-do app.
The user typed: "${text}"

Available categories: ${CATEGORY_VALUES.join(", ")}

Parse this into one or more distinct tasks. For each task, assign the most appropriate category from the list above.

Respond ONLY with a JSON array, no markdown, no explanation. Format:
[{"text": "Task description", "cat": "category value exactly as listed above"}, ...]

Rules:
- Split compound sentences into separate tasks if they describe different actions
- Keep task text concise and actionable
- Category must be an EXACT match from the list
- Return at least 1 task`;

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
    const tasks = JSON.parse(raw.substring(start, end + 1));
    if (!Array.isArray(tasks)) throw new Error("Expected array");

    return NextResponse.json({ tasks, meta });
  } catch (err) {
    console.error("AI parse error:", err);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
