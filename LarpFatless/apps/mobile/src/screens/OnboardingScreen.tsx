import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, Check } from "lucide-react-native";
import { calculateDailyTargets } from "@larpfatless/shared/nutrition";
import { activityLabel, goalLabel } from "../lib/labels";
import { radii, spacing, useTheme } from "../theme";
import type { UserProfile } from "../types";

interface OnboardingScreenProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

const sexOptions = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" }
] as const;

const goalOptions = [
  { value: "lose", label: goalLabel.lose },
  { value: "maintain", label: goalLabel.maintain },
  { value: "gain", label: goalLabel.gain }
] as const;

const activityOptions = [
  { value: "light", label: activityLabel.light },
  { value: "moderate", label: activityLabel.moderate },
  { value: "active", label: activityLabel.active }
] as const;

export function OnboardingScreen({ initialProfile, onComplete }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const targets = useMemo(() => calculateDailyTargets(profile), [profile]);

  const updateNumber = (key: keyof Pick<UserProfile, "age" | "heightCm" | "weightKg">, value: string) => {
    const parsed = Number(value.replace(",", "."));
    setProfile((current) => ({ ...current, [key]: Number.isFinite(parsed) && parsed > 0 ? parsed : 1 }));
  };

  if (step === 0) {
    return (
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>LF</Text>
        </View>
        <Text style={styles.title}>LarpFatless</Text>
        <Text style={styles.subtitle}>Фото еды превращается в понятный дневник калорий, БЖУ и прогресса.</Text>
        <View style={styles.valueGrid}>
          {["Фото", "ИИ-оценка", "Дневник", "Прогресс"].map((item) => (
            <View style={styles.valueCell} key={item}>
              <Check size={18} color={colors.primary} />
              <Text style={styles.valueText}>{item}</Text>
            </View>
          ))}
        </View>
        <Pressable style={styles.primaryButton} onPress={() => setStep(1)}>
          <Text style={styles.primaryButtonText}>Настроить норму</Text>
          <ArrowRight size={20} color={colors.surface} />
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>Ваши ориентиры</Text>
        <Text style={styles.formSubtitle}>Норма считается по формуле Миффлина — Сан Жеора.</Text>

        <Text style={styles.fieldLabel}>Пол</Text>
        <View style={styles.segment}>
          {sexOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.segmentButton, profile.sex === option.value && styles.segmentButtonActive]}
              onPress={() => setProfile((current) => ({ ...current, sex: option.value }))}
            >
              <Text style={[styles.segmentText, profile.sex === option.value && styles.segmentTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputGrid}>
          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}>Возраст</Text>
            <TextInput
              value={String(profile.age)}
              onChangeText={(value) => updateNumber("age", value)}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}>Рост</Text>
            <TextInput
              value={String(profile.heightCm)}
              onChangeText={(value) => updateNumber("heightCm", value)}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.fieldLabel}>Вес</Text>
            <TextInput
              value={String(profile.weightKg)}
              onChangeText={(value) => updateNumber("weightKg", value)}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Цель</Text>
        <View style={styles.chips}>
          {goalOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, profile.goal === option.value && styles.chipActive]}
              onPress={() => setProfile((current) => ({ ...current, goal: option.value }))}
            >
              <Text style={[styles.chipText, profile.goal === option.value && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Активность</Text>
        <View style={styles.chips}>
          {activityOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.chip, profile.activityLevel === option.value && styles.chipActive]}
              onPress={() => setProfile((current) => ({ ...current, activityLevel: option.value }))}
            >
              <Text style={[styles.chipText, profile.activityLevel === option.value && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>Рекомендация на день</Text>
          <Text style={styles.targetNumber}>{targets.calories} ккал</Text>
          <Text style={styles.targetMacros}>
            Б {targets.protein} г · Ж {targets.fat} г · У {targets.carbs} г
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => onComplete(profile)}>
          <Text style={styles.primaryButtonText}>Перейти в дневник</Text>
          <ArrowRight size={20} color={colors.surface} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  keyboard: {
    flex: 1
  },
  hero: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center"
  },
  brandMark: {
    width: 82,
    height: 82,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl
  },
  brandMarkText: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: "900"
  },
  title: {
    color: colors.ink,
    fontSize: 42,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.md,
    maxWidth: 340
  },
  valueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl
  },
  valueCell: {
    width: "48%",
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md
  },
  valueText: {
    color: colors.ink,
    fontWeight: "800"
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900"
  },
  form: {
    padding: spacing.xl,
    paddingBottom: 48
  },
  formTitle: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "900"
  },
  formSubtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm,
    marginBottom: spacing.xl
  },
  fieldLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.lg
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentButtonActive: {
    backgroundColor: colors.surface
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: colors.primary
  },
  inputGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  inputWrap: {
    flex: 1
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  chip: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  chipText: {
    color: colors.muted,
    fontWeight: "800"
  },
  chipTextActive: {
    color: colors.primary
  },
  targetCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  targetLabel: {
    color: colors.muted,
    fontWeight: "700"
  },
  targetNumber: {
    color: colors.ink,
    fontSize: 38,
    fontWeight: "900",
    marginTop: 6
  },
  targetMacros: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 4
  }
});
