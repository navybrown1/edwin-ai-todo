import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "@/lib/ai-config";
import { generateGeminiText } from "@/lib/gemini";
import type { GeminiModelId, Task } from "@/types";

export async function POST(req: Request) {
  try {
    const {
      tasks,
      memory,
      primaryModel,
    }: {
      tasks: Task[];
      memory?: string;
      primaryModel?: GeminiModelId;
    } = await req.json();

    if (!tasks?.length) {
      return NextResponse.json({ briefing: "No tasks yet — add some to get your daily brief!" });
    }

    const pending = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);

    const taskList = pending
      .map(t => `- [${t.cat}] ${t.text}`)
      .join("\n");

    const prompt = `You are Edwin's personal AI assistant. Generate a concise, motivational daily action brief.

Edwin's pending tasks (${pending.length} remaining, ${done.length} completed):
${taskList}

Persistent workspace memory:
${memory?.trim() ? memory.trim() : "No extra memory saved."}

Write a focused daily brief for Edwin. Structure it with:
1. **Today's Top 3 Priorities** — pick the 3 most urgent/high-impact tasks and explain why
2. **Quick Wins** — 2-3 tasks that can be done in under 30 minutes
3. **Motivational Note** — one short sentence, personal and direct

Keep the total response under 200 words. Be direct, not generic. Use Edwin's actual task names.
Format with **bold headers** and bullet points. No emojis except where already in category names.`;

    const preferredModel = GEMINI_MODELS.some((model) => model.id === primaryModel)
      ? (primaryModel as GeminiModelId)
      : DEFAULT_GEMINI_MODEL;

    const { text: briefing, meta } = await generateGeminiText(prompt, {
      primaryModel: preferredModel,
    });

    return NextResponse.json({ briefing, meta });
  } catch (err) {
    console.error("AI briefing error:", err);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
