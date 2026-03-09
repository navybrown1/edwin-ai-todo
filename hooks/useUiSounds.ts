"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type UiSoundKind = "tap" | "toggle" | "soft";

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function canUseAudio(windowObject: Window) {
  return Boolean(windowObject.AudioContext || (windowObject as WebAudioWindow).webkitAudioContext);
}

export function useUiSounds() {
  const reducedMotion = useReducedMotion();
  const contextRef = useRef<AudioContext | null>(null);
  const lastPlayRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || reducedMotion || !canUseAudio(window)) {
      return;
    }

    const getContext = async () => {
      if (!contextRef.current) {
        const AudioCtor = window.AudioContext || (window as WebAudioWindow).webkitAudioContext;
        if (!AudioCtor) {
          return null;
        }
        contextRef.current = new AudioCtor();
      }

      if (contextRef.current.state === "suspended") {
        await contextRef.current.resume();
      }

      return contextRef.current;
    };

    const play = async (kind: UiSoundKind) => {
      if (Date.now() - lastPlayRef.current < 55) return;
      lastPlayRef.current = Date.now();

      const context = await getContext();
      if (!context) return;

      const now = context.currentTime;
      const master = context.createGain();
      master.connect(context.destination);
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.024, now + 0.01);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      const primary = context.createOscillator();
      const primaryGain = context.createGain();
      primary.connect(primaryGain);
      primaryGain.connect(master);

      const shimmer = context.createOscillator();
      const shimmerGain = context.createGain();
      shimmer.connect(shimmerGain);
      shimmerGain.connect(master);

      if (kind === "toggle") {
        primary.type = "triangle";
        primary.frequency.setValueAtTime(420, now);
        primary.frequency.exponentialRampToValueAtTime(640, now + 0.18);
        primaryGain.gain.setValueAtTime(0.18, now);
        primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        shimmer.type = "sine";
        shimmer.frequency.setValueAtTime(860, now);
        shimmer.frequency.exponentialRampToValueAtTime(700, now + 0.18);
        shimmerGain.gain.setValueAtTime(0.06, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      } else if (kind === "soft") {
        primary.type = "sine";
        primary.frequency.setValueAtTime(360, now);
        primary.frequency.exponentialRampToValueAtTime(280, now + 0.16);
        primaryGain.gain.setValueAtTime(0.13, now);
        primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        shimmer.type = "triangle";
        shimmer.frequency.setValueAtTime(620, now);
        shimmer.frequency.exponentialRampToValueAtTime(540, now + 0.16);
        shimmerGain.gain.setValueAtTime(0.03, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      } else {
        primary.type = "triangle";
        primary.frequency.setValueAtTime(560, now);
        primary.frequency.exponentialRampToValueAtTime(410, now + 0.14);
        primaryGain.gain.setValueAtTime(0.15, now);
        primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        shimmer.type = "sine";
        shimmer.frequency.setValueAtTime(920, now);
        shimmer.frequency.exponentialRampToValueAtTime(760, now + 0.15);
        shimmerGain.gain.setValueAtTime(0.05, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      }

      primary.start(now);
      shimmer.start(now);
      primary.stop(now + 0.24);
      shimmer.stop(now + 0.2);
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const control = target.closest('button, [role="button"], summary, a[href], input[type="checkbox"], input[type="radio"], select');
      if (!control) return;

      const htmlControl = control as HTMLElement;
      if (htmlControl.dataset.silent === "true") return;

      const kind: UiSoundKind = control.matches('input[type="checkbox"], input[type="radio"]')
        ? "toggle"
        : control.matches("select, summary")
          ? "soft"
          : "tap";

      void play(kind);
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
    };
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      contextRef.current = null;
    };
  }, []);
}
