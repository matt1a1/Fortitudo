import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type AccentKey = "orange" | "blue" | "green" | "yellow" | "rose" | "violet";
export type FontSize  = "sm" | "md" | "lg";
export type Layout    = "desktop" | "mobile";

export interface Settings {
  accent:   AccentKey;
  fontSize: FontSize;
  darkMode: boolean;
  layout:   Layout;
}

export const ACCENT_MAP: Record<AccentKey, { hex: string; lt: string; rgb: string; dark: string; darkLt: string }> = {
  orange: { hex: "#ff6600", lt: "#ff8c00", rgb: "255,102,0",   dark: "#7a2e00", darkLt: "#a03c00" },
  blue:   { hex: "#4a9de0", lt: "#6ab4f0", rgb: "74,157,224",  dark: "#0e3f72", darkLt: "#1a5499" },
  green:  { hex: "#3db86a", lt: "#5ecb7a", rgb: "61,184,106",  dark: "#0d5428", darkLt: "#156933" },
  yellow: { hex: "#c89800", lt: "#e8b800", rgb: "200,152,0",   dark: "#5a3c00", darkLt: "#7a5200" },
  rose:   { hex: "#d94f84", lt: "#f07aaa", rgb: "217,79,132",  dark: "#6b0f30", darkLt: "#8f1840" },
  violet: { hex: "#8040cc", lt: "#a868e8", rgb: "128,64,204",  dark: "#340a6b", darkLt: "#4e1090" },
};

const FONT_ZOOM: Record<FontSize, string> = { sm: "0.88", md: "1", lg: "1.14" };

function detectLayout(): Layout {
  return typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";
}

const DEFAULT_SETTINGS: Settings = {
  accent:   "orange",
  fontSize: "md",
  darkMode: true,
  layout:   "desktop",
};

const STORAGE_KEY = "fortitude_settings_v1";

function load(): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS, layout: detectLayout() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Settings>;
      return { ...base, ...saved, layout: saved.layout ?? detectLayout() };
    }
  } catch {}
  return base;
}

function applyVars(s: Settings) {
  const a = ACCENT_MAP[s.accent];
  const root = document.documentElement;

  if (s.darkMode) {
    root.style.setProperty("--c-accent",     a.hex);
    root.style.setProperty("--c-accent-lt",  a.lt);
  } else {
    root.style.setProperty("--c-accent",     a.dark);
    root.style.setProperty("--c-accent-lt",  a.darkLt);
  }

  root.style.setProperty("--c-accent-rgb",   s.darkMode ? a.rgb : a.dark.slice(1).match(/.{2}/g)!.map(h => parseInt(h, 16)).join(","));
  root.style.setProperty("--c-accent-hex",   a.hex);
  root.style.setProperty("--font-zoom",      FONT_ZOOM[s.fontSize]);
  (root.style as unknown as Record<string, string>).zoom = FONT_ZOOM[s.fontSize];
  root.setAttribute("data-layout", s.layout);
  root.setAttribute("data-mode", s.darkMode ? "dark" : "light");

  if (s.darkMode) {
    root.style.backgroundColor = "#0a0a0a";
    root.style.setProperty("--c-bg-page",        "#0a0a0a");
    root.style.setProperty("--c-bg-card",        "#0e0e0e");
    root.style.setProperty("--c-bg-card-hover",  "#141414");
    root.style.setProperty("--c-bg-edit",        "#161616");
    root.style.setProperty("--c-bg-input",       "#0d0d0d");
    root.style.setProperty("--c-header-bg",      "rgba(8,8,8,0.95)");
    root.style.setProperty("--c-tab-bg",         "rgba(10,10,10,0.96)");
    root.style.setProperty("--c-text-primary",   "#c8c8c8");
    root.style.setProperty("--c-text-dim",       "rgba(200,200,200,0.28)");
    root.style.setProperty("--c-text-entry",     a.lt);
    root.style.setProperty("--c-text-entry-edit",a.hex === "#c89800" ? "#ffd040" : a.lt);
    root.style.setProperty("--c-login-bg",       "#0d0d0d");
    root.style.setProperty("--c-login-grid",     "rgba(255,255,255,0.03)");
    root.style.setProperty("--c-login-vignette", "rgba(0,0,0,0.45)");
  } else {
    root.style.backgroundColor = "#eceae4";
    root.style.setProperty("--c-bg-page",        "#eceae4");
    root.style.setProperty("--c-bg-card",        "#fafaf8");
    root.style.setProperty("--c-bg-card-hover",  "#f2f0eb");
    root.style.setProperty("--c-bg-edit",        "#e4e2dc");
    root.style.setProperty("--c-bg-input",       "#f5f4f0");
    root.style.setProperty("--c-header-bg",      "rgba(236,234,228,0.97)");
    root.style.setProperty("--c-tab-bg",         "rgba(232,230,224,0.97)");
    root.style.setProperty("--c-text-primary",   "#1a1a1a");
    root.style.setProperty("--c-text-dim",       "rgba(20,20,20,0.38)");
    root.style.setProperty("--c-text-entry",     a.dark);
    root.style.setProperty("--c-text-entry-edit",a.dark);
    root.style.setProperty("--c-login-bg",       "#d8d5ce");
    root.style.setProperty("--c-login-grid",     "rgba(0,0,0,0.05)");
    root.style.setProperty("--c-login-vignette", "rgba(0,0,0,0.12)");
  }
}

interface SettingsCtx {
  settings: Settings;
  update:   (patch: Partial<Settings>) => void;
  isMobile: boolean;
}

const Ctx = createContext<SettingsCtx>({
  settings: DEFAULT_SETTINGS,
  update:   () => {},
  isMobile: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    applyVars(settings);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    const onResize = () => {
      const auto = detectLayout();
      setSettings(prev => ({ ...prev, layout: auto }));
    };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || !(JSON.parse(raw) as Partial<Settings>).layout) {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return undefined;
  }, []);

  const update = (patch: Partial<Settings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const isMobile = settings.layout === "mobile";

  return <Ctx.Provider value={{ settings, update, isMobile }}>{children}</Ctx.Provider>;
}

export function useSettings() { return useContext(Ctx); }
