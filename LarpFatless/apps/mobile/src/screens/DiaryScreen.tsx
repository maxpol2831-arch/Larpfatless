import React, { useMemo } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Camera, Plus } from "lucide-react-native";
import { getMealTotals } from "@larpfatless/shared/nutrition";
import { CalorieRing } from "../components/CalorieRing";
import { MacroPill } from "../components/MacroPill";
import { MealCard } from "../components/MealCard";
import { radii, spacing, useTheme } from "../theme";
import type { MealEntry } from "../types";

interface DiaryScreenProps {
  meals: MealEntry[];
  targets: { calories: number; protein: number; fat: number; carbs: number };
  onAdd: () => void;
  onEdit: (meal: MealEntry) => void;
  onDelete: (meal: MealEntry) => void;
}

export function DiaryScreen({ meals, targets, onAdd, onEdit, onDelete }: DiaryScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const totals = useMemo(() => getMealTotals(meals), [meals]);

  return (
    <FlatList
      data={meals}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.kicker}>Сегодня</Text>
              <Text style={styles.title}>Дневник</Text>
            </View>
            <Pressable accessibilityLabel="Добавить приём пищи" style={styles.iconButton} onPress={onAdd}>
              <Plus size={24} color={colors.surface} />
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <CalorieRing consumed={totals.calories} target={targets.calories} />
            <View style={styles.macroStack}>
              <MacroPill label="Белки" value={totals.proteinGrams} target={targets.protein} color={colors.protein} />
              <MacroPill label="Жиры" value={totals.fatGrams} target={targets.fat} color={colors.fat} />
              <MacroPill label="Углеводы" value={totals.carbsGrams} target={targets.carbs} color={colors.carbs} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Приёмы пищи</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Camera size={34} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Дневник пуст</Text>
          <Text style={styles.emptyText}>Добавьте фото блюда или внесите еду вручную.</Text>
          <Pressable style={styles.emptyButton} onPress={onAdd}>
            <Text style={styles.emptyButtonText}>Добавить</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <MealCard
          meal={item}
          onPress={() => onEdit(item)}
          onDelete={() =>
            Alert.alert("Удалить приём пищи?", item.dishName, [
              { text: "Отмена", style: "cancel" },
              { text: "Удалить", style: "destructive", onPress: () => onDelete(item) }
            ])
          }
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
    />
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: 110
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.md
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
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
    marginTop: 2
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg
  },
  macroStack: {
    flex: 1,
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  empty: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
    marginTop: spacing.lg
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm
  },
  emptyButton: {
    minHeight: 46,
    minWidth: 136,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg
  },
  emptyButtonText: {
    color: colors.surface,
    fontWeight: "900"
  }
});
