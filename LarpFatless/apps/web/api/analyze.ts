type Confidence = "high" | "medium" | "low";
type AnalyzeInputType = "text" | "image";
type AppLanguage = "ru" | "en";

interface NutritionItem {
  name: string;
  weight_g: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  confidence: Confidence;
}

interface AnalyzeResponse {
  items: NutritionItem[];
  total: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
  };
  assistantMessage?: string;
}

interface ChatResponse {
  type: "chat";
  message: string;
}

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
  context?: {
    assistantEnabled?: boolean;
    language?: AppLanguage;
    profile?: {
      name: string;
      age?: number;
      heightCm?: number;
      weightKg?: number;
      gender?: string;
      activityLevel?: string;
      goal: string;
      dailyCalories: number;
      proteinGoal: number;
      fatGoal: number;
      carbsGoal: number;
    };
    today?: {
      calories: number;
      protein_g: number;
      fat_g: number;
      carbs_g: number;
    };
  };
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

const nutritionJsonSchema = {
  items: [
    {
      name: "string",
      weight_g: "number",
      calories: "number",
      protein_g: "number",
      fat_g: "number",
      carbs_g: "number",
      confidence: "high | medium | low"
    }
  ],
  total: {
    calories: "number",
    protein_g: "number",
    fat_g: "number",
    carbs_g: "number"
  },
  assistantMessage: "string"
};

const schemaText = JSON.stringify(nutritionJsonSchema, null, 2);

const textNutritionPrompt = `
Ты нутрициологический ассистент LarpFatless.
Разбери описание еды на отдельные продукты или блюда и оцени КБЖУ.
Верни только валидный JSON без markdown, без пояснений и без текста вокруг.
Схема ответа:
${schemaText}
confidence:
- high, если продукт и порция понятны;
- medium, если часть порции оценочная;
- low, если данных мало и значения приблизительные.
`;

const fitnessAssistantPrompt = `
Ты персональный ИИ фитнес-ассистент LarpFatless: дружелюбный тренер по питанию, тренировкам, восстановлению и привычкам.
Отвечай на любые вопросы про похудение, набор массы, сушку, питание, тренировки, упражнения, спортпит, сон, кардио, силовые, воду, витамины, расчет калорий и БЖУ.
Если в сообщении есть еда, оцени КБЖУ в items и total. Если еды нет, верни items: [] и total с нулями.
Всегда добавляй assistantMessage: короткий мотивирующий ответ или рекомендацию тренера на русском языке.
Не ставь медицинские диагнозы и не обещай гарантированный результат.
Верни только валидный JSON без markdown, без пояснений и без текста вокруг.
Схема ответа:
${schemaText}
`;

const fitnessAssistantPromptEn = `
You are a personal AI fitness assistant inside LarpFatless, a calorie and macro tracking app.
Help with nutrition, training, weight loss, muscle gain, cutting, recovery, sleep, cardio, strength training, water, protein, fats, carbs, calorie goals, macro goals, meal planning and diary analysis.
Answer clearly, warmly and practically like a personal trainer.
Use the user's profile and today's progress if available.
Keep chat answers compact: use 5-8 practical bullets or a short day/week plan. Avoid long essays.
Do not diagnose diseases and do not give unsafe medical advice.
`;

const fitnessAssistantPromptRu = `
Ты персональный фитнес-ассистент внутри приложения для подсчёта калорий.
Помогай с питанием, тренировками, похудением, набором массы, сушкой, восстановлением, сном, кардио, силовыми, водой, белками, жирами, углеводами, расчетом калорий и БЖУ, рационом и анализом дневника.
Отвечай понятно, дружелюбно и практично как персональный тренер.
Учитывай профиль пользователя и прогресс за сегодня, если они доступны.
Не ставь диагнозы и не давай опасных медицинских советов.
`;

const calculatorOnlyPromptRu = `
Ты калькулятор калорий и КБЖУ.
Твоя задача — определять калории, белки, жиры и углеводы по фото еды или текстовому описанию.
Не отвечай на вопросы про тренировки, фитнес и здоровье.
Если пользователь спрашивает не про еду или калории, попроси включить фитнес-ассистента в настройках.
`;

const calculatorOnlyPromptEn = `
You are a calorie and macro calculator.
Your task is to estimate calories, protein, fat and carbs from a food photo or text description.
Do not answer training, fitness or health questions.
If the user asks about anything outside food or calories, ask them to enable Fitness Assistant in settings.
`;

const imageNutritionPrompt = `
Ты мультимодальный нутрициологический ассистент LarpFatless.
Определи еду на фото, оцени вес порций и КБЖУ по каждому элементу.
В assistantMessage добавь короткую рекомендацию: подходит ли блюдо под похудение/массу, чего не хватает, что можно добавить.
Верни только валидный JSON без markdown, без пояснений и без текста вокруг.
Схема ответа:
${schemaText}
Если еда плохо видна, все равно верни лучший вероятный расчет и confidence low.
`;

