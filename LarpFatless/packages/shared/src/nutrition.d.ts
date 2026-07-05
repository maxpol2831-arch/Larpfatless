export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type NutritionGoal = "lose" | "maintain" | "gain";

export interface NutritionProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
}

export interface DailyTargets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionLike {
  portionGrams: number;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
}

export interface NutritionTotals {
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
}

export function calculateBmr(profile: NutritionProfile): number;
export function calculateDailyTargets(profile: NutritionProfile): DailyTargets;
export function scaleNutritionByPortion<T extends NutritionLike>(analysis: T, eatenRatio: number): T & { eatenRatio: number };
export function getMealTotals<T extends NutritionTotals>(meals: T[]): NutritionTotals;
export function getMacroProgress(
  totals: NutritionTotals,
  targets: Pick<DailyTargets, "protein" | "fat" | "carbs">
): { protein: number; fat: number; carbs: number };
