/*
 * User-defined theme. The default Paradise Desk look is the "rose" preset and
 * adds no overrides at all. Anything else is compiled into one <style> block that
 * redefines the HeroUI tokens for both the light and the dark palette, so every
 * HeroUI component follows it without per-component work.
 */

export type ThemeRadius = "sharp" | "soft" | "default" | "round";

export interface CustomTheme {
  /** Primary colour: buttons, focus rings, charts, the wallet card. */
  accent: string;
  /** Second brand colour, mixed into gradients. */
  secondary: string;
  /** Tint backgrounds and surfaces with the accent hue instead of neutral grey. */
  tinted: boolean;
  radius: ThemeRadius;
}

export const DEFAULT_THEME: CustomTheme = {
  accent: "#fb7185",
  secondary: "#a78bfa",
  tinted: true,
  radius: "default",
};

export interface ThemePreset {
  id: string;
  accent: string;
  secondary: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "rose", accent: "#fb7185", secondary: "#a78bfa" },
  { id: "ocean", accent: "#38bdf8", secondary: "#6366f1" },
  { id: "emerald", accent: "#10b981", secondary: "#06b6d4" },
  { id: "violet", accent: "#8b5cf6", secondary: "#ec4899" },
  { id: "amber", accent: "#f59e0b", secondary: "#ef4444" },
  { id: "graphite", accent: "#64748b", secondary: "#94a3b8" },
];

export const THEME_RADII: Record<ThemeRadius, { radius: string; field: string }> = {
  sharp: { radius: "0.5rem", field: "0.375rem" },
  soft: { radius: "0.75rem", field: "0.625rem" },
  default: { radius: "1rem", field: "0.875rem" },
  round: { radius: "1.5rem", field: "1.25rem" },
};

const STORAGE_THEME = "pb-theme-custom";
const STORAGE_CSS = "pb-theme-css";
const STYLE_ID = "pb-custom-theme";

// ---- colour maths (sRGB hex <-> OKLCH) --------------------------------------

export function normalizeHex(value: string): string | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const raw = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  return `#${raw.toLowerCase()}`;
}

