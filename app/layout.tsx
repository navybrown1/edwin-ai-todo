import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { APP_NAME } from "@/lib/ai-config";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

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
      <body className={`${dmSans.variable} ${syne.variable} bg-bg text-textPrimary antialiased`}>{children}</body>
    </html>
  );
}
