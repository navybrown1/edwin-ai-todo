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
    const prompt = `Classify this task into exactly one category.

Task: "${text}"

Categories: ${CATEGORY_VALUES.join(", ")}

Respond with ONLY the exact category value from the list above, nothing else. No punctuation, no explanation.`;

    const result = await model.generateContent(prompt);
    const cat = result.response.text().trim();

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
      return NextResponse.json({ cat: partial || CATEGORY_VALUES[0] });
    }

    return NextResponse.json({ cat: matched });
  } catch (err) {
    console.error("AI categorize error:", err);
    return NextResponse.json({ error: "Failed to categorize" }, { status: 500 });
  }
}
