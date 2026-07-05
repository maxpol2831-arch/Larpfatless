export const nutritionJsonSchema = {
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
  }
};

const schemaText = JSON.stringify(nutritionJsonSchema, null, 2);

export const textNutritionPrompt = `
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

export const imageNutritionPrompt = `
Ты мультимодальный нутрициологический ассистент LarpFatless.
Определи еду на фото, оцени вес порций и КБЖУ по каждому элементу.
Верни только валидный JSON без markdown, без пояснений и без текста вокруг.
Схема ответа:
${schemaText}
Если еда плохо видна, все равно верни лучший вероятный расчет и confidence low.
`;

export const retryJsonPrompt = `
Предыдущий ответ не был валидным JSON.
Верни тот же результат заново, строго как JSON по схеме:
${schemaText}
Без markdown, без комментариев, без текста до или после JSON.
`;
