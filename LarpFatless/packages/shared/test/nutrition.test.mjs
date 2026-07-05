import assert from "node:assert/strict";
import test from "node:test";
import { calculateBmr, calculateDailyTargets, getMealTotals, scaleNutritionByPortion } from "../src/nutrition.js";

test("calculates Mifflin-St Jeor BMR for male profile", () => {
  assert.equal(calculateBmr({ sex: "male", age: 30, heightCm: 180, weightKg: 80 }), 1780);
});

test("calculates calorie and macro targets for weight loss", () => {
  const targets = calculateDailyTargets({
    sex: "male",
    age: 30,
    heightCm: 180,
    weightKg: 80,
    activityLevel: "moderate",
    goal: "lose"
  });

  assert.equal(targets.calories, 2259);
  assert.equal(targets.protein, 144);
  assert.equal(targets.fat, 56);
  assert.equal(targets.carbs, 295);
});

test("scales a recognized meal by eaten portion", () => {
  const scaled = scaleNutritionByPortion(
    { dishName: "Боул", portionGrams: 420, calories: 640, proteinGrams: 32, fatGrams: 20, carbsGrams: 78 },
    0.5
  );

  assert.equal(scaled.portionGrams, 210);
  assert.equal(scaled.calories, 320);
  assert.equal(scaled.proteinGrams, 16);
});

test("aggregates daily meal totals", () => {
  const totals = getMealTotals([
    { calories: 320, proteinGrams: 16, fatGrams: 10, carbsGrams: 39 },
    { calories: 450, proteinGrams: 24, fatGrams: 14, carbsGrams: 58 }
  ]);

  assert.deepEqual(totals, { calories: 770, proteinGrams: 40, fatGrams: 24, carbsGrams: 97 });
});
