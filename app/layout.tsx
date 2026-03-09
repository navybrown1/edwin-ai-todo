import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nova — AI Task Manager",
  description: "AI-powered task manager with natural language input, smart categorization, and daily briefings.",
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
