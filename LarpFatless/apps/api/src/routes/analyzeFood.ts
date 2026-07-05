import type { FastifyInstance } from "fastify";
import type { FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import { env } from "../env.js";
import { hashImageBuffer, MemoryTtlCache } from "../lib/cache.js";
import { optimizeImageForVision } from "../lib/image.js";
import { analyzeFoodImage } from "../lib/visionClient.js";

const analysisCache = new MemoryTtlCache<FoodAnalysis>(env.analysisCacheTtlMs);

export async function analyzeFoodRoute(app: FastifyInstance) {
  app.post("/food/analyze", async (request, reply) => {
    try {
      const file = await request.file();

      if (!file) {
        return reply.code(400).send({ message: "Добавьте фото блюда." });
      }

      if (!file.mimetype.startsWith("image/")) {
        return reply.code(415).send({ message: "Можно загрузить только изображение." });
      }

      const originalBuffer = await file.toBuffer();
      const optimized = await optimizeImageForVision(originalBuffer);
      const imageHash = hashImageBuffer(optimized.buffer);
      const cached = analysisCache.get(imageHash);

      if (cached) {
        return reply.send({ result: cached, cached: true });
      }

      const result = await analyzeFoodImage({
        image: optimized.buffer,
        mimeType: optimized.mimeType
      });

      analysisCache.set(imageHash, result);
      return reply.send({ result, cached: false });
    } catch (error) {
      request.log.error(error);
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 502;
      const message =
        statusCode === 413
          ? "Фото слишком большое. Попробуйте выбрать изображение до 8 МБ."
          : "Не удалось проанализировать фото. Проверьте сеть или попробуйте ещё раз.";

      return reply.code(Number.isFinite(statusCode) ? statusCode : 502).send({ message });
    }
  });
}
