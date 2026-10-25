"use client";

import { useEffect, useState } from "react";
import { THEME_COLOR, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  window.setTimeout(() => root.classList.remove("theme-switching"), 300);
}

/** Day / Night switch. Highlighting is pure CSS (`light:` variant), so SSR and hydration always agree. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const choose = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };

  const base =
    "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";

  return (
    <div role="group" aria-label="Color theme" className="inline-flex items-center rounded-full border border-line bg-surface-strong p-0.5">
      <button
        type="button"
        onClick={() => choose("light")}
        aria-pressed={theme === null ? undefined : theme === "light"}
        title="Day theme"
        className={`${base} text-fg-subtle hover:text-fg light:bg-elevated light:text-fg light:shadow-sm`}
      >
        <SunIcon className="size-3.5" />
        <span className="hidden sm:inline">Day</span>
        <span className="sr-only sm:hidden">Day theme</span>
      </button>
      <button
        type="button"
        onClick={() => choose("dark")}
        aria-pressed={theme === null ? undefined : theme === "dark"}
        title="Night theme"
        className={`${base} bg-tint/10 text-fg light:bg-transparent light:text-fg-subtle light:hover:text-fg`}
      >
        <MoonIcon className="size-3.5" />
        <span className="hidden sm:inline">Night</span>
        <span className="sr-only sm:hidden">Night theme</span>
      </button>
    </div>
  );
}
