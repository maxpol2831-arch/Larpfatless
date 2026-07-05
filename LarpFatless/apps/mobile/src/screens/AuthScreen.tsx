import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, LogIn } from "lucide-react-native";
import { radii, spacing, useTheme } from "../theme";
import type { AuthMode, AuthSession } from "../types";

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegisterStart: (session: AuthSession, password: string) => void;
}

export function AuthScreen({ onLogin, onRegisterStart }: AuthScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Р’РІРµРґРёС‚Рµ email Рё РїР°СЂРѕР»СЊ.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email.trim(), password);
      } else {
        onRegisterStart({ email: email.trim(), token: "", displayName: displayName.trim() || undefined }, password);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "РќРµ СѓРґР°Р»РѕСЃСЊ РІРѕР№С‚Рё.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.root}>
      <View style={styles.card}>
        <View style={styles.brand}>
          <LogIn size={28} color={colors.surface} />
        </View>
        <Text style={styles.title}>LarpFatless</Text>
        <Text style={styles.subtitle}>Р’РѕР№РґРёС‚Рµ, С‡С‚РѕР±С‹ РїСЂРѕС„РёР»СЊ Рё РґРЅРµРІРЅРёРє РІРѕСЃСЃС‚Р°РЅР°РІР»РёРІР°Р»РёСЃСЊ РЅР° Р»СЋР±РѕРј СѓСЃС‚СЂРѕР№СЃС‚РІРµ.</Text>

        <View style={styles.segment}>
          <Pressable style={[styles.segmentButton, mode === "login" && styles.segmentButtonActive]} onPress={() => setMode("login")}>
            <Text style={[styles.segmentText, mode === "login" && styles.segmentTextActive]}>Р’С…РѕРґ</Text>
          </Pressable>
          <Pressable style={[styles.segmentButton, mode === "register" && styles.segmentButtonActive]} onPress={() => setMode("register")}>
            <Text style={[styles.segmentText, mode === "register" && styles.segmentTextActive]}>Р РµРіРёСЃС‚СЂР°С†РёСЏ</Text>
          </Pressable>
        </View>

        {mode === "register" && (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="РљР°Рє РІР°СЃ РЅР°Р·С‹РІР°С‚СЊ"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        )}
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="Email" placeholderTextColor={colors.muted} style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="РџР°СЂРѕР»СЊ" placeholderTextColor={colors.muted} style={styles.input} />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} onPress={submit} disabled={isLoading}>
          <Text style={styles.primaryButtonText}>{mode === "login" ? "Р’РѕР№С‚Рё" : "РџСЂРѕРґРѕР»Р¶РёС‚СЊ Рє РѕРЅР±РѕСЂРґРёРЅРіСѓ"}</Text>
          <ArrowRight size={18} color={colors.surface} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    root: {
      flex: 1,
      padding: spacing.xl,
      justifyContent: "center"
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.xl
    },
    brand: {
      width: 64,
      height: 64,
      borderRadius: radii.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.lg
    },
    title: {
      color: colors.ink,
      fontSize: 34,
      fontWeight: "900"
    },
    subtitle: {
      color: colors.muted,
      lineHeight: 22,
      marginTop: spacing.sm,
      marginBottom: spacing.lg
    },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      padding: 4,
      marginBottom: spacing.md
    },
    segmentButton: {
      flex: 1,
      minHeight: 42,
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
    input: {
      minHeight: 52,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      color: colors.ink,
      paddingHorizontal: spacing.md,
      fontWeight: "700",
      marginTop: spacing.sm
    },
    error: {
      color: colors.danger,
      fontWeight: "800",
      marginTop: spacing.md
    },
    primaryButton: {
      minHeight: 54,
      borderRadius: radii.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    primaryButtonDisabled: {
      opacity: 0.7
    },
    primaryButtonText: {
      color: colors.surface,
      fontWeight: "900",
      fontSize: 16
    }
  });
