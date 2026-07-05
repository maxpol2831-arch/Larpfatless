import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../theme";

interface CalorieRingProps {
  consumed: number;
  target: number;
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const size = 184;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / target, 1.1);
  const dashOffset = circumference - circumference * Math.min(progress, 1);

  return (
    <View style={styles.root} accessibilityLabel={`РЎСЉРµРґРµРЅРѕ ${consumed} РёР· ${target} РєРёР»РѕРєР°Р»РѕСЂРёР№`}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progress > 1 ? colors.fat : colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.content}>
        <Text style={styles.number}>{consumed}</Text>
        <Text style={styles.caption}>РёР· {target} РєРєР°Р»</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      width: 184,
      height: 184,
      alignItems: "center",
      justifyContent: "center"
    },
    content: {
      position: "absolute",
      alignItems: "center"
    },
    number: {
      color: colors.ink,
      fontSize: 44,
      fontWeight: "800"
    },
    caption: {
      color: colors.muted,
      fontSize: 15,
      marginTop: 2
    }
  });
