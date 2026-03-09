import type { Metadata } from "next";
import { APP_NAME } from "@/lib/ai-config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — Mood-Driven AI Task Board`,
  description: `${APP_NAME} is a personal AI task board with animated themes, persistent notes, and Gemini fallback.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="bg-bg text-textPrimary antialiased">{children}</body>
    </html>
  );
}
