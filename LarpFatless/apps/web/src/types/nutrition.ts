export type Confidence = "high" | "medium" | "low";
export type AnalyzeInputType = "text" | "image";
export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
export type WeightGoal = "lose" | "maintain" | "gain";

export interface NutritionItem {
  name: string;
  weight_g: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence: Confidence;
}

export interface NutritionTotal {
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface AnalyzeResponse {
  type?: "chat" | "food_analysis";
  items: NutritionItem[];
  total: NutritionTotal;
  assistantMessage?: string;
}

export interface AnalyzeContext {
  assistantEnabled: boolean;
  language: "ru" | "en";
  profile?: {
    name: string;
    age: number;
    heightCm: number;
    weightKg: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    goal: WeightGoal;
    dailyCalories: number;
    proteinGoal: number;
    fatGoal: number;
    carbsGoal: number;
  };
  today?: NutritionTotal;
}

export interface DiaryEntry extends AnalyzeResponse {
  id: string;
  createdAt: string;
  inputType: AnalyzeInputType;
  sourceText: string;
}

export interface UserProfile {
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: WeightGoal;
  weeklyWeightChangeKg: number;
  dailyCalories: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  createdAt: string;
  updatedAt: string;
}
