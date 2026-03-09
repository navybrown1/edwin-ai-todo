"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type PomodoroMode = "focus" | "break" | "long";

interface PomodoroState {
  mode: PomodoroMode;
  remainingSeconds: number;
  isRunning: boolean;
  endAt: number | null;
  completedFocusRounds: number;
  phraseIndex: number;
}

const DURATIONS: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  break: 5 * 60,
  long: 15 * 60,
};

const PHRASES: Record<PomodoroMode, string[]> = {
  focus: [
    "Start ugly.",
    "One thing now.",
    "Tiny steps still count.",
    "Momentum beats mood.",
    "Just touch the task.",
    "You do not need perfect.",
  ],
  break: [
    "Breathe.",
    "Unclench.",
    "Look away.",
    "Water first.",
  ],
  long: [
    "Reset the room.",
    "Loosen the jaw.",
    "Let your brain land.",
    "Come back lighter.",
  ],
};

function getStorageKey(spaceKey: string) {
  return `above.pomodoro.${spaceKey}`;
}

function createState(mode: PomodoroMode, completedFocusRounds = 0, phraseIndex = 0): PomodoroState {
  return {
    mode,
    remainingSeconds: DURATIONS[mode],
    isRunning: false,
    endAt: null,
    completedFocusRounds,
    phraseIndex,
  };
}

function normalizeState(raw: Partial<PomodoroState> | null): PomodoroState {
  const mode = raw?.mode && raw.mode in DURATIONS ? raw.mode : "focus";
  const remainingSeconds = typeof raw?.remainingSeconds === "number" && raw.remainingSeconds > 0 ? raw.remainingSeconds : DURATIONS[mode];
  const completedFocusRounds = typeof raw?.completedFocusRounds === "number" && raw.completedFocusRounds >= 0 ? raw.completedFocusRounds : 0;
  const phraseIndex = typeof raw?.phraseIndex === "number" && raw.phraseIndex >= 0 ? raw.phraseIndex : 0;
  const endAt = typeof raw?.endAt === "number" ? raw.endAt : null;
  const isRunning = Boolean(raw?.isRunning && endAt);

  if (!isRunning || !endAt) {
    return {
      mode,
      remainingSeconds,
      isRunning: false,
      endAt: null,
      completedFocusRounds,
      phraseIndex,
    };
  }

  const nextRemainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  if (nextRemainingSeconds > 0) {
    return {
      mode,
      remainingSeconds: nextRemainingSeconds,
      isRunning: true,
      endAt,
      completedFocusRounds,
      phraseIndex,
    };
  }

  return advanceState({
    mode,
    remainingSeconds: 0,
    isRunning: false,
    endAt: null,
    completedFocusRounds,
    phraseIndex,
  });
}

function nextPhraseIndex(mode: PomodoroMode, phraseIndex: number) {
  return (phraseIndex + 1) % PHRASES[mode].length;
}

function advanceState(state: PomodoroState): PomodoroState {
  if (state.mode === "focus") {
    const completedFocusRounds = state.completedFocusRounds + 1;
    const mode: PomodoroMode = completedFocusRounds % 4 === 0 ? "long" : "break";
    return createState(mode, completedFocusRounds, nextPhraseIndex(mode, state.phraseIndex));
  }

  return createState("focus", state.completedFocusRounds, nextPhraseIndex("focus", state.phraseIndex));
}

export function usePomodoro(spaceKey: string) {
  const [state, setState] = useState<PomodoroState>(() => createState("focus"));
  const loadedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(getStorageKey(spaceKey));
      setState(normalizeState(raw ? (JSON.parse(raw) as Partial<PomodoroState>) : null));
    } catch {
      setState(createState("focus"));
    } finally {
      loadedRef.current = true;
    }
  }, [spaceKey]);

  useEffect(() => {
    if (!loadedRef.current || typeof window === "undefined") return;
    window.localStorage.setItem(getStorageKey(spaceKey), JSON.stringify(state));
  }, [spaceKey, state]);

  useEffect(() => {
    if (!state.isRunning || !state.endAt) return;

    const interval = window.setInterval(() => {
      setState((current) => {
        if (!current.isRunning || !current.endAt) {
          return current;
        }

        const remainingSeconds = Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000));
        if (remainingSeconds <= 0) {
          return advanceState(current);
        }

        if (remainingSeconds === current.remainingSeconds) {
          return current;
        }

        return {
          ...current,
          remainingSeconds,
        };
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [state.endAt, state.isRunning]);

  const totalSeconds = useMemo(() => DURATIONS[state.mode], [state.mode]);
  const phrase = useMemo(() => PHRASES[state.mode][state.phraseIndex % PHRASES[state.mode].length], [state.mode, state.phraseIndex]);

  const setMode = useCallback((mode: PomodoroMode) => {
    setState((current) => createState(mode, current.completedFocusRounds, nextPhraseIndex(mode, current.phraseIndex)));
  }, []);

  const toggleRunning = useCallback(() => {
    setState((current) => {
      if (current.isRunning) {
        return {
          ...current,
          isRunning: false,
          endAt: null,
        };
      }

      return {
        ...current,
        isRunning: true,
        endAt: Date.now() + current.remainingSeconds * 1000,
        phraseIndex: nextPhraseIndex(current.mode, current.phraseIndex),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState((current) => createState(current.mode, current.completedFocusRounds, nextPhraseIndex(current.mode, current.phraseIndex)));
  }, []);

  const skip = useCallback(() => {
    setState((current) => advanceState(current));
  }, []);

  return {
    completedFocusRounds: state.completedFocusRounds,
    isRunning: state.isRunning,
    mode: state.mode,
    phrase,
    remainingSeconds: state.remainingSeconds,
    reset,
    setMode,
    skip,
    toggleRunning,
    totalSeconds,
  };
}
