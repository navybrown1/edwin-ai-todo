"use client";

import { useEffect, useState } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

interface HeaderProps {
  title?: string;
}

export default function Header({ title = "Nova" }: HeaderProps) {
  const [timeLabel, setTimeLabel] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const now = new Date();
    setTimeLabel(now.toLocaleString("en-US", { month: "long", year: "numeric" }));
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="mb-10 animate-fadeDown relative overflow-visible">
      <div className="absolute -top-5 right-0 pointer-events-none select-none text-accent/80" aria-hidden>
        <svg width="130" height="80" viewBox="0 0 130 80" fill="none">
          <circle cx="110" cy="12" r="1.5" fill="currentColor" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.15;0.7" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.5;2.4;1.5" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="122" cy="34" r="1" fill="currentColor" opacity="0.45">
            <animate attributeName="opacity" values="0.45;0.9;0.45" dur="4s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="95" cy="45" r="1.8" fill="rgb(var(--accent2-rgb))" opacity="0.35">
            <animate attributeName="opacity" values="0.35;0.8;0.35" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="20" r="1.1" fill="rgb(var(--blob-b-rgb))" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" begin="2s" repeatCount="indefinite" />
          </circle>
          <g transform="translate(105, 58)" className="text-accent/60">
            <line x1="-5" y1="0" x2="5" y2="0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" additive="sum" repeatCount="indefinite" />
          </g>
          <g transform="translate(125, 62)">
            <line x1="-3" y1="0" x2="3" y2="0" stroke="rgb(var(--accent2-rgb))" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="rgb(var(--accent2-rgb))" strokeWidth="0.8" strokeLinecap="round" opacity="0.45" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="5s" additive="sum" repeatCount="indefinite" />
          </g>
        </svg>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="ai-orb w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-accent"
          style={{
            background: "rgba(var(--accent-rgb),0.12)",
            border: "1px solid rgba(var(--accent-rgb),0.28)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              className="logo-star"
              d="M12 2L14.09 9.26L21.41 11.27L14.09 13.28L12 20.54L9.91 13.28L2.59 11.27L9.91 9.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-accent/70 font-dm">
          {timeLabel}
        </span>
      </div>

      <h1 className="font-syne text-[clamp(2.35rem,6vw,3.8rem)] font-extrabold leading-none tracking-tight">
        <span className="gradient-text">{title}</span>
      </h1>
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted/70 font-dm mt-2 mb-4">
        Private AI Task Space
      </p>

      <p className="max-w-[44rem] text-[13px] font-dm text-muted/80 leading-relaxed">
        {greeting && <span className="text-textPrimary/70">{greeting}.</span>} Your list stays personal to this
        recovery link, remembers your notes, and can fall back across Gemini models when limits hit.
      </p>
    </header>
  );
}
