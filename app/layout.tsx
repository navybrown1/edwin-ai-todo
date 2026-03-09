import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edwin's AI To-Do",
  description: "AI-powered personal task manager — Edwin Brown",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-textPrimary antialiased">{children}</body>
    </html>
  );
}
