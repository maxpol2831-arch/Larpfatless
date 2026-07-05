import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BarChart3, History, Home, Plus, User } from "lucide-react-native";
import { radii, useTheme } from "../theme";
import type { TabKey } from "../types";

interface BottomTabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const tabs = [
  { key: "diary", label: "Р”РЅРµРІРЅРёРє", Icon: Home },
  { key: "stats", label: "РЎС‚Р°С‚РёСЃС‚РёРєР°", Icon: BarChart3 },
  { key: "add", label: "Р”РѕР±Р°РІРёС‚СЊ", Icon: Plus },
  { key: "progress", label: "РџСЂРѕРіСЂРµСЃСЃ", Icon: History },
  { key: "profile", label: "РџСЂРѕС„РёР»СЊ", Icon: User }
] as const;

export function BottomTabs({ active, onChange }: BottomTabsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.root}>
      {tabs.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const isAdd = key === "add";

        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={({ pressed }) => [styles.item, isAdd && styles.addSlot, pressed && styles.pressed]}
            onPress={() => onChange(key)}
          >
            <View style={[isAdd ? styles.addButton : styles.iconOnly, isActive && !isAdd && styles.iconActive]}>
              <Icon size={isAdd ? 30 : 22} color={isAdd ? colors.surface : isActive ? colors.primary : colors.muted} />
            </View>
            {!isAdd && <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.line
    },
    item: {
      flex: 1,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      gap: 3
    },
    addSlot: {
      transform: [{ translateY: -16 }]
    },
    pressed: {
      opacity: 0.76
    },
    iconOnly: {
      width: 34,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md
    },
    iconActive: {
      backgroundColor: colors.primarySoft
    },
    addButton: {
      width: 62,
      height: 62,
      borderRadius: radii.round,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOpacity: 0.32,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5
    },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "700"
    },
    labelActive: {
      color: colors.primary
    }
  });
