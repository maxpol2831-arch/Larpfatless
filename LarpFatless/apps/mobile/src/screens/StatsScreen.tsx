import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { weeklyCalories } from "../data/mock";
import { radii, spacing, useTheme } from "../theme";

interface StatsScreenProps {
  targetCalories: number;
}

export function StatsScreen({ targetCalories }: StatsScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const maxValue = Math.max(...weeklyCalories, targetCalories);
  const average = Math.round(weeklyCalories.reduce((sum, item) => sum + item, 0) / weeklyCalories.length);
  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Неделя</Text>
      <Text style={styles.title}>Статистика</Text>

      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{average}</Text>
          <Text style={styles.metricLabel}>среднее ккал</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>5</Text>
          <Text style={styles.metricLabel}>дней в норме</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Калории</Text>
        <View style={styles.chart}>
          {weeklyCalories.map((value, index) => (
            <View key={labels[index]} style={styles.barWrap}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(12, (value / maxValue) * 100)}%`,
                      backgroundColor: value > targetCalories ? colors.fat : colors.primary
                    }
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{labels[index]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Баланс БЖУ</Text>
        <MacroLegend label="Белки" color={colors.protein} value="31%" />
        <MacroLegend label="Жиры" color={colors.fat} value="28%" />
        <MacroLegend label="Углеводы" color={colors.carbs} value="41%" />
      </View>
    </ScrollView>
  );
}

function MacroLegend({ label, color, value }: { label: string; color: string; value: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  root: {
    padding: spacing.lg,
    paddingBottom: 110
  },
  kicker: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 2,
    marginBottom: spacing.xl
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  metric: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg
  },
  metricValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: 4
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginTop: spacing.md
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.lg
  },
  chart: {
    height: 220,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  barWrap: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm
  },
  barTrack: {
    height: 180,
    width: "100%",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  bar: {
    width: "100%",
    borderRadius: radii.md
  },
  barLabel: {
    color: colors.muted,
    fontWeight: "800"
  },
  legendRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  legendLabel: {
    flex: 1,
    color: colors.ink,
    fontWeight: "800"
  },
  legendValue: {
    color: colors.muted,
    fontWeight: "900"
  }
});
