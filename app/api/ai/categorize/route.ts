import { NextResponse } from "next/server";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "@/lib/ai-config";
import { CATEGORY_VALUES } from "@/lib/categories";
import { generateGeminiText } from "@/lib/gemini";
import type { GeminiModelId } from "@/types";

export async function POST(req: Request) {
  try {
    const { text, primaryModel } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const prompt = `Classify this task into exactly one category.

Task: "${text}"

Categories: ${CATEGORY_VALUES.join(", ")}

Respond with ONLY the exact category value from the list above, nothing else. No punctuation, no explanation.`;

    const preferredModel = GEMINI_MODELS.some((model) => model.id === primaryModel)
      ? (primaryModel as GeminiModelId)
      : DEFAULT_GEMINI_MODEL;

    const { text: cat, meta } = await generateGeminiText(prompt, {
      primaryModel: preferredModel,
    });

    // Validate the response is a known category
    const matched = CATEGORY_VALUES.find(
      c => c === cat || c.toLowerCase() === cat.toLowerCase()
    );

    if (!matched) {
      // Fallback: find partial match
      const partial = CATEGORY_VALUES.find(c =>
        c.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(c.toLowerCase().split(" ").pop() || "")
      );
      return NextResponse.json({ cat: partial || CATEGORY_VALUES[0], meta });
    }

    return NextResponse.json({ cat: matched, meta });
  } catch (err) {
    console.error("AI categorize error:", err);
    return NextResponse.json({ error: "Failed to categorize" }, { status: 500 });
  }
}
