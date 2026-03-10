"use client";

import { useEffect, useState } from "react";
import { APP_NAME, getThemeOption } from "@/lib/ai-config";
import type { ThemeMode } from "@/types";

interface HeaderProps {
  title?: string;
  themeMode?: ThemeMode;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Burning midnight oil?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Night owl mode";
}

/* ── Jedi: starfield + lightsaber glow ── */
function JediHeroSvg() {
  return (
    <svg className="header-hero-svg" viewBox="0 0 320 120" fill="none" aria-hidden="true">
      {/* starfield */}
      <circle cx="20" cy="15" r="1.2" fill="#f0c040" opacity="0.7" className="hero-twinkle" />
      <circle cx="80" cy="40" r="0.8" fill="#fff" opacity="0.5" className="hero-twinkle" style={{ animationDelay: "0.5s" }} />
      <circle cx="140" cy="10" r="1" fill="#f0c040" opacity="0.6" className="hero-twinkle" style={{ animationDelay: "1s" }} />
      <circle cx="200" cy="30" r="0.7" fill="#fff" opacity="0.4" className="hero-twinkle" style={{ animationDelay: "1.5s" }} />
      <circle cx="260" cy="18" r="1.1" fill="#f0c040" opacity="0.5" className="hero-twinkle" style={{ animationDelay: "0.8s" }} />
      <circle cx="300" cy="45" r="0.6" fill="#fff" opacity="0.6" className="hero-twinkle" style={{ animationDelay: "2s" }} />
      <circle cx="50" cy="90" r="0.9" fill="#06b6d4" opacity="0.4" className="hero-twinkle" style={{ animationDelay: "1.2s" }} />
      <circle cx="180" cy="100" r="1" fill="#8b5cf6" opacity="0.35" className="hero-twinkle" style={{ animationDelay: "0.3s" }} />
      <circle cx="310" cy="85" r="0.8" fill="#f0c040" opacity="0.5" className="hero-twinkle" style={{ animationDelay: "1.8s" }} />
      {/* lightsaber beam */}
      <rect x="155" y="55" width="3" height="45" rx="1.5" fill="url(#saberGrad)" className="mode-saber" opacity="0.8" />
      <rect x="153" y="100" width="7" height="14" rx="2" fill="#888" opacity="0.5" />
      {/* rings around a planet */}
      <ellipse cx="280" cy="70" rx="30" ry="8" stroke="#f0c040" strokeWidth="0.8" opacity="0.2" className="hero-orbit-slow" />
      <circle cx="280" cy="70" r="6" fill="#1a1a3a" stroke="#f0c040" strokeWidth="0.7" opacity="0.4" />
      <defs>
        <linearGradient id="saberGrad" x1="156" y1="55" x2="156" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0c040" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f0c040" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Chill: sun, clouds, warm rays ── */
function ChillHeroSvg() {
  return (
    <svg className="header-hero-svg" viewBox="0 0 320 120" fill="none" aria-hidden="true">
      {/* sun */}
      <circle cx="260" cy="35" r="20" fill="#c76c00" opacity="0.15" className="mode-pulse" />
      <circle cx="260" cy="35" r="12" fill="#c76c00" opacity="0.25" />
      <circle cx="260" cy="35" r="6" fill="#f59e0b" opacity="0.5" />
      {/* rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={260 + 16 * Math.cos((angle * Math.PI) / 180)}
          y1={35 + 16 * Math.sin((angle * Math.PI) / 180)}
          x2={260 + 26 * Math.cos((angle * Math.PI) / 180)}
          y2={35 + 26 * Math.sin((angle * Math.PI) / 180)}
          stroke="#c76c00"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.2"
        />
      ))}
      {/* cloud 1 */}
      <g className="mode-wave" opacity="0.2">
        <ellipse cx="60" cy="30" rx="24" ry="10" fill="#c76c00" />
        <ellipse cx="48" cy="28" rx="14" ry="9" fill="#c76c00" />
        <ellipse cx="72" cy="29" rx="16" ry="8" fill="#c76c00" />
      </g>
      {/* cloud 2 */}
      <g className="mode-wave" opacity="0.15" style={{ animationDelay: "1s" }}>
        <ellipse cx="160" cy="50" rx="20" ry="8" fill="#c76c00" />
        <ellipse cx="150" cy="48" rx="12" ry="7" fill="#c76c00" />
        <ellipse cx="172" cy="49" rx="14" ry="7" fill="#c76c00" />
      </g>
      {/* hills */}
      <path d="M0 110C40 70 100 85 160 100C220 85 280 75 320 95V120H0Z" fill="#c76c00" opacity="0.06" />
      {/* birds */}
      <path d="M40 70C43 67 46 67 49 70" stroke="#c76c00" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.25" />
      <path d="M90 55C93 52 96 52 99 55" stroke="#c76c00" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.2" />
    </svg>
  );
}

/* ── Bubblegum: floating bubbles, sparkles, candy ── */
function BubblegumHeroSvg() {
  return (
    <svg className="header-hero-svg" viewBox="0 0 320 120" fill="none" aria-hidden="true">
      {/* bubbles */}
      <circle cx="30" cy="80" r="14" stroke="#ff5ea8" strokeWidth="1" opacity="0.25" className="mode-bubble" fill="none" />
      <circle cx="30" cy="80" r="14" fill="url(#bubbleGrad1)" opacity="0.08" className="mode-bubble" />
      <circle cx="100" cy="30" r="10" stroke="#ff5ea8" strokeWidth="0.8" opacity="0.2" className="mode-bubble" style={{ animationDelay: "0.5s" }} fill="none" />
      <circle cx="200" cy="90" r="18" stroke="#ff5ea8" strokeWidth="0.8" opacity="0.15" className="mode-bubble" style={{ animationDelay: "1s" }} fill="none" />
      <circle cx="270" cy="20" r="8" stroke="#ff5ea8" strokeWidth="0.7" opacity="0.2" className="mode-bubble" style={{ animationDelay: "1.5s" }} fill="none" />
      <circle cx="150" cy="60" r="12" stroke="#9333ea" strokeWidth="0.7" opacity="0.15" className="mode-bubble" style={{ animationDelay: "0.8s" }} fill="none" />
      {/* sparkles */}
      <path d="M70 50L72 44L74 50L80 52L74 54L72 60L70 54L64 52Z" fill="#ff5ea8" opacity="0.35" className="hero-twinkle" />
      <path d="M240 60L241.5 55.5L243 60L248 61.5L243 63L241.5 68L240 63L235 61.5Z" fill="#ffb86b" opacity="0.3" className="hero-twinkle" style={{ animationDelay: "1s" }} />
      <path d="M300 90L301 87L302 90L305 91L302 92L301 95L300 92L297 91Z" fill="#9333ea" opacity="0.25" className="hero-twinkle" style={{ animationDelay: "0.6s" }} />
      {/* heart */}
      <g className="mode-tilt" opacity="0.2" style={{ transformOrigin: "305px 25px" }}>
        <path d="M305 32C305 32 298 25 298 20C298 17 300 15 303 15C305 15 305 17 305 17C305 17 305 15 307 15C310 15 312 17 312 20C312 25 305 32 305 32Z" fill="#ff5ea8" />
      </g>
      <defs>
        <radialGradient id="bubbleGrad1">
          <stop stopColor="#ff5ea8" />
          <stop offset="1" stopColor="#ff5ea8" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ── Party: confetti, disco, electric sparks ── */
function PartyHeroSvg() {
  return (
    <svg className="header-hero-svg" viewBox="0 0 320 120" fill="none" aria-hidden="true">
      {/* confetti pieces */}
      <rect x="40" y="30" width="6" height="3" rx="1" fill="#14b8a6" opacity="0.4" transform="rotate(25 40 30)" className="mode-tilt" />
      <rect x="90" y="15" width="5" height="3" rx="1" fill="#f97316" opacity="0.35" transform="rotate(-15 90 15)" className="mode-tilt" style={{ animationDelay: "0.3s" }} />
      <rect x="150" y="45" width="7" height="3" rx="1" fill="#14b8a6" opacity="0.3" transform="rotate(40 150 45)" className="mode-tilt" style={{ animationDelay: "0.6s" }} />
      <rect x="220" y="25" width="5" height="3" rx="1" fill="#0ea5e9" opacity="0.35" transform="rotate(-30 220 25)" className="mode-tilt" style={{ animationDelay: "0.9s" }} />
      <rect x="280" y="50" width="6" height="3" rx="1" fill="#f97316" opacity="0.3" transform="rotate(15 280 50)" className="mode-tilt" style={{ animationDelay: "1.2s" }} />
      {/* disco ball */}
      <circle cx="270" cy="40" r="16" fill="none" stroke="#14b8a6" strokeWidth="0.6" opacity="0.2" />
      <circle cx="270" cy="40" r="16" fill="url(#discoGrad)" opacity="0.1" className="mode-spin-slow" style={{ transformOrigin: "270px 40px" }} />
      <line x1="270" y1="24" x2="270" y2="10" stroke="#14b8a6" strokeWidth="0.6" opacity="0.2" />
      {/* light beams from disco */}
      {[210, 230, 250, 290, 310, 330].map((angle) => (
        <line
          key={angle}
          x1="270"
          y1="40"
          x2={270 + 40 * Math.cos((angle * Math.PI) / 180)}
          y2={40 + 40 * Math.sin((angle * Math.PI) / 180)}
          stroke="#14b8a6"
          strokeWidth="0.4"
          opacity="0.12"
          strokeDasharray="2 3"
        />
      ))}
      {/* music notes */}
      <g opacity="0.25" className="mode-bubble">
        <circle cx="50" cy="80" r="3" fill="#14b8a6" />
        <line x1="53" y1="80" x2="53" y2="68" stroke="#14b8a6" strokeWidth="1" />
        <path d="M53 68C53 68 58 66 58 70" stroke="#14b8a6" strokeWidth="1" fill="none" />
      </g>
      <g opacity="0.2" className="mode-bubble" style={{ animationDelay: "0.7s" }}>
        <circle cx="130" cy="95" r="2.5" fill="#f97316" />
        <line x1="132.5" y1="95" x2="132.5" y2="85" stroke="#f97316" strokeWidth="0.8" />
        <path d="M132.5 85C132.5 85 137 83.5 137 87" stroke="#f97316" strokeWidth="0.8" fill="none" />
      </g>
      {/* zigzag energy */}
      <polyline points="180,100 186,88 192,100 198,88 204,100" stroke="#14b8a6" strokeWidth="1" fill="none" opacity="0.15" className="mode-wave" />
      <defs>
        <radialGradient id="discoGrad">
          <stop stopColor="#14b8a6" stopOpacity="0.4" />
          <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const HERO_SVGS: Record<ThemeMode, () => JSX.Element> = {
  dark: JediHeroSvg,
  light: ChillHeroSvg,
  girl: BubblegumHeroSvg,
  fun: PartyHeroSvg,
};

export default function Header({ title = APP_NAME, themeMode = "dark" }: HeaderProps) {
  const HeroSvg = HERO_SVGS[themeMode];
  const meta = getThemeOption(themeMode);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getTimeGreeting());
    const interval = setInterval(() => setGreeting(getTimeGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative mb-7 animate-fadeDown overflow-visible">
      <div className="relative max-w-[54rem]">
        {/* Mode-specific hero SVG */}
        <div className="pointer-events-none absolute inset-0 -top-4 -left-4 -right-4 overflow-visible opacity-80">
          <HeroSvg />
        </div>

        {/* Ambient glows */}
        <div className="pointer-events-none absolute -left-6 -top-8 h-32 w-32 rounded-full bg-accent/15 blur-3xl animate-breathe" aria-hidden />
        <div className="pointer-events-none absolute right-[10%] top-2 h-24 w-24 rounded-full bg-accent2/10 blur-3xl animate-breathe" style={{ animationDelay: "2s" }} aria-hidden />

        <h1
          className="relative font-syne text-[clamp(3.1rem,8vw,5.6rem)] font-extrabold leading-[0.92] tracking-[-0.05em]"
          style={{
            backgroundImage: meta.gradient,
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "titleShimmer 5s linear infinite",
          }}
        >
          {title}
        </h1>
        <div className="relative mt-4 flex max-w-[36rem] flex-wrap items-center gap-3">
          {greeting && (
            <span className="text-[13px] font-dm text-accent/70 tracking-wide animate-fadeUp" style={{ animationDelay: "0.3s" }}>
              {greeting} •
            </span>
          )}
          <span className="rounded-full border border-accent/20 bg-surface/55 px-3 py-1 text-[11px] font-dm uppercase tracking-[0.16em] text-accent/85">
            {meta.label} Mode
          </span>
          <p className="text-[15px] font-dm text-muted/85 leading-relaxed">
            {meta.tagline}
          </p>
        </div>
      </div>
    </header>
  );
}
