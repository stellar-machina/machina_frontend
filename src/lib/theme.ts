export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "machina.theme";

/** @internal use THEME_STORAGE_KEY instead of this alias */
const KEY = THEME_STORAGE_KEY;

export function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function writeTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, theme);
}

export function effectiveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
