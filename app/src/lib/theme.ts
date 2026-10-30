import { MD3LightTheme, type MD3Theme } from "react-native-paper";

export const palette = {
  charcoal: "#243042",
  charcoalSoft: "#3A4A60",
  red: "#D64545",
  redDark: "#B33434",
  redTint: "#FBE9E9",
  background: "#F6F7F9",
  surface: "#FFFFFF",
  surfaceMuted: "#EDEFF3",
  outline: "#C9CED6",
  textMuted: "#5B6676",
  success: "#2E7D4F",
  successTint: "#E3F2E8",
  warning: "#9A6200",
  warningTint: "#FFF3DC",
} as const;

/**
 * Paper theme built from the Rider palette. Charcoal is the primary colour for
 * buttons and text (high contrast on the light background); red is the brand accent.
 */
export const theme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.charcoal,
    onPrimary: "#FFFFFF",
    primaryContainer: "#DCE2EB",
    onPrimaryContainer: palette.charcoal,
    secondary: palette.red,
    onSecondary: "#FFFFFF",
    secondaryContainer: palette.redTint,
    onSecondaryContainer: palette.redDark,
    tertiary: palette.charcoalSoft,
    onTertiary: "#FFFFFF",
    tertiaryContainer: palette.surfaceMuted,
    onTertiaryContainer: palette.charcoal,
    error: palette.redDark,
    onError: "#FFFFFF",
    errorContainer: palette.redTint,
    onErrorContainer: palette.redDark,
    background: palette.background,
    onBackground: palette.charcoal,
    surface: palette.surface,
    onSurface: palette.charcoal,
    surfaceVariant: palette.surfaceMuted,
    onSurfaceVariant: palette.textMuted,
    outline: palette.outline,
    outlineVariant: "#E1E4E9",
    inverseSurface: palette.charcoal,
    inverseOnSurface: "#FFFFFF",
    inversePrimary: "#F2A3A3",
    surfaceDisabled: "rgba(36, 48, 66, 0.12)",
    onSurfaceDisabled: "rgba(36, 48, 66, 0.38)",
    backdrop: "rgba(36, 48, 66, 0.4)",
    elevation: {
      level0: "transparent",
      level1: "#FFFFFF",
      level2: "#FBFBFC",
      level3: "#F7F8FA",
      level4: "#F5F6F8",
      level5: "#F2F4F7",
    },
  },
};
