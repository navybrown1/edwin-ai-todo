"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type UiSoundKind = "tap" | "toggle" | "soft";

type WebAudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function canUseAudio(windowObject: Window) {
  const audioWindow = windowObject as WebAudioWindow;
  return Boolean(audioWindow.AudioContext || audioWindow.webkitAudioContext);
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
        const audioWindow = window as WebAudioWindow;
        const AudioCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
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
      const compressor = context.createDynamicsCompressor();
      const master = context.createGain();
      compressor.threshold.setValueAtTime(-18, now);
      compressor.knee.setValueAtTime(18, now);
      compressor.ratio.setValueAtTime(2.4, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.14, now);
      master.connect(compressor);
      compressor.connect(context.destination);
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.068, now + 0.012);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

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
        primaryGain.gain.setValueAtTime(0.24, now);
        primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

        shimmer.type = "sine";
        shimmer.frequency.setValueAtTime(860, now);
        shimmer.frequency.exponentialRampToValueAtTime(700, now + 0.18);
        shimmerGain.gain.setValueAtTime(0.085, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      } else if (kind === "soft") {
        primary.type = "sine";
        primary.frequency.setValueAtTime(360, now);
        primary.frequency.exponentialRampToValueAtTime(280, now + 0.16);
        primaryGain.gain.setValueAtTime(0.18, now);
        primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        shimmer.type = "triangle";
        shimmer.frequency.setValueAtTime(620, now);
        shimmer.frequency.exponentialRampToValueAtTime(540, now + 0.16);
        shimmerGain.gain.setValueAtTime(0.05, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      } else {
        primary.type = "triangle";
        primary.frequency.setValueAtTime(560, now);
        primary.frequency.exponentialRampToValueAtTime(410, now + 0.14);
        primaryGain.gain.setValueAtTime(0.22, now);
        primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

        shimmer.type = "sine";
        shimmer.frequency.setValueAtTime(920, now);
        shimmer.frequency.exponentialRampToValueAtTime(760, now + 0.15);
        shimmerGain.gain.setValueAtTime(0.075, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      }

      primary.start(now);
      shimmer.start(now);
      primary.stop(now + 0.28);
      shimmer.stop(now + 0.24);
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
