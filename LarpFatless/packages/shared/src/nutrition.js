export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9
};

export const GOAL_CALORIE_DELTA = {
  lose: -500,
  maintain: 0,
  gain: 300
};

const round = (value, precision = 0) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const requirePositive = (value, fieldName) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${fieldName} must be a positive number`);
  }
};

export function calculateBmr({ sex, age, heightCm, weightKg }) {
  requirePositive(age, "age");
  requirePositive(heightCm, "heightCm");
  requirePositive(weightKg, "weightKg");

  if (sex !== "male" && sex !== "female") {
    throw new TypeError("sex must be male or female");
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return round(sex === "male" ? base + 5 : base - 161);
}

export function calculateDailyTargets(profile) {
  const activity = profile.activityLevel ?? "moderate";
  const goal = profile.goal ?? "maintain";
  const multiplier = ACTIVITY_MULTIPLIERS[activity];

  if (!multiplier) {
    throw new TypeError(`Unknown activity level: ${activity}`);
  }

  const bmr = calculateBmr(profile);
  const tdee = bmr * multiplier;
  const minimumCalories = profile.sex === "female" ? 1200 : 1500;
  const calories = Math.max(minimumCalories, round(tdee + GOAL_CALORIE_DELTA[goal]));

  const proteinPerKg = goal === "gain" ? 2 : goal === "lose" ? 1.8 : 1.6;
  const fatPerKg = goal === "lose" ? 0.7 : 0.8;
  const protein = round(profile.weightKg * proteinPerKg);
  const fat = round(profile.weightKg * fatPerKg);
  const caloriesAfterProteinAndFat = Math.max(0, calories - protein * 4 - fat * 9);
  const carbs = round(caloriesAfterProteinAndFat / 4);

  return {
    bmr,
    tdee: round(tdee),
    calories,
    protein,
    fat,
    carbs
  };
}

export function scaleNutritionByPortion(analysis, eatenRatio) {
  if (!Number.isFinite(eatenRatio) || eatenRatio <= 0) {
    throw new TypeError("eatenRatio must be a positive number");
  }

  const ratio = Math.min(eatenRatio, 2);
  return {
    ...analysis,
    portionGrams: round(analysis.portionGrams * ratio),
    calories: round(analysis.calories * ratio),
    proteinGrams: round(analysis.proteinGrams * ratio, 1),
    fatGrams: round(analysis.fatGrams * ratio, 1),
    carbsGrams: round(analysis.carbsGrams * ratio, 1),
    eatenRatio: ratio
  };
}

export function getMealTotals(meals) {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      proteinGrams: totals.proteinGrams + meal.proteinGrams,
      fatGrams: totals.fatGrams + meal.fatGrams,
      carbsGrams: totals.carbsGrams + meal.carbsGrams
    }),
    { calories: 0, proteinGrams: 0, fatGrams: 0, carbsGrams: 0 }
  );
}

export function getMacroProgress(totals, targets) {
  return {
    protein: targets.protein > 0 ? totals.proteinGrams / targets.protein : 0,
    fat: targets.fat > 0 ? totals.fatGrams / targets.fat : 0,
    carbs: targets.carbs > 0 ? totals.carbsGrams / targets.carbs : 0
  };
}
