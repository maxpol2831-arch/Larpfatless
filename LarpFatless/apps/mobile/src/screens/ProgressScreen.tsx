import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Flame, TrendingDown } from "lucide-react-native";
import { weightLogs } from "../data/mock";
import { radii, spacing, useTheme } from "../theme";

export function ProgressScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const min = Math.min(...weightLogs.map((item) => item.value));
  const max = Math.max(...weightLogs.map((item) => item.value));
  const range = Math.max(max - min, 0.4);

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>История</Text>
      <Text style={styles.title}>Прогресс</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <TrendingDown size={28} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.heroNumber}>-0.7 кг</Text>
          <Text style={styles.heroText}>за последние 7 дней</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Вес</Text>
        <View style={styles.weightChart}>
          {weightLogs.map((item) => {
            const height = 48 + ((item.value - min) / range) * 104;
            return (
              <View key={item.label} style={styles.weightPoint}>
                <View style={[styles.weightBar, { height }]} />
                <Text style={styles.weightLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.streakCard}>
        <Flame size={26} color={colors.fat} />
        <View style={{ flex: 1 }}>
          <Text style={styles.streakTitle}>5 дней подряд</Text>
          <Text style={styles.streakText}>в пределах дневной нормы</Text>
        </View>
      </View>
    </ScrollView>
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  heroNumber: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  heroText: {
    color: colors.muted,
    fontWeight: "800"
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
    fontWeight: "900"
  },
  weightChart: {
    height: 210,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  weightPoint: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm
  },
  weightBar: {
    width: "100%",
    borderRadius: radii.md,
    backgroundColor: colors.primary
  },
  weightLabel: {
    color: colors.muted,
    fontWeight: "800"
  },
  streakCard: {
    minHeight: 82,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md
  },
  streakTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  streakText: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: 2
  }
});
