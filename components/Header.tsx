"use client";

import { useEffect, useState } from "react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Header() {
  const [timeLabel, setTimeLabel] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const now = new Date();
    setTimeLabel(now.toLocaleString("en-US", { month: "long", year: "numeric" }));
    setGreeting(getGreeting());
  }, []);

  return (
    <header className="mb-10 animate-fadeDown relative overflow-visible">
      {/* Floating sparkles — top right decoration */}
      <div className="absolute -top-4 right-0 pointer-events-none select-none" aria-hidden>
        <svg width="130" height="80" viewBox="0 0 130 80" fill="none">
          <circle cx="110" cy="12" r="1.5" fill="#f0c040" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.15;0.7" dur="3s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.5;2.4;1.5" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="122" cy="34" r="1" fill="#f0c040" opacity="0.45">
            <animate attributeName="opacity" values="0.45;0.9;0.45" dur="4s" begin="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="95" cy="45" r="1.8" fill="#e87040" opacity="0.35">
            <animate attributeName="opacity" values="0.35;0.8;0.35" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="80" cy="20" r="1.1" fill="#06b6d4" opacity="0.5">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" begin="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="65" cy="8" r="0.8" fill="#f0c040" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="3.5s" begin="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="45" cy="18" r="1.2" fill="#8b5cf6" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4.5s" begin="0.8s" repeatCount="indefinite" />
          </circle>
          {/* Sparkle cross — gold */}
          <g transform="translate(105, 58)">
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#f0c040" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#f0c040" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" additive="sum" repeatCount="indefinite" />
          </g>
          {/* Sparkle cross — orange */}
          <g transform="translate(125, 62)">
            <line x1="-3" y1="0" x2="3" y2="0" stroke="#e87040" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#e87040" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
            <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="5s" additive="sum" repeatCount="indefinite" />
          </g>
          {/* Sparkle cross — cyan */}
          <g transform="translate(75, 55)">
            <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#06b6d4" strokeWidth="0.8" strokeLinecap="round" opacity="0.35" />
            <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#06b6d4" strokeWidth="0.8" strokeLinecap="round" opacity="0.35" />
            <animateTransform attributeName="transform" type="rotate" from="45 0 0" to="405 0 0" dur="10s" additive="sum" repeatCount="indefinite" />
          </g>
        </svg>
      </div>

      {/* Logo + date row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Animated Nova star logo */}
        <div
          className="ai-orb w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(240,192,64,0.10)", border: "1px solid rgba(240,192,64,0.28)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              className="logo-star"
              d="M12 2L14.09 9.26L21.41 11.27L14.09 13.28L12 20.54L9.91 13.28L2.59 11.27L9.91 9.26L12 2Z"
              fill="url(#starGrad)"
            />
            <defs>
              <linearGradient id="starGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#f0c040" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-accent/55 font-dm">
          {timeLabel}
        </span>
      </div>

      {/* Title */}
      <h1 className="font-syne text-[clamp(2.2rem,6vw,3.4rem)] font-extrabold leading-none tracking-tight">
        <span className="gradient-text">Nova</span>
      </h1>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted/50 font-dm mt-1.5 mb-4">
        AI Task Manager
      </p>

      {/* Greeting */}
      <p className="text-[13px] font-dm text-muted/60 leading-relaxed">
        {greeting && <span className="text-textPrimary/50">{greeting}.</span>}{" "}
        Here&apos;s what needs your attention.
      </p>
    </header>
  );
}
