/**
 * LinkSphere Theme System
 * ─────────────────────────────────────────────────────────────────────────────
 * Themes are applied by writing CSS custom-property overrides into a
 * <style id="ls-theme"> tag on <html>.  Every theme must supply the same set
 * of variables so the existing component CSS works without modification.
 *
 * Persisted to localStorage under the key "ls-theme".
 */

export const THEMES = {
  dark: {
    id: "dark",
    label: "Dark",
    emoji: "🌑",
    description: "Default dark mode — deep navy backgrounds with purple accents",
    preview: ["#0d1117", "#1a1f2e", "#7c3aed"],
    vars: {
      "--bg-deep":        "#0d1117",
      "--bg-base":        "#111827",
      "--bg-surface":     "#141d2b",
      "--bg-raised":      "#1a2236",
      "--bg-hover":       "#1e2a40",
      "--accent-1":       "#7c3aed",
      "--accent-2":       "#3b82f6",
      "--accent-gradient":"linear-gradient(135deg,#7c3aed,#3b82f6)",
      "--text-primary":   "#e2e8f0",
      "--text-secondary": "#94a3b8",
      "--text-muted":     "#64748b",
      "--border":         "rgba(255,255,255,0.07)",
      "--glass-border":   "rgba(255,255,255,0.12)",
      "--danger":         "#ef4444",
      "--success":        "#22c55e",
      "--msg-bg":         "transparent",
      "--font-family":    "'Inter', system-ui, sans-serif",
      "--radius-base":    "8px",
      "--sidebar-width":  "240px",
    },
  },

  midnight: {
    id: "midnight",
    label: "Midnight",
    emoji: "🌌",
    description: "True black with indigo highlights — OLED-friendly",
    preview: ["#000000", "#0f0f1a", "#6366f1"],
    vars: {
      "--bg-deep":        "#000000",
      "--bg-base":        "#080810",
      "--bg-surface":     "#0f0f1a",
      "--bg-raised":      "#15152a",
      "--bg-hover":       "#1c1c33",
      "--accent-1":       "#6366f1",
      "--accent-2":       "#818cf8",
      "--accent-gradient":"linear-gradient(135deg,#4f46e5,#818cf8)",
      "--text-primary":   "#f1f5f9",
      "--text-secondary": "#a5b4fc",
      "--text-muted":     "#6b7280",
      "--border":         "rgba(255,255,255,0.05)",
      "--glass-border":   "rgba(99,102,241,0.2)",
      "--danger":         "#f87171",
      "--success":        "#4ade80",
      "--msg-bg":         "transparent",
      "--font-family":    "'Inter', system-ui, sans-serif",
      "--radius-base":    "8px",
      "--sidebar-width":  "240px",
    },
  },

  github: {
    id: "github",
    label: "GitHub Dark",
    emoji: "🐙",
    description: "GitHub's dark theme — familiar green accents on charcoal",
    preview: ["#0d1117", "#161b22", "#238636"],
    vars: {
      "--bg-deep":        "#010409",
      "--bg-base":        "#0d1117",
      "--bg-surface":     "#161b22",
      "--bg-raised":      "#21262d",
      "--bg-hover":       "#30363d",
      "--accent-1":       "#238636",
      "--accent-2":       "#2ea043",
      "--accent-gradient":"linear-gradient(135deg,#238636,#2ea043)",
      "--text-primary":   "#e6edf3",
      "--text-secondary": "#8b949e",
      "--text-muted":     "#6e7681",
      "--border":         "rgba(48,54,61,0.8)",
      "--glass-border":   "rgba(48,54,61,1)",
      "--danger":         "#f85149",
      "--success":        "#3fb950",
      "--msg-bg":         "transparent",
      "--font-family":    "'SFMono-Regular', Consolas, monospace",
      "--radius-base":    "6px",
      "--sidebar-width":  "240px",
    },
  },

  solarized: {
    id: "solarized",
    label: "Solarized Dark",
    emoji: "☀️",
    description: "Classic Solarized dark palette — warm teal and yellow",
    preview: ["#002b36", "#073642", "#268bd2"],
    vars: {
      "--bg-deep":        "#001e27",
      "--bg-base":        "#002b36",
      "--bg-surface":     "#073642",
      "--bg-raised":      "#0d3b4a",
      "--bg-hover":       "#164450",
      "--accent-1":       "#268bd2",
      "--accent-2":       "#2aa198",
      "--accent-gradient":"linear-gradient(135deg,#268bd2,#2aa198)",
      "--text-primary":   "#fdf6e3",
      "--text-secondary": "#93a1a1",
      "--text-muted":     "#657b83",
      "--border":         "rgba(38,139,210,0.15)",
      "--glass-border":   "rgba(38,139,210,0.25)",
      "--danger":         "#dc322f",
      "--success":        "#859900",
      "--msg-bg":         "transparent",
      "--font-family":    "'Inter', system-ui, sans-serif",
      "--radius-base":    "8px",
      "--sidebar-width":  "240px",
    },
  },

  rose: {
    id: "rose",
    label: "Rose Pink",
    emoji: "🌸",
    description: "Soft rose and crimson — for those who like it pretty",
    preview: ["#1a0a10", "#2d1120", "#e11d48"],
    vars: {
      "--bg-deep":        "#140208",
      "--bg-base":        "#1a0a10",
      "--bg-surface":     "#2d1120",
      "--bg-raised":      "#3d1830",
      "--bg-hover":       "#4a2040",
      "--accent-1":       "#e11d48",
      "--accent-2":       "#fb7185",
      "--accent-gradient":"linear-gradient(135deg,#be123c,#fb7185)",
      "--text-primary":   "#fce7f3",
      "--text-secondary": "#fda4af",
      "--text-muted":     "#9f4458",
      "--border":         "rgba(225,29,72,0.12)",
      "--glass-border":   "rgba(225,29,72,0.25)",
      "--danger":         "#ef4444",
      "--success":        "#4ade80",
      "--msg-bg":         "transparent",
      "--font-family":    "'Inter', system-ui, sans-serif",
      "--radius-base":    "12px",
      "--sidebar-width":  "240px",
    },
  },

  forest: {
    id: "forest",
    label: "Forest",
    emoji: "🌲",
    description: "Deep greens and earthy tones — calm and focused",
    preview: ["#0a1a0d", "#112718", "#22c55e"],
    vars: {
      "--bg-deep":        "#050e07",
      "--bg-base":        "#0a1a0d",
      "--bg-surface":     "#112718",
      "--bg-raised":      "#183824",
      "--bg-hover":       "#1e4a2e",
      "--accent-1":       "#16a34a",
      "--accent-2":       "#22c55e",
      "--accent-gradient":"linear-gradient(135deg,#15803d,#22c55e)",
      "--text-primary":   "#dcfce7",
      "--text-secondary": "#86efac",
      "--text-muted":     "#4ade80",
      "--border":         "rgba(34,197,94,0.1)",
      "--glass-border":   "rgba(34,197,94,0.2)",
      "--danger":         "#ef4444",
      "--success":        "#22c55e",
      "--msg-bg":         "transparent",
      "--font-family":    "'Inter', system-ui, sans-serif",
      "--radius-base":    "10px",
      "--sidebar-width":  "240px",
    },
  },

  pixel: {
    id: "pixel",
    label: "Pixel / Retro",
    emoji: "👾",
    description: "8-bit retro pixel aesthetic — sharp edges, neon on black",
    preview: ["#000000", "#0a0a0a", "#00ff41"],
    vars: {
      "--bg-deep":        "#000000",
      "--bg-base":        "#0a0a0a",
      "--bg-surface":     "#0f0f0f",
      "--bg-raised":      "#141414",
      "--bg-hover":       "#1a1a1a",
      "--accent-1":       "#00ff41",
      "--accent-2":       "#00b8ff",
      "--accent-gradient":"linear-gradient(135deg,#00ff41,#00b8ff)",
      "--text-primary":   "#00ff41",
      "--text-secondary": "#00b8ff",
      "--text-muted":     "#005f18",
      "--border":         "rgba(0,255,65,0.2)",
      "--glass-border":   "rgba(0,255,65,0.35)",
      "--danger":         "#ff0055",
      "--success":        "#00ff41",
      "--msg-bg":         "transparent",
      "--font-family":    "'Courier New', 'Lucida Console', monospace",
      "--radius-base":    "0px",
      "--sidebar-width":  "240px",
    },
  },

  light: {
    id: "light",
    label: "Light",
    emoji: "☀️",
    description: "Clean white light mode — easy on the eyes in daylight",
    preview: ["#ffffff", "#f3f4f6", "#7c3aed"],
    vars: {
      "--bg-deep":        "#e5e7eb",
      "--bg-base":        "#f9fafb",
      "--bg-surface":     "#ffffff",
      "--bg-raised":      "#f3f4f6",
      "--bg-hover":       "#e5e7eb",
      "--accent-1":       "#7c3aed",
      "--accent-2":       "#3b82f6",
      "--accent-gradient":"linear-gradient(135deg,#7c3aed,#3b82f6)",
      "--text-primary":   "#111827",
      "--text-secondary": "#374151",
      "--text-muted":     "#9ca3af",
      "--border":         "rgba(0,0,0,0.08)",
      "--glass-border":   "rgba(0,0,0,0.12)",
      "--danger":         "#ef4444",
      "--success":        "#16a34a",
      "--msg-bg":         "transparent",
      "--font-family":    "'Inter', system-ui, sans-serif",
      "--radius-base":    "8px",
      "--sidebar-width":  "240px",
    },
  },
};

const STORAGE_KEY = "ls-theme";
const STYLE_ID    = "ls-theme-override";

/** Apply a theme by id — writes CSS vars to <html> via a <style> tag */
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.dark;

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  const css = `:root {\n${Object.entries(theme.vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")}\n}`;

  style.textContent = css;

  // Pixel theme gets an extra class for pixel-specific overrides
  document.documentElement.dataset.theme = themeId;
}

/** Persist theme choice */
export function saveTheme(themeId) {
  localStorage.setItem(STORAGE_KEY, themeId);
  applyTheme(themeId);
}

/** Load saved theme on app start (call this in main.jsx) */
export function loadSavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || "dark";
  applyTheme(saved);
  return saved;
}
