"use client";

import { APP_NAME } from "@/lib/ai-config";

interface HeaderProps {
  title?: string;
}

export default function Header({ title = APP_NAME }: HeaderProps) {
  return (
    <header className="mb-10 animate-fadeDown relative overflow-visible">
      <div className="relative max-w-[44rem]">
        <div className="pointer-events-none absolute -left-6 -top-8 h-28 w-28 rounded-full bg-accent/12 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute left-[18rem] top-8 h-2.5 w-2.5 rounded-full bg-accent/85 shadow-[0_0_18px_rgba(var(--accent-rgb),0.55)]" aria-hidden />
        <div className="pointer-events-none absolute left-[24rem] top-20 h-1.5 w-1.5 rounded-full bg-[rgba(var(--blob-b-rgb),0.8)]" aria-hidden />

        <h1 className="relative font-syne text-[clamp(3.7rem,10vw,6.7rem)] font-extrabold leading-[0.9] tracking-[-0.05em] text-textPrimary [text-shadow:0_0_32px_rgba(var(--accent-rgb),0.12)]">
          {title}
        </h1>
        <p className="relative mt-5 max-w-[33rem] text-[15px] font-dm text-muted/85 leading-relaxed">
          Keep the list clear. Keep the day moving.
        </p>
      </div>
    </header>
  );
}