function srgbToLinear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const clean = normalizeHex(hex) ?? DEFAULT_THEME.accent;
  const r = srgbToLinear(parseInt(clean.slice(1, 3), 16) / 255);
  const g = srgbToLinear(parseInt(clean.slice(3, 5), 16) / 255);
  const b = srgbToLinear(parseInt(clean.slice(5, 7), 16) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(A, B);
  let hue = (Math.atan2(B, A) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  return { l: L, c: chroma, h: chroma < 0.002 ? 0 : hue };
}

function oklch(l: number, c: number, h: number) {
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(4)} ${h.toFixed(1)})`;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// ---- palette -----------------------------------------------------------------
// [token, lightness, chroma] — the same values the default theme uses, with the
// hue supplied by the user's accent (or removed for neutral surfaces).

type Row = [string, number, number];

const LIGHT_ROWS: Row[] = [
  ["--background", 0.985, 0.008],
  ["--border", 0.92, 0.015],
  ["--default", 0.96, 0.012],
  ["--default-foreground", 0.28, 0.04],
  ["--field-background", 1, 0.004],
  ["--field-foreground", 0.25, 0.035],
  ["--field-placeholder", 0.58, 0.02],
  ["--foreground", 0.25, 0.035],
  ["--muted", 0.52, 0.025],
  ["--overlay", 1, 0.004],
  ["--overlay-foreground", 0.25, 0.035],
  ["--surface", 1, 0.003],
  ["--surface-foreground", 0.25, 0.035],
  ["--surface-secondary", 0.975, 0.01],
  ["--surface-secondary-foreground", 0.25, 0.035],
  ["--surface-tertiary", 0.95, 0.014],
  ["--surface-tertiary-foreground", 0.25, 0.04],
];

const DARK_ROWS: Row[] = [
  ["--background", 0.14, 0.025],
  ["--border", 0.26, 0.03],
  ["--default", 0.22, 0.03],
  ["--default-foreground", 0.94, 0.01],
  ["--field-background", 0.2, 0.03],
  ["--field-foreground", 0.96, 0.01],
  ["--field-placeholder", 0.62, 0.02],
  ["--foreground", 0.96, 0.01],
  ["--muted", 0.68, 0.025],
  ["--overlay", 0.2, 0.03],
  ["--overlay-foreground", 0.96, 0.01],
  ["--surface", 0.19, 0.03],
  ["--surface-foreground", 0.96, 0.01],
  ["--surface-secondary", 0.23, 0.035],
  ["--surface-secondary-foreground", 0.96, 0.01],
  ["--surface-tertiary", 0.28, 0.04],
  ["--surface-tertiary-foreground", 0.96, 0.01],
];

export function isDefaultTheme(theme: CustomTheme) {
  return (
    normalizeHex(theme.accent) === DEFAULT_THEME.accent &&
    normalizeHex(theme.secondary) === DEFAULT_THEME.secondary &&
    theme.tinted === DEFAULT_THEME.tinted &&
    theme.radius === DEFAULT_THEME.radius
  );
}

/** The CSS that applies `theme`; empty for the default theme (no overrides). */
export function buildThemeCss(theme: CustomTheme): string {
  if (isDefaultTheme(theme)) return "";
  const accent = hexToOklch(theme.accent);
  const secondary = normalizeHex(theme.secondary) ?? DEFAULT_THEME.secondary;
  const hue = accent.h;
  const tintScale = theme.tinted ? 1 : 0.2;

  const lightness = clamp(accent.l, 0.5, 0.82);
  const chroma = clamp(accent.c, 0.02, 0.28);
  const accentColor = oklch(lightness, chroma, hue);
  const onAccent = lightness > 0.72 ? oklch(0.22, 0.03, hue) : "oklch(99% 0 0)";
  const shared = [
    `--accent:${accentColor}`,
    `--accent-foreground:${onAccent}`,
    `--focus:${accentColor}`,
    `--brand-rose:${accentColor}`,
    `--brand-rose-deep:${oklch(clamp(lightness - 0.13, 0.35, 0.7), chroma, hue)}`,
    `--brand-violet:${secondary}`,
    `--pb-fab-a:${accentColor}`,
    `--pb-fab-b:color-mix(in oklch, ${accentColor} 55%, ${secondary})`,
    `--pb-fab-c:${secondary}`,
    `--radius:${THEME_RADII[theme.radius].radius}`,
    `--field-radius:${THEME_RADII[theme.radius].field}`,
  ];

  const palette = (rows: Row[]) => rows.map(([token, l, c]) => `${token}:${oklch(l, c * tintScale, hue)}`);
  const light = [...shared, ...palette(LIGHT_ROWS)].join(";");
  const dark = [...shared, ...palette(DARK_ROWS)].join(";");

  return [
    `html:root,html.light,html[data-theme="light"],html[data-theme="default"]{${light}}`,
    `html.dark,html[data-theme="dark"]{${dark}}`,
  ].join("\n");
}

// ---- persistence + application ------------------------------------------------

export function readStoredTheme(): CustomTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_THEME);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<CustomTheme>;
    return {
      accent: normalizeHex(parsed.accent ?? "") ?? DEFAULT_THEME.accent,
      secondary: normalizeHex(parsed.secondary ?? "") ?? DEFAULT_THEME.secondary,
      tinted: parsed.tinted !== false,
      radius: parsed.radius && parsed.radius in THEME_RADII ? parsed.radius : "default",
    };
  } catch {
    return DEFAULT_THEME;
  }
}

/** Apply the theme to the page now and remember it (the head script replays it on load). */
export function applyCustomTheme(theme: CustomTheme, options: { persist?: boolean } = {}) {
  if (typeof document === "undefined") return;
  const css = buildThemeCss(theme);
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!css) {
    style?.remove();
  } else {
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }
  if (options.persist === false) return;
  try {
    if (isDefaultTheme(theme)) {
      window.localStorage.removeItem(STORAGE_THEME);
      window.localStorage.removeItem(STORAGE_CSS);
    } else {
      window.localStorage.setItem(STORAGE_THEME, JSON.stringify(theme));
      window.localStorage.setItem(STORAGE_CSS, css);
    }
  } catch {
    /* private mode: the theme lasts for this visit only */
  }
}

/** Inline head script: replays the saved CSS before first paint so there is no flash. */
export const CUSTOM_THEME_BOOT_SCRIPT = `(function(){try{var c=localStorage.getItem('${STORAGE_CSS}');if(c){var s=document.createElement('style');s.id='${STYLE_ID}';s.textContent=c;document.head.appendChild(s)}}catch(e){}})();`;
