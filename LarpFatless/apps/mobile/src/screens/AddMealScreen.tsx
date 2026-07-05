import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Search } from "lucide-react-native";
import type { FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import { fallbackAnalysis } from "../data/mock";
import { analyzeFoodPhoto } from "../services/api";
import { radii, spacing, useTheme } from "../theme";

interface AddMealScreenProps {
  onAnalysis: (analysis: FoodAnalysis, photoUri?: string) => void;
}

export function AddMealScreen({ onAnalysis }: AddMealScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const runPicker = async (source: "camera" | "library") => {
    setError("");
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("РќСѓР¶РЅРѕ СЂР°Р·СЂРµС€РµРЅРёРµ, С‡С‚РѕР±С‹ РґРѕР±Р°РІРёС‚СЊ С„РѕС‚Рѕ.");
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85, aspect: [4, 3] })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85, aspect: [4, 3] });

    if (result.canceled || !result.assets[0]?.uri) return;

    setIsLoading(true);
    try {
      const analysis = await analyzeFoodPhoto(result.assets[0].uri);
      onAnalysis(analysis, result.assets[0].uri);
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : "РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°СЃРїРѕР·РЅР°С‚СЊ С„РѕС‚Рѕ.");
    } finally {
      setIsLoading(false);
    }
  };

  const addManual = () => {
    onAnalysis({
      ...fallbackAnalysis,
      dishName: query.trim() || fallbackAnalysis.dishName,
      confidence: 1,
      notes: "Р”РѕР±Р°РІР»РµРЅРѕ РІСЂСѓС‡РЅСѓСЋ. РџСЂРѕРІРµСЂСЊС‚Рµ Р·РЅР°С‡РµРЅРёСЏ РїРµСЂРµРґ СЃРѕС…СЂР°РЅРµРЅРёРµРј."
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>Р”РѕР±Р°РІРёС‚СЊ</Text>
      <Text style={styles.title}>Р§С‚Рѕ РІС‹ СЃСЉРµР»Рё?</Text>

      <View style={styles.photoPanel}>
        <Pressable style={styles.photoAction} onPress={() => runPicker("camera")} disabled={isLoading}>
          <Camera size={30} color={colors.primary} />
          <Text style={styles.photoTitle}>РЎРґРµР»Р°С‚СЊ С„РѕС‚Рѕ</Text>
        </Pressable>
        <Pressable style={styles.photoAction} onPress={() => runPicker("library")} disabled={isLoading}>
          <ImagePlus size={30} color={colors.primary} />
          <Text style={styles.photoTitle}>Р’С‹Р±СЂР°С‚СЊ РёР· РіР°Р»РµСЂРµРё</Text>
        </Pressable>
      </View>

      {isLoading && (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>РР Р°РЅР°Р»РёР·РёСЂСѓРµС‚ С„РѕС‚Рѕ...</Text>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.manual}>
        <Text style={styles.sectionTitle}>Р СѓС‡РЅРѕР№ РІРІРѕРґ</Text>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="РќР°РїСЂРёРјРµСЂ, РѕРІСЃСЏРЅРєР° СЃ Р±Р°РЅР°РЅРѕРј"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.suggestions}>
          {["РћРјР»РµС‚", "РљСѓСЂРёРЅС‹Р№ СЃР°Р»Р°С‚", "РўРІРѕСЂРѕРі", "РџР°СЃС‚Р°"].map((item) => (
            <Pressable key={item} style={styles.suggestion} onPress={() => setQuery(item)}>
              <Text style={styles.suggestionText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.manualButton} onPress={addManual}>
          <Text style={styles.manualButtonText}>Р—Р°РїРѕР»РЅРёС‚СЊ РєР°СЂС‚РѕС‡РєСѓ</Text>
        </Pressable>
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
    photoPanel: {
      flexDirection: "row",
      gap: spacing.md
    },
    photoAction: {
      flex: 1,
      minHeight: 164,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.lg
    },
    photoTitle: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "900",
      textAlign: "center"
    },
    loading: {
      minHeight: 54,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg
    },
    loadingText: {
      color: colors.primary,
      fontWeight: "900"
    },
    error: {
      color: colors.danger,
      fontWeight: "800",
      marginTop: spacing.md
    },
    manual: {
      marginTop: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "900",
      marginBottom: spacing.md
    },
    searchBox: {
      minHeight: 52,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceMuted,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md
    },
    searchInput: {
      flex: 1,
      color: colors.ink,
      fontSize: 16,
      fontWeight: "700"
    },
    suggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    suggestion: {
      minHeight: 38,
      borderRadius: radii.md,
      backgroundColor: colors.primarySoft,
      justifyContent: "center",
      paddingHorizontal: spacing.md
    },
    suggestionText: {
      color: colors.primary,
      fontWeight: "800"
    },
    manualButton: {
      minHeight: 50,
      borderRadius: radii.md,
      backgroundColor: colors.ink,
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.lg
    },
    manualButtonText: {
      color: colors.surface,
      fontWeight: "900"
    }
  });
