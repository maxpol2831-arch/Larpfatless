import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { env } from "./env.js";
import { accountRoutes } from "./routes/account.js";
import { analyzeFoodRoute } from "./routes/analyzeFood.js";
import { mealRoutes } from "./routes/meals.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === "production" ? "info" : "debug"
    }
  });

  await app.register(cors, {
    origin: true
  });

  await app.register(multipart, {
    limits: {
      fileSize: env.imageMaxBytes,
      files: 1
    }
  });

  app.get("/health", async () => ({
    ok: true,
    service: "LarpFatless API"
  }));

  await app.register(accountRoutes, { prefix: "/v1" });
  await app.register(mealRoutes, { prefix: "/v1" });
  await app.register(analyzeFoodRoute, { prefix: "/v1" });

  return app;
}

const app = await buildServer();

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
