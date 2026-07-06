import { supabase } from "../lib/supabase";
import type { AppSettings, DiaryEntry, UserProfile } from "../types/nutrition";

export interface CloudSnapshot {
  profile: UserProfile | null;
  entries: DiaryEntry[];
  settings: AppSettings | null;
}

type ProfileRow = {
  id: string;
  name: string;
  gender: UserProfile["gender"];
  age: number;
  height_cm: number;
  weight_kg: number;
  activity_level: UserProfile["activityLevel"];
  goal: UserProfile["goal"];
  weekly_weight_change_kg: number;
  daily_calories: number;
  protein_goal: number;
  fat_goal: number;
  carbs_goal: number;
  created_at: string;
  updated_at: string;
};

type MealRow = {
  id: string;
  user_id: string;
  created_at: string;
  input_type: DiaryEntry["inputType"];
  source_text: string;
  items: DiaryEntry["items"];
  total: DiaryEntry["total"];
  assistant_message: string | null;
};

type SettingsRow = {
  user_id: string;
  theme: AppSettings["theme"];
  assistant_enabled: boolean;
  language: AppSettings["language"];
  units: AppSettings["units"];
  notifications: boolean;
  nickname: string;
  updated_at: string;
};

export async function loadCloudSnapshot(uid: string): Promise<CloudSnapshot> {
  ensureSupabase();

  const [profileResult, mealsResult, settingsResult] = await Promise.all([
    supabase!.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase!.from("meals").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
    supabase!.from("user_settings").select("*").eq("user_id", uid).maybeSingle()
  ]);

  if (profileResult.error) throw profileResult.error;
  if (mealsResult.error) throw mealsResult.error;
  if (settingsResult.error) throw settingsResult.error;

  return {
    profile: profileResult.data ? fromProfileRow(profileResult.data as ProfileRow) : null,
    entries: ((mealsResult.data ?? []) as MealRow[]).map(fromMealRow),
    settings: settingsResult.data ? fromSettingsRow(settingsResult.data as SettingsRow) : null
  };
}

export async function saveCloudProfile(uid: string, profile: UserProfile) {
  ensureSupabase();
  const { error } = await supabase!.from("profiles").upsert(toProfileRow(uid, profile), { onConflict: "id" });
  if (error) throw error;
}

export async function saveCloudSettings(uid: string, settings: AppSettings) {
  ensureSupabase();
  const { error } = await supabase!.from("user_settings").upsert(toSettingsRow(uid, settings), { onConflict: "user_id" });
  if (error) throw error;
}

export async function saveCloudMeal(uid: string, entry: DiaryEntry) {
  ensureSupabase();
  const { error } = await supabase!.from("meals").upsert(toMealRow(uid, entry), { onConflict: "id" });
  if (error) throw error;
}

export async function deleteCloudMeal(uid: string, mealId: string) {
  ensureSupabase();
  const { error } = await supabase!.from("meals").delete().eq("user_id", uid).eq("id", mealId);
  if (error) throw error;
}

export async function clearCloudMeals(uid: string, entries: DiaryEntry[]) {
  ensureSupabase();
  const ids = entries.map((entry) => entry.id);
  if (ids.length === 0) return;

  const { error } = await supabase!.from("meals").delete().eq("user_id", uid).in("id", ids);
  if (error) throw error;
}

export async function migrateLocalDataToCloud(
  uid: string,
  data: { profile: UserProfile | null; entries: DiaryEntry[]; settings: AppSettings }
) {
  ensureSupabase();

  const tasks: PromiseLike<unknown>[] = [saveCloudSettings(uid, data.settings)];
  if (data.profile) tasks.push(saveCloudProfile(uid, data.profile));
  if (data.entries.length > 0) {
    const rows = data.entries.map((entry) => toMealRow(uid, entry));
    tasks.push(
      supabase!
        .from("meals")
        .upsert(rows, { onConflict: "id" })
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  await Promise.all(tasks);
}

function toProfileRow(uid: string, profile: UserProfile): ProfileRow {
  return {
    id: uid,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    activity_level: profile.activityLevel,
    goal: profile.goal,
    weekly_weight_change_kg: profile.weeklyWeightChangeKg,
    daily_calories: profile.dailyCalories,
    protein_goal: profile.proteinGoal,
    fat_goal: profile.fatGoal,
    carbs_goal: profile.carbsGoal,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt
  };
}

function fromProfileRow(row: ProfileRow): UserProfile {
  return {
    name: row.name,
    gender: row.gender,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    activityLevel: row.activity_level,
    goal: row.goal,
    weeklyWeightChangeKg: row.weekly_weight_change_kg,
    dailyCalories: row.daily_calories,
    proteinGoal: row.protein_goal,
    fatGoal: row.fat_goal,
    carbsGoal: row.carbs_goal,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toMealRow(uid: string, entry: DiaryEntry): MealRow {
  return {
    id: entry.id,
    user_id: uid,
    created_at: entry.createdAt,
    input_type: entry.inputType,
    source_text: entry.sourceText,
    items: entry.items,
    total: entry.total,
    assistant_message: entry.assistantMessage ?? null
  };
}

function fromMealRow(row: MealRow): DiaryEntry {
  return {
    id: row.id,
    createdAt: row.created_at,
    inputType: row.input_type,
    sourceText: row.source_text,
    items: row.items,
    total: row.total,
    assistantMessage: row.assistant_message ?? undefined
  };
}

function toSettingsRow(uid: string, settings: AppSettings): SettingsRow {
  return {
    user_id: uid,
    theme: settings.theme,
    assistant_enabled: settings.assistantEnabled,
    language: settings.language,
    units: settings.units,
    notifications: settings.notifications,
    nickname: settings.nickname,
    updated_at: new Date().toISOString()
  };
}

function fromSettingsRow(row: SettingsRow): AppSettings {
  return {
    theme: row.theme,
    assistantEnabled: row.assistant_enabled,
    language: row.language,
    units: row.units,
    notifications: row.notifications,
    nickname: row.nickname
  };
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }
}
