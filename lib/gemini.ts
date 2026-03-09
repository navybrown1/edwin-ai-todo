import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEFAULT_GEMINI_MODEL, GEMINI_MODELS } from "@/lib/ai-config";
import type { AiResponseMeta, GeminiModelId } from "@/types";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function shouldRetryWithFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return [
    "429",
    "500",
    "503",
    "quota",
    "rate",
    "resource_exhausted",
    "deadline",
    "timed out",
    "unavailable",
    "internal",
  ].some((token) => message.includes(token));
}

function getModelOrder(primaryModel: GeminiModelId): GeminiModelId[] {
  return [
    primaryModel,
    ...GEMINI_MODELS.map((model) => model.id).filter((modelId) => modelId !== primaryModel),
  ];
}

export async function generateGeminiText(
  prompt: string,
  options?: {
    primaryModel?: GeminiModelId;
  },
): Promise<{ text: string; meta: AiResponseMeta }> {
  if (!genAI) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const primaryModel = options?.primaryModel ?? DEFAULT_GEMINI_MODEL;
  const attemptedModels: GeminiModelId[] = [];
  let lastError: unknown;

  for (const modelId of getModelOrder(primaryModel)) {
    attemptedModels.push(modelId);

    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);

      return {
        text: result.response.text().trim(),
        meta: {
          model: modelId,
          attemptedModels,
          fallbackUsed: attemptedModels.length > 1,
        },
      };
    } catch (error) {
      lastError = error;
      if (!shouldRetryWithFallback(error)) {
        break;
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Gemini request failed after ${attemptedModels.join(" -> ")}: ${reason}`);
}