const retryJsonPrompt = `
Предыдущий ответ не был валидным JSON.
Верни тот же результат заново, строго как JSON по схеме:
${schemaText}
Без markdown, без комментариев, без текста до или после JSON.
`;

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const config = {
  maxDuration: 45
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const body = req.body as AnalyzeRequestBody;
  const type = body?.type;
  const payload = body?.payload?.trim();
  const context = body?.context;

  if ((type !== "text" && type !== "image") || !payload) {
    res.status(400).json({ error: "invalid_request" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "gemini_key_missing" });
    return;
  }

  try {
    const language = context?.language === "en" ? "en" : "ru";
    const shouldChat = type === "text" && Boolean(context?.assistantEnabled) && !looksLikeFoodRequest(payload);

    if (shouldChat) {
      const message = await requestGeminiChat(payload, withContext(language === "en" ? fitnessAssistantPromptEn : fitnessAssistantPromptRu, context));
      res.status(200).json({ type: "chat", message } satisfies ChatResponse);
      return;
    }

    if (!context?.assistantEnabled && type === "text" && !looksLikeFoodRequest(payload)) {
      res.status(200).json({
        type: "chat",
        message: language === "en"
          ? "Enable Fitness Assistant in settings to get training and nutrition advice."
          : "Включите фитнес-ассистента в настройках, чтобы получать советы по тренировкам и питанию."
      } satisfies ChatResponse);
      return;
    }

    const prompt = type === "image"
      ? imageNutritionPrompt
      : context?.assistantEnabled
        ? `${language === "en" ? fitnessAssistantPromptEn : fitnessAssistantPromptRu}\n\nIf the user asks to calculate food or describes food, return valid JSON according to this schema only:\n${schemaText}`
        : `${language === "en" ? calculatorOnlyPromptEn : calculatorOnlyPromptRu}\n\nReturn valid JSON only according to this schema:\n${schemaText}`;
    const raw = await requestGemini(type, payload, withContext(prompt, context));
    const parsed = parseAnalyzeResponse(raw);

    if (parsed) {
      res.status(200).json(parsed);
      return;
    }

    const retryRaw = await requestGemini(type, payload, withContext(`${prompt}\n\n${retryJsonPrompt}`, context));
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

function withContext(prompt: string, context?: AnalyzeRequestBody["context"]) {
  if (!context) return prompt;

  return `${prompt}

Контекст пользователя:
${JSON.stringify(context, null, 2)}
Используй контекст, чтобы отвечать персонально: сколько калорий/БЖУ осталось, какая цель, какие рекомендации дать.`;
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

async function requestGeminiChat(payload: string, prompt: string) {
  const response = await fetch(`${geminiUrl}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${prompt}\n\nAnswer compactly in the selected app language. For plans, use 5-8 practical bullets and avoid long essays.\n\nUser message: ${payload}` }]
        }
      ],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 1200
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

  return json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "Готов помочь. Сформулируйте вопрос чуть подробнее.";
}

function looksLikeFoodRequest(value: string) {
  return /(рассчитай кбжу|посчитай кбжу|сколько кбжу|съел|съела|ел |ела |завтрак|обед|ужин|перекус|\d+\s?(г|гр|gram|grams|g)\b|яйц|кур|рис|греч|творог|молок|сыр|мяс|рыб|хлеб|салат|суп|карто|кофе|банан|яблок|овсян|ate|i had|food log|meal log|breakfast|lunch|dinner|chicken|rice|egg|oat|banana)/i.test(value);
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

function normalizeAnalyzeResponse(value: AnalyzeResponse & {
  type?: string;
  foodName?: string;
  estimatedWeight?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  confidence?: number | Confidence;
  advice?: string;
}) {
  if (value.type === "food_analysis") {
    const item = normalizeItem({
      name: value.foodName || "Еда",
      weight_g: value.estimatedWeight ?? 0,
      calories: value.total?.calories ?? value.calories ?? 0,
      protein_g: value.protein ?? 0,
      fat_g: value.fat ?? 0,
      carbs_g: value.carbs ?? 0,
      confidence: typeof value.confidence === "number" ? numericConfidence(value.confidence) : normalizeConfidence(value.confidence ?? "medium")
    });

    if (!item) return null;

    return {
      items: [item],
      total: {
        calories: roundNumber(item.calories),
        protein_g: roundNumber(item.protein_g),
        fat_g: roundNumber(item.fat_g),
        carbs_g: roundNumber(item.carbs_g)
      },
      assistantMessage: value.advice || value.assistantMessage
    };
  }

  if (!Array.isArray(value.items) || !value.total) return null;

  const items = value.items.map(normalizeItem).filter(Boolean) as NutritionItem[];

  const total = {
    calories: roundNumber(value.total.calories ?? sum(items, "calories")),
    protein_g: roundNumber(value.total.protein_g ?? sum(items, "protein_g")),
    fat_g: roundNumber(value.total.fat_g ?? sum(items, "fat_g")),
    carbs_g: roundNumber(value.total.carbs_g ?? sum(items, "carbs_g"))
  };

  return {
    items,
    total,
    assistantMessage: typeof value.assistantMessage === "string" ? value.assistantMessage.trim() : undefined
  };
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

function numericConfidence(value: number): Confidence {
  if (value >= 0.8) return "high";
  if (value >= 0.45) return "medium";
  return "low";
}

function roundNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value * 10) / 10) : 0;
}

function sum(items: NutritionItem[], key: keyof Pick<NutritionItem, "calories" | "protein_g" | "fat_g" | "carbs_g">) {
  return items.reduce((total, item) => total + item[key], 0);
}
