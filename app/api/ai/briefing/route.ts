import { NextResponse } from "next/server";
import { getGeminiModel } from "@/lib/gemini";
import type { Task } from "@/types";

export async function POST(req: Request) {
  try {
    const { tasks }: { tasks: Task[] } = await req.json();
    if (!tasks?.length) {
      return NextResponse.json({ briefing: "No tasks yet — add some to get your daily brief!" });
    }

    const pending = tasks.filter(t => !t.done);
    const done = tasks.filter(t => t.done);

    const taskList = pending
      .map(t => `- [${t.cat}] ${t.text}`)
      .join("\n");

    const model = getGeminiModel();
    const prompt = `You are Edwin's personal AI assistant. Generate a concise, motivational daily action brief.

Edwin's pending tasks (${pending.length} remaining, ${done.length} completed):
${taskList}

Write a focused daily brief for Edwin. Structure it with:
1. **Today's Top 3 Priorities** — pick the 3 most urgent/high-impact tasks and explain why
2. **Quick Wins** — 2-3 tasks that can be done in under 30 minutes
3. **Motivational Note** — one short sentence, personal and direct

Keep the total response under 200 words. Be direct, not generic. Use Edwin's actual task names.
Format with **bold headers** and bullet points. No emojis except where already in category names.`;

    const result = await model.generateContent(prompt);
    const briefing = result.response.text().trim();

    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("AI briefing error:", err);
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 });
  }
}
