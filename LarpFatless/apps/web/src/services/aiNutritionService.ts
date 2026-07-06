import type { AnalyzeContext, AnalyzeInputType, AnalyzeResponse } from "../types/nutrition";

interface AnalyzeRequest {
  type: AnalyzeInputType;
  payload: string;
  context?: AnalyzeContext;
}

const REQUEST_TIMEOUT_MS = 15_000;

export async function analyzeText(text: string, context?: AnalyzeContext) {
  return analyze({ type: "text", payload: text, context });
}

export async function analyzeImage(base64: string, context?: AnalyzeContext) {
  return analyze({ type: "image", payload: base64, context });
}

async function analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    const payload = (await response.json()) as AnalyzeResponse | { type?: string; message?: string; error?: string };

    if (!response.ok) {
      throw new Error("error" in payload && payload.error ? payload.error : "request_failed");
    }

    if ("type" in payload && payload.type === "chat") {
      const chatPayload = payload as { type: "chat"; message?: string };
      return {
        type: "chat",
        items: [],
        total: { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 },
        assistantMessage: chatPayload.message || ""
      };
    }

    return payload as AnalyzeResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("timeout");
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
