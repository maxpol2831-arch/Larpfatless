import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import Slider from "@react-native-community/slider";
import { Check, ChevronLeft } from "lucide-react-native";
import { getConfidenceLabel, type FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import { scaleNutritionByPortion } from "@larpfatless/shared/nutrition";
import { mealTypeLabel } from "../lib/labels";
import { radii, spacing, useTheme } from "../theme";
import type { MealEntry, MealType } from "../types";

interface AnalyzeResultScreenProps {
  analysis: FoodAnalysis;
  existingMeal?: MealEntry;
  photoUri?: string;
  onBack: () => void;
  onSave: (meal: MealEntry) => void;
}

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const numberValue = (value: string) => Number(value.replace(",", ".")) || 0;

export function AnalyzeResultScreen({ analysis, existingMeal, photoUri, onBack, onSave }: AnalyzeResultScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [draft, setDraft] = useState(analysis);
  const [ratio, setRatio] = useState(1);
  const [autoScale, setAutoScale] = useState(true);
  const [mealType, setMealType] = useState<MealType>(existingMeal?.mealType ?? "lunch");
  const [timeText, setTimeText] = useState(() => {
    const date = existingMeal?.eatenAt ? new Date(existingMeal.eatenAt) : new Date();
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  });
  const scaled = useMemo(() => (autoScale ? scaleNutritionByPortion(draft, ratio) : { ...draft, eatenRatio: ratio }), [autoScale, draft, ratio]);

  const updateNumber = (key: keyof Pick<FoodAnalysis, "calories" | "proteinGrams" | "fatGrams" | "carbsGrams" | "portionGrams">, value: string) => {
    setDraft((current) => ({ ...current, [key]: numberValue(value) }));
  };

  const save = () => {
    const [hours, minutes] = timeText.split(":").map((part) => Number(part));
    const eatenAt = new Date(existingMeal?.eatenAt ?? Date.now());
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      eatenAt.setHours(hours, minutes, 0, 0);
    }

    onSave({
      ...scaled,
      id: existingMeal?.id ?? `meal-${Date.now()}`,
      mealType,
      eatenAt: eatenAt.toISOString(),
      photoUri: photoUri ?? existingMeal?.photoUri
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <ChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.kicker}>{existingMeal ? "Редактирование" : "Результат ИИ"}</Text>
      </View>

      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <View style={styles.photoPlaceholder} />}

      <View style={styles.card}>
        <TextInput
          value={draft.dishName}
          onChangeText={(dishName) => setDraft((current) => ({ ...current, dishName }))}
          style={styles.dishInput}
        />
        <Text style={styles.confidence}>{getConfidenceLabel(draft.confidence)} · {Math.round(draft.confidence * 100)}%</Text>

        <View style={styles.nutritionGrid}>
          <EditableStat label="Ккал" value={String(Math.round(draft.calories))} onChangeText={(value) => updateNumber("calories", value)} />
          <EditableStat label="Белки" value={String(draft.proteinGrams)} onChangeText={(value) => updateNumber("proteinGrams", value)} />
          <EditableStat label="Жиры" value={String(draft.fatGrams)} onChangeText={(value) => updateNumber("fatGrams", value)} />
          <EditableStat label="Углеводы" value={String(draft.carbsGrams)} onChangeText={(value) => updateNumber("carbsGrams", value)} />
        </View>

        <Text style={styles.sectionTitle}>Порция</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Автопересчёт при изменении порции</Text>
          <Switch value={autoScale} onValueChange={setAutoScale} trackColor={{ true: colors.primarySoft, false: colors.line }} thumbColor={autoScale ? colors.primary : colors.surface} />
        </View>
        <Text style={styles.portionText}>
          {Math.round(scaled.portionGrams)} г · {Math.round(ratio * 100)}%
        </Text>
        <Slider
          value={ratio}
          minimumValue={0.25}
          maximumValue={1.5}
          step={0.05}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.line}
          thumbTintColor={colors.primary}
          onValueChange={setRatio}
        />

        <Text style={styles.sectionTitle}>Ингредиенты</Text>
        <View style={styles.ingredients}>
          {draft.ingredients.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.ingredient}>
              <Text style={styles.ingredientName}>{item.name}</Text>
              <Text style={styles.ingredientGrams}>{Math.round(item.estimatedGrams * ratio)} г</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Приём пищи</Text>
        <View style={styles.mealTypes}>
          {mealTypes.map((type) => (
            <Pressable key={type} style={[styles.mealChip, mealType === type && styles.mealChipActive]} onPress={() => setMealType(type)}>
              <Text style={[styles.mealChipText, mealType === type && styles.mealChipTextActive]}>{mealTypeLabel[type]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Время</Text>
        <TextInput value={timeText} onChangeText={setTimeText} placeholder="13:30" keyboardType="numbers-and-punctuation" style={styles.timeInput} />

        {!!draft.notes && <Text style={styles.notes}>{draft.notes}</Text>}

        <Pressable style={styles.saveButton} onPress={save}>
          <Check size={20} color={colors.surface} />
          <Text style={styles.saveButtonText}>{existingMeal ? "Сохранить изменения" : "Сохранить в дневник"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function EditableStat({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.stat}>
      <TextInput value={value} onChangeText={onChangeText} keyboardType="decimal-pad" style={styles.statInput} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  root: {
    padding: spacing.lg,
    paddingBottom: 110
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line
  },
  kicker: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
  },
  photo: {
    width: "100%",
    height: 230,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  photoPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg
  },
  dishInput: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900",
    padding: 0
  },
  confidence: {
    color: colors.muted,
    fontWeight: "800",
    marginTop: spacing.xs,
    marginBottom: spacing.lg
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  stat: {
    width: "48%",
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md
  },
  statInput: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900",
    padding: 0
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  portionText: {
    color: colors.muted,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  switchRow: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  switchLabel: {
    flex: 1,
    color: colors.ink,
    fontWeight: "800"
  },
  ingredients: {
    gap: spacing.sm
  },
  ingredient: {
    minHeight: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  ingredientName: {
    color: colors.ink,
    fontWeight: "800"
  },
  ingredientGrams: {
    color: colors.muted,
    fontWeight: "800"
  },
  mealTypes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  mealChip: {
    minHeight: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    justifyContent: "center"
  },
  mealChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  mealChipText: {
    color: colors.muted,
    fontWeight: "800"
  },
  mealChipTextActive: {
    color: colors.primary
  },
  notes: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: spacing.lg
  },
  timeInput: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    paddingHorizontal: spacing.md
  },
  saveButton: {
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: "900",
    fontSize: 16
  }
});
