"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { ThemeMode } from "@/types";

type ParticleShape = "dot" | "pill" | "ray" | "spark";

interface BurstTheme {
  colors: string[];
  count: number;
  distance: [number, number];
  flash: string;
  flashSize: number;
  shapes: ParticleShape[];
  size: [number, number];
}

const BURST_THEMES: Record<ThemeMode, BurstTheme> = {
  dark: {
    count: 6,
    colors: ["#f0c040", "#f6d87b", "#06b6d4", "#8b5cf6"],
    distance: [18, 34],
    flash: "radial-gradient(circle, rgba(240, 192, 64, 0.36) 0%, rgba(6, 182, 212, 0.18) 48%, transparent 78%)",
    flashSize: 24,
    shapes: ["spark", "ray", "dot"],
    size: [5, 9],
  },
  light: {
    count: 7,
    colors: ["#f3c15b", "#c76c00", "#db4e4a", "#ffd9a3"],
    distance: [16, 30],
    flash: "radial-gradient(circle, rgba(243, 193, 91, 0.34) 0%, rgba(219, 78, 74, 0.12) 58%, transparent 80%)",
    flashSize: 30,
    shapes: ["ray", "dot", "ray", "dot"],
    size: [6, 10],
  },
  girl: {
    count: 7,
    colors: ["#ff5ea8", "#ffb86b", "#ffd8eb", "#9333ea"],
    distance: [15, 28],
    flash: "radial-gradient(circle, rgba(255, 94, 168, 0.34) 0%, rgba(255, 184, 107, 0.16) 50%, transparent 76%)",
    flashSize: 28,
    shapes: ["pill", "dot", "pill", "spark"],
    size: [6, 10],
  },
  fun: {
    count: 9,
    colors: ["#14b8a6", "#0ea5e9", "#f97316", "#facc15"],
    distance: [18, 36],
    flash: "radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(14, 165, 233, 0.22) 42%, rgba(249, 115, 22, 0.16) 62%, transparent 82%)",
    flashSize: 32,
    shapes: ["spark", "ray", "dot", "spark"],
    size: [5, 9],
  },
};

function between(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getInteractiveControl(target: Element) {
  return target.closest('button, [role="button"], summary, a[href], input[type="checkbox"], input[type="radio"], select');
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildParticleBackground(shape: ParticleShape, color: string, accent: string) {
  if (shape === "ray") {
    return `linear-gradient(90deg, transparent 0%, ${color} 34%, ${accent} 68%, transparent 100%)`;
  }

  if (shape === "pill") {
    return `linear-gradient(135deg, ${color} 0%, ${accent} 100%)`;
  }

  if (shape === "spark") {
    return `linear-gradient(135deg, rgba(255,255,255,0.92) 0%, ${color} 36%, ${accent} 100%)`;
  }

  return `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.96), ${color} 48%, ${accent} 100%)`;
}

export function useModeClickFx(themeMode: ThemeMode) {
  const reducedMotion = useReducedMotion();
  const lastBurstAtRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion) {
      return;
    }

    const spawnBurst = (x: number, y: number) => {
      const theme = BURST_THEMES[themeMode];
      const burst = document.createElement("div");
      burst.className = `mode-burst mode-burst-${themeMode}`;
      burst.setAttribute("aria-hidden", "true");
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;

      const flash = document.createElement("span");
      flash.className = "mode-burst-flash";
      flash.style.background = theme.flash;
      flash.style.setProperty("--flash-size", `${theme.flashSize}px`);
      burst.appendChild(flash);

      for (let index = 0; index < theme.count; index += 1) {
        const shape = pickRandom(theme.shapes);
        const color = pickRandom(theme.colors);
        const accent = pickRandom(theme.colors);
        const particle = document.createElement("span");
        const angle = (Math.PI * 2 * index) / theme.count + between(-0.28, 0.28);
        const distance = between(theme.distance[0], theme.distance[1]);
        const size = between(theme.size[0], theme.size[1]);

        particle.className = `mode-burst-particle mode-burst-${shape}`;
        particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        particle.style.setProperty("--rot-start", `${between(-45, 45)}deg`);
        particle.style.setProperty("--rot-end", `${between(140, 480)}deg`);
        particle.style.setProperty("--particle-size", `${size}px`);
        particle.style.setProperty("--duration", `${between(480, 760)}ms`);
        particle.style.setProperty("--delay", `${between(0, 60)}ms`);
        particle.style.setProperty("--scale-x", `${between(shape === "ray" ? 2.1 : 1.35, shape === "ray" ? 3.4 : 2.1)}`);
        particle.style.setProperty("--scale-y", `${between(shape === "ray" ? 0.22 : 0.55, shape === "ray" ? 0.38 : 0.9)}`);
        particle.style.background = buildParticleBackground(shape, color, accent);
        particle.style.boxShadow = `0 0 14px ${color}50`;

        burst.appendChild(particle);
      }

      document.body.appendChild(burst);
      window.setTimeout(() => burst.remove(), 900);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const control = getInteractiveControl(target);
      if (!(control instanceof HTMLElement)) return;
      if (control.dataset.silent === "true" || control.matches(":disabled") || control.getAttribute("aria-disabled") === "true") {
        return;
      }

      const now = Date.now();
      if (now - lastBurstAtRef.current < 90) return;
      lastBurstAtRef.current = now;

      const hasPointerLocation = event.clientX > 0 || event.clientY > 0;
      const rect = control.getBoundingClientRect();
      const x = hasPointerLocation ? event.clientX : rect.left + rect.width / 2;
      const y = hasPointerLocation ? event.clientY : rect.top + rect.height / 2;

      spawnBurst(x, y);
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.querySelectorAll(".mode-burst").forEach((node) => node.remove());
    };
  }, [reducedMotion, themeMode]);
}
