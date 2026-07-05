import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Pencil, Trash2 } from "lucide-react-native";
import { mealTypeLabel } from "../lib/labels";
import { radii, spacing, useTheme } from "../theme";
import type { MealEntry } from "../types";

interface MealCardProps {
  meal: MealEntry;
  onPress?: () => void;
  onDelete?: () => void;
}

export function MealCard({ meal, onPress, onDelete }: MealCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrap}>
      <Pressable style={({ pressed }) => [styles.root, pressed && styles.pressed]} onPress={onPress}>
        {meal.photoUri ? (
          <Image source={{ uri: meal.photoUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>LF</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.type}>{mealTypeLabel[meal.mealType]}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {meal.dishName}
          </Text>
          <Text style={styles.macros}>
            Р‘ {Math.round(meal.proteinGrams)} В· Р– {Math.round(meal.fatGrams)} В· РЈ {Math.round(meal.carbsGrams)}
          </Text>
        </View>
        <View style={styles.kcalBox}>
          <Text style={styles.kcal}>{meal.calories}</Text>
          <Text style={styles.kcalLabel}>РєРєР°Р»</Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={onPress}>
          <Pencil size={16} color={colors.primary} />
          <Text style={styles.actionText}>РР·РјРµРЅРёС‚СЊ</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <Trash2 size={16} color={colors.danger} />
          <Text style={[styles.actionText, styles.deleteText]}>РЈРґР°Р»РёС‚СЊ</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: "hidden"
    },
    root: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    pressed: {
      opacity: 0.82
    },
    image: {
      width: 58,
      height: 58,
      borderRadius: radii.md
    },
    placeholder: {
      width: 58,
      height: 58,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center"
    },
    placeholderText: {
      color: colors.primary,
      fontWeight: "800"
    },
    body: {
      flex: 1,
      minWidth: 0
    },
    type: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 2
    },
    title: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "800"
    },
    macros: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 4
    },
    kcalBox: {
      alignItems: "flex-end"
    },
    kcal: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "800"
    },
    kcalLabel: {
      color: colors.muted,
      fontSize: 12
    },
    actions: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: colors.line
    },
    actionButton: {
      flex: 1,
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.surface
    },
    deleteButton: {
      borderLeftWidth: 1,
      borderLeftColor: colors.line
    },
    actionText: {
      color: colors.primary,
      fontWeight: "900",
      fontSize: 13
    },
    deleteText: {
      color: colors.danger
    }
  });
