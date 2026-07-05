import type { FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import type { ActivityLevel, NutritionGoal, Sex } from "@larpfatless/shared/nutrition";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type TabKey = "diary" | "stats" | "add" | "progress" | "profile";
export type ThemeMode = "light" | "dark" | "system";
export type AuthMode = "login" | "register";

export interface UserProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
}

export interface AuthSession {
  token: string;
  email: string;
  displayName?: string;
}

export interface MealEntry extends FoodAnalysis {
  id: string;
  mealType: MealType;
  eatenAt: string;
  photoUri?: string;
}
