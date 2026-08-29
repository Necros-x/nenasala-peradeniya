"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadThemePreferenceAction, saveThemePreferenceAction } from "@/lib/actions/preferences";
import type { ThemePreference } from "@/lib/services/preferences";

export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "nenasala-theme";

function isTheme(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.resolvedTheme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const updateResolved = useCallback((preference: ThemePreference) => {
    const next = preference === "system" ? systemTheme() : preference;
    setResolvedTheme(next);
    applyResolvedTheme(next);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const localPreference: ThemePreference = isTheme(stored) ? stored : "system";
    setThemeState(localPreference);
    updateResolved(localPreference);

    void loadThemePreferenceAction().then((account) => {
      if (!account.signedIn) return;
      setThemeState(account.themePreference);
      window.localStorage.setItem(STORAGE_KEY, account.themePreference);
      updateResolved(account.themePreference);
    }).catch((error) => {
      console.error("Unable to load account theme preference:", error);
    });
  }, [updateResolved]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") updateResolved("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, updateResolved]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    updateResolved(next);
    void saveThemePreferenceAction(next).catch((error) => {
      console.error("Unable to persist theme preference:", error);
    });
  }, [updateResolved]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ThemeProvider");
  return value;
}
