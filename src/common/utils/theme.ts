import { storage } from "./storage";

export type SiteTheme = "light" | "dark";

export function getStoredTheme(): SiteTheme {
  if (typeof window === "undefined") return "light";
  return storage.getTheme();
}

export function setStoredTheme(theme: SiteTheme) {
  storage.setTheme(theme);
}

export function applyTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  setStoredTheme(theme);
}
