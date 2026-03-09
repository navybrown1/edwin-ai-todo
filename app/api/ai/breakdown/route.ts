import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const { task, category } = await req.json();
    if (!task?.trim()) {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const model = getGeminiModel();
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

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();

    const steps = JSON.parse(cleaned);
    if (!Array.isArray(steps)) throw new Error("Expected array");

    return NextResponse.json({ steps });
  } catch (err) {
    console.error("AI breakdown error:", err);
    return NextResponse.json({ error: "Failed to break down task" }, { status: 500 });
  }
}
