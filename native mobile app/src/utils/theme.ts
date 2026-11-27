export const COLORS = {
  // Brand
  primary: "#6C63FF",
  primaryDark: "#5A52E0",
  primaryLight: "rgba(108,99,255,0.15)",
  accent: "#00E5A0",
  accentLight: "rgba(0,229,160,0.15)",

  // Status
  danger: "#FF5C7A",
  warning: "#FFB547",
  success: "#00E5A0",
  info: "#38BDF8",

  // Dark theme surfaces
  background: "#0D0F1A",
  surface: "#161929",
  surfaceElevated: "#1E2235",
  surfaceHighlight: "#252A40",
  card: "#1A1E30",

  // Borders
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.05)",

  // Text
  text: "#F0F2FF",
  textSecondary: "#8B90B0",
  textMuted: "#4A5070",

  // Misc
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.7)",

  // Gradients (used as array in LinearGradient)
  gradientPrimary: ["#6C63FF", "#9B59F5"] as string[],
  gradientDark: ["#0D0F1A", "#161929"] as string[],
  gradientCard: ["#1E2235", "#161929"] as string[],
  gradientAccent: ["#00E5A0", "#00B8D4"] as string[],
};

export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};
