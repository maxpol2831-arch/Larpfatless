import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthSession, MealEntry, ThemeMode, UserProfile } from "../types";

const STORAGE_KEY = "larpfatless:app-state:v2";

export interface StoredAppState {
  isOnboarded: boolean;
  profile: UserProfile;
  meals: MealEntry[];
  themeMode: ThemeMode;
  session: AuthSession | null;
}

export async function loadStoredAppState() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAppState;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export async function saveStoredAppState(state: StoredAppState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearStoredAppState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
