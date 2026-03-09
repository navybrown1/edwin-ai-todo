"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_GEMINI_MODEL, DEFAULT_THEME_MODE } from "@/lib/ai-config";
import type { GeminiModelId, ThemeMode } from "@/types";

const THEME_STORAGE_KEY = "nova.theme";
const PRIMARY_MODEL_STORAGE_KEY = "nova.primary-model";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "dark" || value === "light" || value === "girl" || value === "fun";
}

function isGeminiModel(value: string | null): value is GeminiModelId {
  return value === "gemini-2.5-pro" || value === "gemini-2.5-flash" || value === "gemini-2.5-flash-lite";
}

function applyTheme(nextTheme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme === "light" ? "light" : "dark";
}

export function useLocalPreferences() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [primaryModel, setPrimaryModel] = useState<GeminiModelId>(DEFAULT_GEMINI_MODEL);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const savedModel = window.localStorage.getItem(PRIMARY_MODEL_STORAGE_KEY);

    if (isThemeMode(savedTheme)) {
      setThemeMode(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme(DEFAULT_THEME_MODE);
    }

    if (isGeminiModel(savedModel)) {
      setPrimaryModel(savedModel);
    }
  }, []);

  const updateThemeMode = useCallback((nextTheme: ThemeMode) => {
    setThemeMode(nextTheme);
  }, []);

  const updatePrimaryModel = useCallback((nextModel: GeminiModelId) => {
    setPrimaryModel(nextModel);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    applyTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PRIMARY_MODEL_STORAGE_KEY, primaryModel);
  }, [primaryModel]);

  return {
    primaryModel,
    setPrimaryModel: updatePrimaryModel,
    setThemeMode: updateThemeMode,
    themeMode,
  };
}
