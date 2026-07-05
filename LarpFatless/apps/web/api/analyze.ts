import { imageNutritionPrompt, retryJsonPrompt, textNutritionPrompt } from "../src/prompts/nutritionPrompts";
import type { AnalyzeInputType, AnalyzeResponse, Confidence, NutritionItem } from "../src/types/nutrition";

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

interface AnalyzeRequestBody {
  type?: AnalyzeInputType;
  payload?: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = req.body as AnalyzeRequestBody;
  const type = body?.type;
  const payload = body?.payload?.trim();

  if ((type !== "text" && type !== "image") || !payload) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "gemini_key_missing" });
    return;
  }

  try {
    const prompt = type === "image" ? imageNutritionPrompt : textNutritionPrompt;
    const raw = await requestGemini(type, payload, prompt);
    const parsed = parseAnalyzeResponse(raw);

    if (parsed) {
      res.status(200).json(parsed);
      return;
    }

    const retryRaw = await requestGemini(type, payload, `${prompt}\n\n${retryJsonPrompt}`);
    const retryParsed = parseAnalyzeResponse(retryRaw);

    if (!retryParsed) {
      res.status(422).json({ error: "parse_failed" });
      return;
    }

    res.status(200).json(retryParsed);
  } catch (error) {
    console.error("Gemini analyze failed", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message === "rate_limited") {
      res.status(429).json({ error: "rate_limited" });
      return;
    }
    res.status(500).json({ error: "analyze_failed" });
  }
}

async function requestGemini(type: AnalyzeInputType, payload: string, prompt: string) {
  const parts: GeminiPart[] =
    type === "image"
      ? [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: payload } }]
      : [{ text: `${prompt}\n\nЕда пользователя: ${payload}` }];

  const response = await fetch(`${geminiUrl}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429 || /RESOURCE_EXHAUSTED/i.test(errorText)) {
      throw new Error("rate_limited");
    }
    throw new Error(`Gemini returned ${response.status}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";
}

function parseAnalyzeResponse(raw: string): AnalyzeResponse | null {
  const jsonText = extractJson(raw);
  if (!jsonText) return null;

  try {
    const parsed = JSON.parse(jsonText) as AnalyzeResponse;
    return normalizeAnalyzeResponse(parsed);
  } catch {
    return null;
  }
}

function extractJson(raw: string) {
  const withoutFence = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return "";
  return withoutFence.slice(start, end + 1);
}

function normalizeAnalyzeResponse(value: AnalyzeResponse) {
  if (!Array.isArray(value.items) || !value.total) return null;

  const items = value.items.map(normalizeItem).filter(Boolean) as NutritionItem[];
  if (items.length === 0) return null;

  const total = {
    calories: roundNumber(value.total.calories ?? sum(items, "calories")),
    protein_g: roundNumber(value.total.protein_g ?? sum(items, "protein_g")),
    fat_g: roundNumber(value.total.fat_g ?? sum(items, "fat_g")),
    carbs_g: roundNumber(value.total.carbs_g ?? sum(items, "carbs_g"))
  };

  return { items, total };
}

function normalizeItem(item: NutritionItem) {
  if (!item || typeof item.name !== "string") return null;

  return {
    name: item.name.trim() || "Еда",
    weight_g: roundNumber(item.weight_g),
    calories: roundNumber(item.calories),
    protein_g: roundNumber(item.protein_g),
    fat_g: roundNumber(item.fat_g),
    carbs_g: roundNumber(item.carbs_g),
    confidence: normalizeConfidence(item.confidence)
  };
}

function normalizeConfidence(value: Confidence) {
  return value === "high" || value === "medium" || value === "low" ? value : "medium";
}

function roundNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value * 10) / 10) : 0;
}

function sum(items: NutritionItem[], key: keyof Pick<NutritionItem, "calories" | "protein_g" | "fat_g" | "carbs_g">) {
  return items.reduce((total, item) => total + item[key], 0);
}
