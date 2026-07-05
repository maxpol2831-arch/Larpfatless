import Constants from "expo-constants";
import { Platform } from "react-native";
import type { FoodAnalysis } from "@larpfatless/shared/foodAnalysis";
import type { AuthSession, MealEntry, UserProfile } from "../types";

type AnalyzeResponse = {
  result: FoodAnalysis;
  cached: boolean;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    displayName?: string | null;
    sex: UserProfile["sex"];
    age: number;
    heightCm: number;
    weightKg: number;
    activityLevel: UserProfile["activityLevel"];
    goal: UserProfile["goal"];
  };
};

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json"
};

const defaultHost = Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";
const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

export const API_BASE_URL = extra?.apiBaseUrl ?? defaultHost;

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Ошибка запроса.");
  }
  return payload;
}

export async function analyzeFoodPhoto(photoUri: string): Promise<FoodAnalysis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const form = new FormData();
  const extension = photoUri.split(".").pop()?.toLowerCase();
  const type = extension === "png" ? "image/png" : "image/jpeg";

  form.append("photo", {
    uri: photoUri,
    name: `meal.${type === "image/png" ? "png" : "jpg"}`,
    type
  } as any);

  try {
    const response = await fetch(`${API_BASE_URL}/v1/food/analyze`, {
      method: "POST",
      body: form,
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    const payload = (await response.json()) as AnalyzeResponse | { message?: string };

    if (!response.ok || !("result" in payload)) {
      throw new Error("message" in payload && payload.message ? payload.message : "Не удалось распознать блюдо.");
    }

    return payload.result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("ИИ анализирует слишком долго. Попробуйте другое фото или внесите данные вручную.");
    }
    throw error instanceof Error ? error : new Error("Проблема с подключением. Попробуйте позже.");
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginWithEmail(email: string, password: string) {
  const payload = await parseJson<AuthResponse>(
    await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ email, password })
    })
  );

  return {
    session: {
      token: payload.token,
      email: payload.user.email,
      displayName: payload.user.displayName ?? undefined
    } satisfies AuthSession,
    profile: {
      sex: payload.user.sex,
      age: payload.user.age,
      heightCm: payload.user.heightCm,
      weightKg: payload.user.weightKg,
      activityLevel: payload.user.activityLevel,
      goal: payload.user.goal
    } satisfies UserProfile
  };
}

export async function registerWithEmail(session: AuthSession, password: string, profile: UserProfile) {
  const payload = await parseJson<AuthResponse>(
    await fetch(`${API_BASE_URL}/v1/auth/register`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: session.email,
        password,
        displayName: session.displayName,
        profile
      })
    })
  );

  return {
    session: {
      token: payload.token,
      email: payload.user.email,
      displayName: payload.user.displayName ?? undefined
    } satisfies AuthSession,
    profile: {
      sex: payload.user.sex,
      age: payload.user.age,
      heightCm: payload.user.heightCm,
      weightKg: payload.user.weightKg,
      activityLevel: payload.user.activityLevel,
      goal: payload.user.goal
    } satisfies UserProfile
  };
}

export async function fetchProfile(token: string) {
  const payload = await parseJson<{ user: AuthResponse["user"] }>(
    await fetch(`${API_BASE_URL}/v1/profile`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    })
  );

  return {
    sex: payload.user.sex,
    age: payload.user.age,
    heightCm: payload.user.heightCm,
    weightKg: payload.user.weightKg,
    activityLevel: payload.user.activityLevel,
    goal: payload.user.goal
  } satisfies UserProfile;
}

export async function updateProfile(token: string, profile: UserProfile) {
  await parseJson<{ user: AuthResponse["user"] }>(
    await fetch(`${API_BASE_URL}/v1/profile`, {
      method: "PUT",
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    })
  );
}

export async function fetchMeals(token: string) {
  const payload = await parseJson<{ meals: MealEntry[] }>(
    await fetch(`${API_BASE_URL}/v1/meals`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    })
  );
  return payload.meals;
}

export async function saveMeal(token: string, meal: MealEntry) {
  const method = meal.id.startsWith("meal-") ? "POST" : "PUT";
  const url = method === "POST" ? `${API_BASE_URL}/v1/meals` : `${API_BASE_URL}/v1/meals/${meal.id}`;

  const payload = await parseJson<{ meal: MealEntry }>(
    await fetch(url, {
      method,
      headers: {
        ...jsonHeaders,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(meal)
    })
  );

  return payload.meal;
}

export async function deleteMeal(token: string, mealId: string) {
  await parseJson<{ ok: true }>(
    await fetch(`${API_BASE_URL}/v1/meals/${mealId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    })
  );
}
