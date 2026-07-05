import OpenAI from "openai";
import {
  FOOD_ANALYSIS_JSON_SCHEMA,
  parseFoodAnalysisJson,
  sanitizeFoodAnalysis,
  type FoodAnalysis
} from "@larpfatless/shared/foodAnalysis";
import { env } from "../env.js";
import { FOOD_VISION_SYSTEM_PROMPT } from "../prompts/foodVisionPrompt.js";

interface AnalyzeFoodImageParams {
  image: Buffer;
  mimeType: string;
}

const createDevelopmentEstimate = (): FoodAnalysis =>
  sanitizeFoodAnalysis({
    dishName: "Куриный боул с рисом",
    ingredients: [
      { name: "куриная грудка", estimatedGrams: 120, confidence: 0.76 },
      { name: "рис", estimatedGrams: 150, confidence: 0.72 },
      { name: "овощи", estimatedGrams: 90, confidence: 0.68 },
      { name: "соус", estimatedGrams: 30, confidence: 0.52 }
    ],
    portionGrams: 390,
    calories: 612,
    proteinGrams: 42,
    fatGrams: 18,
    carbsGrams: 68,
    confidence: 0.67,
    notes: "Локальная оценка для разработки. Подключите OPENAI_API_KEY для реального анализа."
  });

const shouldUseMock = () => env.aiProvider === "mock" || (env.nodeEnv !== "production" && !env.openAiApiKey);

async function requestOpenAiVision({ image, mimeType }: AnalyzeFoodImageParams, attempt: number) {
  const openai = new OpenAI({
    apiKey: env.openAiApiKey,
    timeout: env.apiTimeoutMs
  });

  const base64Image = image.toString("base64");
  const userPrompt =
    attempt === 1
      ? "Проанализируй фото блюда и верни оценку питания."
      : "Предыдущий ответ не прошел валидацию. Повтори анализ и верни строго валидный JSON.";

  const response = await openai.responses.create({
    model: env.openAiModel,
    input: [
      { role: "system", content: FOOD_VISION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64Image}`,
            detail: "high"
          }
        ]
      }
    ],
    reasoning: { effort: "low" },
    text: {
      format: {
        type: "json_schema",
        name: "food_analysis",
        strict: true,
        schema: FOOD_ANALYSIS_JSON_SCHEMA
      }
    }
  });

  if (env.nodeEnv !== "production") {
    console.info(
      JSON.stringify({
        event: "food_vision_raw_response",
        attempt,
        model: env.openAiModel,
        outputPreview: response.output_text.slice(0, 1200)
      })
    );
  }

  return parseFoodAnalysisJson(response.output_text);
}

export async function analyzeFoodImage(params: AnalyzeFoodImageParams) {
  if (shouldUseMock()) {
    return createDevelopmentEstimate();
  }

  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI vision analysis");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await requestOpenAiVision(params, attempt);
    } catch (error) {
      lastError = error;
      console.warn(
        JSON.stringify({
          event: "food_vision_attempt_failed",
          attempt,
          message: error instanceof Error ? error.message : String(error)
        })
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Vision analysis failed");
}
