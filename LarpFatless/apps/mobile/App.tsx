import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import { calculateDailyTargets } from "@larpfatless/shared/nutrition";
import { BottomTabs } from "./src/components/BottomTabs";
import { demoProfile } from "./src/data/mock";
import { AuthScreen } from "./src/screens/AuthScreen";
import { AddMealScreen } from "./src/screens/AddMealScreen";
import { AnalyzeResultScreen } from "./src/screens/AnalyzeResultScreen";
import { DiaryScreen } from "./src/screens/DiaryScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import {
  deleteMeal as deleteMealRemote,
  fetchMeals,
  fetchProfile,
  loginWithEmail,
  registerWithEmail,
  saveMeal as saveMealRemote,
  updateProfile as updateProfileRemote
} from "./src/services/api";
import { clearStoredAppState, loadStoredAppState, saveStoredAppState } from "./src/services/localStore";
import { ThemeProvider, colors, useTheme } from "./src/theme";
import type { AuthSession, MealEntry, TabKey, ThemeMode, UserProfile } from "./src/types";

export default function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("diary");
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [pendingPassword, setPendingPassword] = useState("");
  const [pendingAnalysis, setPendingAnalysis] = useState<FoodAnalysis | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | undefined>();
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [deletedMeal, setDeletedMeal] = useState<MealEntry | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targets = useMemo(() => calculateDailyTargets(profile), [profile]);

  useEffect(() => {
    loadStoredAppState()
      .then((stored) => {
        if (stored) {
          setIsOnboarded(stored.isOnboarded);
          setProfile(stored.profile);
          setMeals(stored.meals);
          setThemeMode(stored.themeMode ?? "system");
          setSession(stored.session ?? null);
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStoredAppState({ isOnboarded, profile, meals, themeMode, session }).catch(() => undefined);
  }, [isHydrated, isOnboarded, profile, meals, themeMode, session]);

  useEffect(() => {
    if (!isHydrated || !session?.token) return;

    fetchProfile(session.token)
      .then((serverProfile) => {
        setProfile(serverProfile);
        setIsOnboarded(true);
      })
      .catch(() => undefined);

    fetchMeals(session.token)
      .then((serverMeals) => setMeals(serverMeals))
      .catch(() => undefined);
  }, [isHydrated, session?.token]);

  const completeOnboarding = async (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    if (session && pendingPassword) {
      const registered = await registerWithEmail(session, pendingPassword, nextProfile);
      setSession(registered.session);
      setPendingPassword("");
    } else if (session?.token) {
      await updateProfileRemote(session.token, nextProfile).catch(() => undefined);
    }
    setIsOnboarded(true);
    setActiveTab("diary");
  };

  const handleAnalysis = (analysis: FoodAnalysis, photoUri?: string) => {
    setPendingAnalysis(analysis);
    setPendingPhotoUri(photoUri);
    setEditingMeal(null);
    setActiveTab("add");
  };

  const upsertMealLocally = (meal: MealEntry) =>
    setMeals((current) => {
      const exists = current.some((item) => item.id === meal.id);
      return exists ? current.map((item) => (item.id === meal.id ? meal : item)) : [meal, ...current];
    });

  const handleSaveMeal = async (meal: MealEntry) => {
    const nextMeal = session?.token ? await saveMealRemote(session.token, meal).catch(() => meal) : meal;
    upsertMealLocally(nextMeal);
    setPendingAnalysis(null);
    setPendingPhotoUri(undefined);
    setEditingMeal(null);
    setActiveTab("diary");
  };

  const handleEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal);
    setPendingAnalysis(null);
    setPendingPhotoUri(undefined);
    setActiveTab("add");
  };

  const handleDeleteMeal = async (meal: MealEntry) => {
    setMeals((current) => current.filter((item) => item.id !== meal.id));
    if (session?.token) {
      await deleteMealRemote(session.token, meal.id).catch(() => undefined);
    }
    setDeletedMeal(meal);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setDeletedMeal(null), 5000);
  };

  const undoDelete = () => {
    if (!deletedMeal) return;
    setMeals((current) => [deletedMeal, ...current]);
    setDeletedMeal(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const logout = async () => {
    await clearStoredAppState();
    setSession(null);
    setPendingPassword("");
    setIsOnboarded(false);
    setProfile(demoProfile);
    setMeals([]);
    setThemeMode("system");
    setPendingAnalysis(null);
    setPendingPhotoUri(undefined);
    setEditingMeal(null);
    setActiveTab("diary");
  };

  const renderScreen = () => {
    if (!isHydrated) {
      return <LoadingScreen />;
    }

    if (!session) {
      return (
        <AuthScreen
          onLogin={async (email, password) => {
            const result = await loginWithEmail(email, password);
            setSession(result.session);
            setProfile(result.profile);
            setPendingPassword("");
            setIsOnboarded(true);
            setActiveTab("diary");
            const remoteMeals = await fetchMeals(result.session.token).catch(() => []);
            setMeals(remoteMeals);
          }}
          onRegisterStart={(nextSession, password) => {
            setSession(nextSession);
            setPendingPassword(password);
          }}
        />
      );
    }

    if (!isOnboarded) {
      return <OnboardingScreen initialProfile={profile} onComplete={completeOnboarding} />;
    }

    if (activeTab === "add" && (pendingAnalysis || editingMeal)) {
      return (
        <AnalyzeResultScreen
          analysis={(pendingAnalysis ?? editingMeal) as FoodAnalysis}
          existingMeal={editingMeal ?? undefined}
          photoUri={pendingPhotoUri}
          onBack={() => {
            setPendingAnalysis(null);
            setPendingPhotoUri(undefined);
            setEditingMeal(null);
          }}
          onSave={handleSaveMeal}
        />
      );
    }

    switch (activeTab) {
      case "stats":
        return <StatsScreen targetCalories={targets.calories} />;
      case "add":
        return <AddMealScreen onAnalysis={handleAnalysis} />;
      case "progress":
        return <ProgressScreen />;
      case "profile":
        return (
          <ProfileScreen
            profile={profile}
            targets={targets}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            onProfileChange={(nextProfile) => {
              setProfile(nextProfile);
              if (session?.token) {
                updateProfileRemote(session.token, nextProfile).catch(() => undefined);
              }
            }}
            onLogout={logout}
          />
        );
      case "diary":
      default:
        return <DiaryScreen meals={meals} targets={targets} onAdd={() => setActiveTab("add")} onEdit={handleEditMeal} onDelete={handleDeleteMeal} />;
    }
  };

  return (
    <ThemeProvider themeMode={themeMode}>
      <AppShell
        activeTab={activeTab}
        deletedMeal={deletedMeal}
        isOnboarded={isOnboarded}
        onTabChange={setActiveTab}
        onUndoDelete={undoDelete}
      >
        {renderScreen()}
      </AppShell>
    </ThemeProvider>
  );
}

function LoadingScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={baseStyles.loading}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.loadingText}>Р—Р°РіСЂСѓР¶Р°РµРј РґРЅРµРІРЅРёРє...</Text>
    </View>
  );
}

