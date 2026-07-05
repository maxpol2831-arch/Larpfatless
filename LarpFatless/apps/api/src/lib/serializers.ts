import type { Meal, MealItem, User } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    sex: user.sex,
    age: user.age,
    heightCm: user.heightCm,
    weightKg: Number(user.weightKg),
    activityLevel: user.activityLevel,
    goal: user.goal,
    dailyCalories: user.dailyCalories,
    proteinTarget: Number(user.proteinTarget),
    fatTarget: Number(user.fatTarget),
    carbsTarget: Number(user.carbsTarget)
  };
}

export function serializeMeal(meal: Meal & { items?: MealItem[] }) {
  return {
    id: meal.id,
    mealType: meal.mealType,
    eatenAt: meal.eatenAt.toISOString(),
    dishName: meal.title,
    photoUri: meal.photoUrl ?? undefined,
    calories: meal.calories,
    proteinGrams: Number(meal.proteinGrams),
    fatGrams: Number(meal.fatGrams),
    carbsGrams: Number(meal.carbsGrams),
    portionGrams: Number(meal.portionGrams),
    confidence: meal.confidence ? Number(meal.confidence) : 1,
    notes: "",
    ingredients:
      meal.items?.map((item) => ({
        name: item.name,
        estimatedGrams: Number(item.grams),
        confidence: 1
      })) ?? []
  };
}
