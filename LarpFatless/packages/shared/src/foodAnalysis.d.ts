export interface FoodIngredient {
  name: string;
  estimatedGrams: number;
  confidence: number;
}

export interface FoodAnalysis {
  dishName: string;
  ingredients: FoodIngredient[];
  portionGrams: number;
  calories: number;
  proteinGrams: number;
  fatGrams: number;
  carbsGrams: number;
  confidence: number;
  notes: string;
}

export const FOOD_ANALYSIS_JSON_SCHEMA: Record<string, unknown>;
export function sanitizeFoodAnalysis(value: unknown): FoodAnalysis;
export function parseFoodAnalysisJson(text: string): FoodAnalysis;
export function getConfidenceLabel(confidence: number): string;
