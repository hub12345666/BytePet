export interface Theme {
  id: string;
  name: string;
  primary: string;
  background: string;
  panelBg: string;
  buttonBg: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
}

export const ACTIVE_THEME_KEY = "desktop_pet_active_theme";
export const CUSTOM_THEMES_KEY = "desktop_pet_custom_themes";

export const DEFAULT_THEME: Theme = {
  id: "default",
  name: "默认",
  primary: "#2a9bdc",
  background: "#eaf7ff",
  panelBg: "rgba(255,255,255,0.9)",
  buttonBg: "#f4fbff",
  border: "#b7ddf5",
  text: "#1f3b4d",
  mutedText: "#6c8ca3",
  accent: "#3aaee8",
};

export const SYSTEM_THEMES: Theme[] = [
  DEFAULT_THEME,
  {
    id: "blue",
    name: "蓝色",
    primary: "#2563eb",
    background: "#eaf2ff",
    panelBg: "rgba(248,251,255,0.92)",
    buttonBg: "#edf5ff",
    border: "#b8d4ff",
    text: "#172554",
    mutedText: "#557096",
    accent: "#0ea5e9",
  },
  {
    id: "pink-purple",
    name: "粉紫",
    primary: "#c026d3",
    background: "#fff0fb",
    panelBg: "rgba(255,247,253,0.92)",
    buttonBg: "#fce7f3",
    border: "#f0abfc",
    text: "#4a164f",
    mutedText: "#93638f",
    accent: "#db2777",
  },
  {
    id: "green",
    name: "绿色",
    primary: "#16a34a",
    background: "#edfdf3",
    panelBg: "rgba(248,255,250,0.92)",
    buttonBg: "#dcfce7",
    border: "#a7f3d0",
    text: "#123524",
    mutedText: "#4f7a62",
    accent: "#059669",
  },
  {
    id: "xianxia",
    name: "仙侠",
    primary: "#8b5cf6",
    background: "#f4f0ff",
    panelBg: "rgba(252,250,255,0.92)",
    buttonBg: "#ede9fe",
    border: "#c4b5fd",
    text: "#2e1b4f",
    mutedText: "#756194",
    accent: "#14b8a6",
  },
  {
    id: "ink",
    name: "黑白水墨",
    primary: "#1f2933",
    background: "#f5f2ea",
    panelBg: "rgba(252,250,245,0.92)",
    buttonBg: "#eee9df",
    border: "#c8c0b3",
    text: "#1f1f1d",
    mutedText: "#6f6a61",
    accent: "#111827",
  },
];

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "").trim();
  const full = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, "0")).join("")}`;
}

function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount
  );
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const linear = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function createThemeFromPrimary(primary: string, base: Theme = DEFAULT_THEME): Theme {
  const background = mix(primary, "#ffffff", 0.9);
  return {
    ...base,
    primary,
    background,
    panelBg: mix(primary, "#ffffff", 0.94),
    buttonBg: mix(primary, "#ffffff", 0.86),
    border: mix(primary, "#ffffff", 0.62),
    text: luminance(background) > 0.5 ? "#1f2937" : "#f8fafc",
    mutedText: luminance(background) > 0.5 ? "#64748b" : "#cbd5e1",
    accent: mix(primary, "#000000", 0.16),
  };
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--pet-primary", theme.primary);
  root.style.setProperty("--pet-bg", theme.background);
  root.style.setProperty("--pet-panel-bg", theme.panelBg);
  root.style.setProperty("--pet-button-bg", theme.buttonBg);
  root.style.setProperty("--pet-border", theme.border);
  root.style.setProperty("--pet-text", theme.text);
  root.style.setProperty("--pet-muted-text", theme.mutedText);
  root.style.setProperty("--pet-accent", theme.accent);
}

export function readCustomThemes(): Theme[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_THEMES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.name) : [];
  } catch {
    return [];
  }
}

export function saveCustomThemes(themes: Theme[]): void {
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes));
  window.dispatchEvent(new Event("pet-theme-change"));
}

export function readActiveTheme(): Theme {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  const activeId = localStorage.getItem(ACTIVE_THEME_KEY);
  const custom = readCustomThemes();
  return [...SYSTEM_THEMES, ...custom].find((theme) => theme.id === activeId) ?? DEFAULT_THEME;
}

export function setActiveTheme(theme: Theme): void {
  localStorage.setItem(ACTIVE_THEME_KEY, theme.id);
  applyTheme(theme);
  window.dispatchEvent(new Event("pet-theme-change"));
}

export function resetTheme(): void {
  setActiveTheme(DEFAULT_THEME);
}
