import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Download, Moon, ShieldCheck, Smartphone } from "lucide-react-native";
import { activityLabel, goalLabel } from "../lib/labels";
import { radii, spacing, useTheme } from "../theme";
import type { ThemeMode, UserProfile } from "../types";

interface ProfileScreenProps {
  profile: UserProfile;
  targets: { calories: number; protein: number; fat: number; carbs: number };
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onProfileChange: (profile: UserProfile) => void;
  onLogout: () => void;
}

const themeModes: Array<{ value: ThemeMode; label: string }> = [
  { value: "system", label: "СЃРёСЃС‚РµРјРЅР°СЏ" },
  { value: "light", label: "СЃРІРµС‚Р»Р°СЏ" },
  { value: "dark", label: "С‚С‘РјРЅР°СЏ" }
];

export function ProfileScreen({ profile, targets, themeMode, onThemeModeChange, onProfileChange, onLogout }: ProfileScreenProps) {
  const { colors, resolvedMode } = useTheme();
  const styles = createStyles(colors);
  const [reminders, setReminders] = useState(true);

  const updateNumber = (key: "age" | "heightCm" | "weightKg", value: string) => {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onProfileChange({ ...profile, [key]: parsed });
  };

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>РђРєРєР°СѓРЅС‚</Text>
      <Text style={styles.title}>РџСЂРѕС„РёР»СЊ</Text>

      <View style={styles.card}>
        <Text style={styles.name}>Р’Р°С€ РїР»Р°РЅ</Text>
        <Text style={styles.big}>{targets.calories} РєРєР°Р»</Text>
        <Text style={styles.muted}>
          {goalLabel[profile.goal]} В· {activityLabel[profile.activityLevel]}
        </Text>
        <Text style={styles.macroText}>
          Р‘ {targets.protein} Рі В· Р– {targets.fat} Рі В· РЈ {targets.carbs} Рі
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Р”Р°РЅРЅС‹Рµ РїСЂРѕС„РёР»СЏ</Text>
        <View style={styles.inputGrid}>
          <ProfileField label="Р’РѕР·СЂР°СЃС‚" value={String(profile.age)} onChangeText={(value) => updateNumber("age", value)} />
          <ProfileField label="Р РѕСЃС‚" value={String(profile.heightCm)} onChangeText={(value) => updateNumber("heightCm", value)} />
          <ProfileField label="Р’РµСЃ" value={String(profile.weightKg)} onChangeText={(value) => updateNumber("weightKg", value)} />
        </View>
        <Text style={styles.fieldLabel}>Р¦РµР»СЊ</Text>
        <View style={styles.chips}>
          {(["lose", "maintain", "gain"] as const).map((goal) => (
            <Pressable key={goal} style={[styles.chip, profile.goal === goal && styles.chipActive]} onPress={() => onProfileChange({ ...profile, goal })}>
              <Text style={[styles.chipText, profile.goal === goal && styles.chipTextActive]}>{goalLabel[goal]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <SettingsRow label="РќР°РїРѕРјРёРЅР°РЅРёСЏ" value={reminders} onValueChange={setReminders} icon="moon" />
        <View style={styles.themeSection}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsIcon}>
              <Smartphone size={18} color={colors.primary} />
            </View>
            <View style={styles.themeLabelWrap}>
              <Text style={styles.settingsLabel}>РўРµРјР°</Text>
              <Text style={styles.themeHint}>РЎРµР№С‡Р°СЃ Р°РєС‚РёРІРЅР° {resolvedMode === "dark" ? "С‚С‘РјРЅР°СЏ" : "СЃРІРµС‚Р»Р°СЏ"}</Text>
            </View>
          </View>
          <View style={styles.themeModes}>
            {themeModes.map((item) => (
              <Pressable key={item.value} style={[styles.themeChip, themeMode === item.value && styles.themeChipActive]} onPress={() => onThemeModeChange(item.value)}>
                <Text style={[styles.themeChipText, themeMode === item.value && styles.themeChipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <ShieldCheck size={24} color={colors.primary} />
        <View style={styles.flex}>
          <Text style={styles.infoTitle}>РџСЂРёРІР°С‚РЅРѕСЃС‚СЊ</Text>
          <Text style={styles.infoText}>Р¤РѕС‚Рѕ РѕС‚РїСЂР°РІР»СЏСЋС‚СЃСЏ С‚РѕР»СЊРєРѕ РЅР° backend LarpFatless, РєР»СЋС‡ РР С…СЂР°РЅРёС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂРµ.</Text>
        </View>
      </View>

      <Pressable style={styles.exportButton}>
        <Download size={20} color={colors.surface} />
        <Text style={styles.exportText}>Р­РєСЃРїРѕСЂС‚ CSV</Text>
      </Pressable>
      <Pressable style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Р’С‹Р№С‚Рё Рё РѕС‡РёСЃС‚РёС‚СЊ РєСЌС€</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfileField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.profileField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} keyboardType="decimal-pad" onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

function SettingsRow({ label, value, onValueChange, icon }: { label: string; value: boolean; onValueChange: (value: boolean) => void; icon: "moon" }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsIcon}>
        <Moon size={18} color={colors.primary} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primarySoft, false: colors.line }} thumbColor={value ? colors.primary : colors.surface} />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      padding: spacing.lg,
      paddingBottom: 110
    },
    flex: {
      flex: 1
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      marginBottom: spacing.md
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: spacing.md
    },
    inputGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md
    },
    profileField: {
      flex: 1
    },
    fieldLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: spacing.xs
    },
    input: {
      minHeight: 46,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceMuted,
      color: colors.ink,
      paddingHorizontal: spacing.md,
      fontWeight: "900"
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    chip: {
      minHeight: 40,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      justifyContent: "center"
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    chipText: {
      color: colors.muted,
      fontWeight: "800"
    },
    chipTextActive: {
      color: colors.primary
    },
    name: {
      color: colors.muted,
      fontWeight: "800"
    },
    big: {
      color: colors.ink,
      fontSize: 38,
      fontWeight: "900",
      marginTop: 4
    },
    muted: {
      color: colors.muted,
      fontWeight: "800",
      marginTop: 4
    },
    macroText: {
      color: colors.ink,
      fontWeight: "900",
      marginTop: spacing.md
    },
    settingsRow: {
      minHeight: 58,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    settingsIcon: {
      width: 38,
      height: 38,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center"
    },
    settingsLabel: {
      flex: 1,
      color: colors.ink,
      fontSize: 16,
      fontWeight: "900"
    },
    themeSection: {
      marginTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: spacing.md
    },
    themeLabelWrap: {
      flex: 1
    },
    themeHint: {
      color: colors.muted,
      marginTop: 2
    },
    themeModes: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    themeChip: {
      minHeight: 40,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.md,
      justifyContent: "center"
    },
    themeChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft
    },
    themeChipText: {
      color: colors.muted,
      fontWeight: "800"
    },
    themeChipTextActive: {
      color: colors.primary
    },
    infoCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: radii.md,
      padding: spacing.lg,
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md
    },
    infoTitle: {
      color: colors.ink,
      fontWeight: "900"
    },
    infoText: {
      color: colors.muted,
      lineHeight: 20,
      marginTop: 2
    },
    exportButton: {
      minHeight: 54,
      borderRadius: radii.md,
      backgroundColor: colors.ink,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm
    },
    exportText: {
      color: colors.surface,
      fontWeight: "900"
    },
    logoutButton: {
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.md
    },
    logoutText: {
      color: colors.danger,
      fontWeight: "900"
    }
  });