function AppShell({
  activeTab,
  children,
  deletedMeal,
  isOnboarded,
  onTabChange,
  onUndoDelete
}: {
  activeTab: TabKey;
  children: React.ReactNode;
  deletedMeal: MealEntry | null;
  isOnboarded: boolean;
  onTabChange: (tab: TabKey) => void;
  onUndoDelete: () => void;
}) {
  const { colors, resolvedMode } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <View style={styles.content}>{children}</View>
      {isOnboarded && <BottomTabs active={activeTab} onChange={onTabChange} />}
      {deletedMeal && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>РџСЂРёС‘Рј РїРёС‰Рё СѓРґР°Р»С‘РЅ</Text>
          <Pressable onPress={onUndoDelete}>
            <Text style={styles.undoText}>РћС‚РјРµРЅРёС‚СЊ</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  }
});

const createStyles = (palette: typeof colors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: palette.background
    },
    content: {
      flex: 1
    },
    loadingText: {
      color: palette.muted,
      fontWeight: "800"
    },
    snackbar: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 92,
      minHeight: 52,
      borderRadius: 8,
      backgroundColor: palette.ink,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    snackbarText: {
      color: palette.surface,
      fontWeight: "800"
    },
    undoText: {
      color: palette.primarySoft,
      fontWeight: "900"
    }
  });
