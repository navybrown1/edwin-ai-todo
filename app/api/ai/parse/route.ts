import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import { CATEGORY_VALUES } from "@/lib/categories";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const model = getGeminiModel();
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

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Strip any markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();

    const tasks = JSON.parse(cleaned);
    if (!Array.isArray(tasks)) throw new Error("Expected array");

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("AI parse error:", err);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
