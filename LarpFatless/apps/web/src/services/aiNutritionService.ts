import type { AnalyzeInputType, AnalyzeResponse } from "../types/nutrition";

interface AnalyzeRequest {
  type: AnalyzeInputType;
  payload: string;
}

const REQUEST_TIMEOUT_MS = 15_000;

export async function analyzeText(text: string) {
  return analyze({ type: "text", payload: text });
}

export async function analyzeImage(base64: string) {
  return analyze({ type: "image", payload: base64 });
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

    const payload = (await response.json()) as AnalyzeResponse | { error?: string };

    if (!response.ok) {
      throw new Error("error" in payload && payload.error ? payload.error : "request_failed");
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
