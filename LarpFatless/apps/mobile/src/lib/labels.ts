import type { MealType } from "../types";

export const mealTypeLabel: Record<MealType, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус"
};

export const goalLabel = {
  lose: "Похудение",
  maintain: "Поддержание",
  gain: "Набор массы"
};

export const activityLabel = {
  sedentary: "Мало движения",
  light: "Лёгкая",
  moderate: "Средняя",
  active: "Активная",
  athlete: "Спорт"
};
