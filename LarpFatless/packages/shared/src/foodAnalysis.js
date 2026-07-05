export const FOOD_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    dishName: {
      type: "string",
      description: "Короткое название блюда на русском языке."
    },
    ingredients: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          estimatedGrams: { type: "number" },
          confidence: { type: "number", minimum: 0, maximum: 1 }
        },
        required: ["name", "estimatedGrams", "confidence"]
      }
    },
    portionGrams: { type: "number", minimum: 1 },
    calories: { type: "number", minimum: 0 },
    proteinGrams: { type: "number", minimum: 0 },
    fatGrams: { type: "number", minimum: 0 },
    carbsGrams: { type: "number", minimum: 0 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    notes: { type: "string" }
  },
  required: [
    "dishName",
    "ingredients",
    "portionGrams",
    "calories",
    "proteinGrams",
    "fatGrams",
    "carbsGrams",
    "confidence",
    "notes"
  ]
};

const asNumber = (value, fieldName, min = 0, max = Number.POSITIVE_INFINITY) => {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new TypeError(`${fieldName} must be a number between ${min} and ${max}`);
  }
  return Math.round(value * 10) / 10;
};

export function sanitizeFoodAnalysis(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Food analysis response must be an object");
  }

  const dishName = String(value.dishName ?? "").trim();
  if (!dishName) {
    throw new TypeError("dishName is required");
  }

  if (!Array.isArray(value.ingredients) || value.ingredients.length === 0) {
    throw new TypeError("ingredients must be a non-empty array");
  }

  const ingredients = value.ingredients.map((ingredient, index) => {
    const name = String(ingredient?.name ?? "").trim();
    if (!name) {
      throw new TypeError(`ingredients[${index}].name is required`);
    }

    return {
      name,
      estimatedGrams: asNumber(ingredient.estimatedGrams, `ingredients[${index}].estimatedGrams`, 0),
      confidence: asNumber(ingredient.confidence, `ingredients[${index}].confidence`, 0, 1)
    };
  });

  return {
    dishName,
    ingredients,
    portionGrams: asNumber(value.portionGrams, "portionGrams", 1),
    calories: Math.round(asNumber(value.calories, "calories", 0)),
    proteinGrams: asNumber(value.proteinGrams, "proteinGrams", 0),
    fatGrams: asNumber(value.fatGrams, "fatGrams", 0),
    carbsGrams: asNumber(value.carbsGrams, "carbsGrams", 0),
    confidence: asNumber(value.confidence, "confidence", 0, 1),
    notes: String(value.notes ?? "").trim()
  };
}

export function parseFoodAnalysisJson(text) {
  const trimmed = String(text ?? "").trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = unfenced.indexOf("{");
  const lastBrace = unfenced.lastIndexOf("}");
  const jsonCandidate = firstBrace >= 0 && lastBrace > firstBrace ? unfenced.slice(firstBrace, lastBrace + 1) : unfenced;

  try {
    const parsed = JSON.parse(jsonCandidate);
    const normalized = {
      ...parsed,
      dishName: parsed.dishName ?? parsed.name ?? parsed.title,
      calories: parsed.calories ?? parsed.kcal,
      proteinGrams: parsed.proteinGrams ?? parsed.protein ?? parsed.proteins,
      fatGrams: parsed.fatGrams ?? parsed.fat ?? parsed.fats,
      carbsGrams: parsed.carbsGrams ?? parsed.carbs ?? parsed.carbohydrates,
      portionGrams: parsed.portionGrams ?? parsed.weightGrams ?? parsed.weight
    };
    return sanitizeFoodAnalysis(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parsing error";
    throw new TypeError(`Invalid food analysis JSON: ${message}`);
  }
}

export function getConfidenceLabel(confidence) {
  if (confidence >= 0.82) return "Высокая точность";
  if (confidence >= 0.62) return "Проверьте порцию";
  return "Проверьте вручную";
}
