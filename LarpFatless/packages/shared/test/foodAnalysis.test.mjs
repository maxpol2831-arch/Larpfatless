import assert from "node:assert/strict";
import test from "node:test";
import { parseFoodAnalysisJson } from "../src/foodAnalysis.js";

test("parses food analysis wrapped in markdown and normalizes kcal aliases", () => {
  const result = parseFoodAnalysisJson(`
\`\`\`json
{
  "name": "Сырники со сметаной",
  "ingredients": [
    { "name": "творог", "estimatedGrams": 160, "confidence": 0.83 }
  ],
  "weight": 230,
  "kcal": 480,
  "protein": 28,
  "fat": 18,
  "carbohydrates": 48,
  "confidence": 0.76,
  "notes": "Проверьте количество сахара."
}
\`\`\`
  `);

  assert.equal(result.dishName, "Сырники со сметаной");
  assert.equal(result.calories, 480);
  assert.equal(result.portionGrams, 230);
  assert.equal(result.carbsGrams, 48);
});
