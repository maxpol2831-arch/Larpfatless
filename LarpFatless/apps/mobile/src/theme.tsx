import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import type { ThemeMode } from "./types";

const lightColors = {
  background: "#F7F8F3",
  surface: "#FFFFFF",
  surfaceMuted: "#EFF3EA",
  ink: "#17231D",
  muted: "#68746C",
  line: "#E1E7DC",
  primary: "#1E8A63",
  primarySoft: "#DFF2E9",
  protein: "#2563EB",
  fat: "#F59E0B",
  carbs: "#8B5CF6",
  danger: "#D94841",
  shadow: "rgba(20, 35, 28, 0.12)"
};

const darkColors = {
  background: "#101511",
  surface: "#17211B",
  surfaceMuted: "#202B24",
  ink: "#F4F7F2",
  muted: "#AAB6AE",
  line: "#314139",
  primary: "#29A676",
  primarySoft: "#173F31",
  protein: "#69A2FF",
  fat: "#F7B731",
  carbs: "#A78BFA",
  danger: "#F1635B",
  shadow: "rgba(0, 0, 0, 0.35)"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

export const radii = {
  sm: 6,
  md: 8,
  round: 999
};

export type ThemeColors = typeof lightColors;
type EffectiveThemeMode = Exclude<ThemeMode, "system">;

interface ThemeValue {
  colors: ThemeColors;
  themeMode: ThemeMode;
  resolvedMode: EffectiveThemeMode;
}

const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  themeMode: "light",
  resolvedMode: "light"
});

export function ThemeProvider({ themeMode, children }: { themeMode: ThemeMode; children: React.ReactNode }) {
  const systemMode = useColorScheme() === "dark" ? "dark" : "light";
  const resolvedMode = themeMode === "system" ? systemMode : themeMode;

  const value = useMemo<ThemeValue>(
    () => ({
      colors: resolvedMode === "dark" ? darkColors : lightColors,
      themeMode,
      resolvedMode
    }),
    [resolvedMode, themeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export const colors = lightColors;
