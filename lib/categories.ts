export interface Category {
  value: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { value: "💰 Financial",       label: "Financial",       emoji: "💰" },
  { value: "⚖️ Legal",           label: "Legal",           emoji: "⚖️" },
  { value: "👨‍👩‍👦 Family & Kids",   label: "Family & Kids",   emoji: "👨‍👩‍👦" },
  { value: "🏫 School",          label: "School",          emoji: "🏫" },
  { value: "💼 Career",          label: "Career",          emoji: "💼" },
  { value: "🏋️ Health",          label: "Health",          emoji: "🏋️" },
  { value: "🔧 Errands",         label: "Errands",         emoji: "🔧" },
  { value: "💻 Tech & Projects", label: "Tech & Projects", emoji: "💻" },
];

export const CATEGORY_VALUES = CATEGORIES.map(c => c.value);
