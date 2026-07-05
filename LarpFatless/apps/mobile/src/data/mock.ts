import { calculateDailyTargets } from "@larpfatless/shared/nutrition";
import type { FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import type { MealEntry, UserProfile } from "../types";

export const demoProfile: UserProfile = {
  sex: "female",
  age: 29,
  heightCm: 168,
  weightKg: 64,
  activityLevel: "moderate",
  goal: "maintain"
};

export const demoTargets = calculateDailyTargets(demoProfile);

export const sampleMeals: MealEntry[] = [
  {
    id: "meal-1",
    mealType: "breakfast",
    eatenAt: new Date().toISOString(),
    dishName: "Греческий йогурт с ягодами",
    ingredients: [
      { name: "греческий йогурт", estimatedGrams: 180, confidence: 0.9 },
      { name: "ягоды", estimatedGrams: 80, confidence: 0.86 },
      { name: "гранола", estimatedGrams: 35, confidence: 0.74 }
    ],
    portionGrams: 295,
    calories: 365,
    proteinGrams: 25,
    fatGrams: 9,
    carbsGrams: 45,
    confidence: 0.88,
    notes: "Порция выглядит стандартной.",
    photoUri: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=640&q=80"
  },
  {
    id: "meal-2",
    mealType: "lunch",
    eatenAt: new Date().toISOString(),
    dishName: "Лосось, киноа и салат",
    ingredients: [
      { name: "лосось", estimatedGrams: 130, confidence: 0.82 },
      { name: "киноа", estimatedGrams: 120, confidence: 0.74 },
      { name: "овощи", estimatedGrams: 130, confidence: 0.78 }
    ],
    portionGrams: 380,
    calories: 598,
    proteinGrams: 39,
    fatGrams: 27,
    carbsGrams: 48,
    confidence: 0.8,
    notes: "Соус может добавить 40-80 ккал.",
    photoUri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=80"
  }
];

export const fallbackAnalysis: FoodAnalysis = {
  dishName: "Омлет с овощами",
  ingredients: [
    { name: "яйца", estimatedGrams: 110, confidence: 0.86 },
    { name: "томаты", estimatedGrams: 70, confidence: 0.72 },
    { name: "зелень", estimatedGrams: 10, confidence: 0.68 }
  ],
  portionGrams: 240,
  calories: 312,
  proteinGrams: 22,
  fatGrams: 21,
  carbsGrams: 9,
  confidence: 0.74,
  notes: "Проверьте количество масла, если жарили на сковороде."
};

export const weeklyCalories = [1740, 1880, 2015, 1690, 1935, 1820, 910];

export const weightLogs = [
  { label: "Пн", value: 64.4 },
  { label: "Вт", value: 64.2 },
  { label: "Ср", value: 64.1 },
  { label: "Чт", value: 63.9 },
  { label: "Пт", value: 64.0 },
  { label: "Сб", value: 63.8 },
  { label: "Вс", value: 63.7 }
];
