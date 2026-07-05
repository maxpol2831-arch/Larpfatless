import "dotenv/config";

const numberFromEnv = (key: string, fallback: number) => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a number`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: numberFromEnv("PORT", 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  aiProvider: process.env.AI_PROVIDER ?? "openai",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5.5",
  authSecret: process.env.AUTH_SECRET ?? "dev-larpfatless-secret-change-me",
  apiTimeoutMs: numberFromEnv("API_TIMEOUT_MS", 30_000),
  imageMaxBytes: numberFromEnv("IMAGE_MAX_BYTES", 8 * 1024 * 1024),
  analysisCacheTtlMs: numberFromEnv("ANALYSIS_CACHE_TTL_MS", 24 * 60 * 60 * 1000)
};
