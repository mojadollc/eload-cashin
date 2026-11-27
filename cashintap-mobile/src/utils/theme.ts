export const COLORS = {
  // Brand — matches web #038E80
  primary: "#038E80",
  primaryDark: "#027A6E",
  primaryLight: "rgba(3,142,128,0.12)",
  primaryMid: "rgba(3,142,128,0.25)",
  accent: "#038E80",
  accentLight: "rgba(3,142,128,0.12)",

  // Status
  danger: "#DC2626",
  dangerLight: "rgba(220,38,38,0.12)",
  warning: "#FFB020",
  warningLight: "rgba(255,176,32,0.12)",
  success: "#038E80",
  successLight: "rgba(3,142,128,0.12)",
  info: "#38BDF8",
  infoLight: "rgba(56,189,248,0.12)",

  // Dark theme surfaces — based on web admin dark #17202A
  background: "#0F1620",
  surface: "#17202A",
  surfaceElevated: "#1E2A36",
  surfaceHighlight: "#243040",
  card: "#1A2530",

  // Borders
  border: "rgba(255,255,255,0.07)",
  borderFocus: "rgba(3,142,128,0.5)",

  // Text
  text: "#EEF0FF",
  textSecondary: "#7B8FA8",
  textMuted: "#3D5066",

  // Misc
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.75)",

  // Gradients
  gradientPrimary: ["#038E80", "#05B8A8"] as string[],
  gradientCard: ["#1E2A36", "#17202A"] as string[],
  gradientAccent: ["#038E80", "#027A6E"] as string[],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: "#038E80",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  glowAccent: {
    shadowColor: "#038E80",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};
