import { DEFAULT_GEMINI_MODEL } from "@/lib/ai-config";
import { CATEGORY_VALUES } from "@/lib/categories";
import type { AiResponseMeta, GeminiModelId, ParsedTask, Task } from "@/types";

const CATEGORY_RULES: Array<{ category: string; keywords: string[] }> = [
  { category: "💰 Financial", keywords: ["pay", "bill", "invoice", "bank", "budget", "tax", "money", "rent", "refund"] },
  { category: "⚖️ Legal", keywords: ["lawyer", "court", "legal", "contract", "license", "permit", "custody", "case"] },
  { category: "👨‍👩‍👦 Family & Kids", keywords: ["kid", "kids", "family", "wife", "husband", "son", "daughter", "parent", "school pickup"] },
  { category: "🏫 School", keywords: ["class", "study", "assignment", "homework", "exam", "professor", "course", "campus"] },
  { category: "💼 Career", keywords: ["work", "career", "job", "meeting", "client", "proposal", "resume", "interview"] },
  { category: "🏋️ Health", keywords: ["doctor", "dentist", "therapy", "health", "med", "medicine", "workout", "gym", "appointment"] },
  { category: "🔧 Errands", keywords: ["buy", "pick up", "pickup", "drop off", "mail", "store", "errand", "clean", "repair"] },
  { category: "💻 Tech & Projects", keywords: ["code", "deploy", "bug", "fix", "project", "build", "app", "website", "server"] },
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function cleanTaskText(value: string) {
  const trimmed = value
    .trim()
    .replace(/^[\-\*\d\.\)\s]+/, "")
    .replace(/[,\.;:\s]+$/, "");

  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function stripEmojiPrefix(category: string) {
  return category.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function pickQuickWins(tasks: Task[]) {
  const sorted = [...tasks].sort((left, right) => left.text.length - right.text.length);
  return sorted.slice(0, Math.min(3, sorted.length));
}

function topPriorityReason(task: Task) {
  const text = normalizeText(task.text);
  if (/(today|tonight|asap|urgent|deadline|due)/.test(text)) {
    return "It has clear urgency, so knocking it out early protects the rest of the day.";
  }
  if (/(pay|bill|invoice|rent|tax)/.test(text)) {
    return "Closing the loop here removes financial drag and keeps the basics handled.";
  }
  if (/(call|email|text|reply|schedule|book)/.test(text)) {
    return "It unlocks follow-up and keeps small obligations from lingering.";
  }
  if (/(doctor|dentist|appointment|health|therapy|med)/.test(text)) {
    return "Health-related tasks are easier when handled before the day gets crowded.";
  }
  return "It moves a real obligation forward and gives the day a cleaner backbone.";
}

function defaultBreakdown(task: string) {
  return [
    `Clarify the outcome for ${task}`,
    "Gather the needed details",
    "Do the first concrete action",
    "Confirm the next follow-up",
  ];
}

export function buildFallbackMeta(primaryModel?: GeminiModelId): AiResponseMeta {
  const model = primaryModel ?? DEFAULT_GEMINI_MODEL;
  return {
    attemptedModels: [model],
    fallbackUsed: true,
    model,
  };
}

export function fallbackCategorizeTask(text: string) {
  const normalized = normalizeText(text);
  const scored = CATEGORY_RULES.map((rule) => ({
    category: rule.category,
    score: rule.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0),
  }));

  const best = scored.sort((left, right) => right.score - left.score)[0];
  if (!best || best.score === 0) {
    return CATEGORY_VALUES[0];
  }

  return best.category;
}

export function fallbackParseTasks(text: string): ParsedTask[] {
  const fragments = text
    .replace(/\r/g, "\n")
    .replace(/\band then\b/gi, "\n")
    .replace(/\bthen\b/gi, "\n")
    .replace(/\balso\b/gi, "\n")
    .replace(/\sand\s(?=(pay|call|email|text|buy|pick|drop|schedule|book|send|finish|review|update|fix|submit|clean|write|plan|go|get|take|make)\b)/gi, "\n")
    .replace(/;/g, "\n")
    .split(/\n+/)
    .map(cleanTaskText)
    .filter(Boolean);

  const tasks = (fragments.length ? fragments : [cleanTaskText(text)]).filter(Boolean);

  return tasks.map((taskText) => ({
    cat: fallbackCategorizeTask(taskText),
    text: taskText,
  }));
}

export function fallbackBreakdownTask(task: string, category?: string) {
  const cleanTask = cleanTaskText(task) || "this task";
  const label = stripEmojiPrefix(category ?? "");

  if (label.includes("Financial")) {
    return [
      "Open the bill or account",
      "Confirm the amount due",
      "Pay or schedule the payment",
      "Save the confirmation",
    ];
  }

  if (label.includes("Health")) {
    return [
      "Find the office or portal",
      "Book or confirm the visit",
      "Add the date to the board",
      "Write down what to bring",
    ];
  }

  if (label.includes("Family")) {
    return [
      "Confirm who is involved",
      "Lock the date or plan",
      "Handle the key prep step",
      "Send the follow-up message",
    ];
  }

  if (label.includes("School")) {
    return [
      "Check the exact requirement",
      "Gather the needed materials",
      "Do the first focused block",
      "Submit or schedule the next block",
    ];
  }

  if (label.includes("Tech")) {
    return [
      "Define the specific fix",
      "Open the relevant file or tool",
      "Make the first safe change",
      "Test the result",
    ];
  }

  if (label.includes("Errands")) {
    return [
      "List what you need",
      "Choose the stop or route",
      "Handle the errand",
      "Mark it done on the board",
    ];
  }

  return defaultBreakdown(cleanTask);
}

export function fallbackBriefing(tasks: Task[], memory?: string) {
  const pending = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

  if (!pending.length) {
    return "**Today's Top Priorities**\n* Clear board. Use the next free block to choose one meaningful move.\n\n**Quick Wins**\n* Capture the next task before it slips.\n\n**Motivational Note**\nThe board is clear. Keep it intentional.";
  }

  const priorities = pending.slice(0, Math.min(3, pending.length));
  const quickWins = pickQuickWins(pending);
  const memoryNote = memory?.trim();

  return [
    "**Today's Top Priorities**",
    ...priorities.map((task) => `* **[${stripEmojiPrefix(task.cat)}] ${task.text}**: ${topPriorityReason(task)}`),
    "",
    "**Quick Wins**",
    ...quickWins.map((task) => `* ${task.text}`),
    "",
    "**Motivational Note**",
    memoryNote
      ? `Keep this in view: ${memoryNote.slice(0, 120)}${memoryNote.length > 120 ? "..." : ""}`
      : done.length
        ? "You already have momentum. Protect the next important move and keep going."
        : "Start with the first must-do, then let the rest of the board fall into place.",
  ].join("\n");
}
