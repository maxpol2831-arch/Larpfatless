import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, useTheme } from "../theme";

interface MacroPillProps {
  label: string;
  value: number;
  target: number;
  color: string;
}

export function MacroPill({ label, value, target, color }: MacroPillProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const progress = Math.min(value / Math.max(target, 1), 1);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(value)} / {target} Рі
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      gap: 7
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8
    },
    label: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "700"
    },
    value: {
      color: colors.muted,
      fontSize: 13
    },
    track: {
      height: 8,
      borderRadius: radii.sm,
      backgroundColor: colors.surfaceMuted,
      overflow: "hidden"
    },
    fill: {
      height: "100%",
      borderRadius: radii.sm
    }
  });
