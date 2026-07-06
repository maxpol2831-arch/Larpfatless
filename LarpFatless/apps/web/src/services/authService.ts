import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function observeAuth(callback: (user: User | null) => void) {
  if (!supabase) {
    callback(null);
    return () => undefined;
  }

  void supabase.auth.getSession().then(({ data }) => {
    callback(data.session?.user ?? null);
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  ensureSupabase();
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName.trim()
      }
    }
  });
  if (error) throw error;
  return data.user;
}

export async function loginWithEmail(email: string, password: string) {
  ensureSupabase();
  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  ensureSupabase();
  const { error } = await supabase!.auth.signOut();
  if (error) throw error;
}

export function authErrorText(error: unknown) {
  if (!isSupabaseConfigured) return "Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY на Vercel.";
  if (!navigator.onLine) return "Нет интернета. Вход и синхронизация Supabase сейчас недоступны.";
  if (!(error instanceof Error)) return "Supabase временно недоступен. Попробуйте позже.";

  const message = error.message.toLowerCase();
  if (message.includes("already registered") || message.includes("already exists")) return "Пользователь с таким email уже существует.";
  if (message.includes("invalid login credentials")) return "Неверный email или пароль.";
  if (message.includes("weak password") || message.includes("password")) return "Пароль должен быть не короче 6 символов.";
  if (message.includes("invalid email") || message.includes("email")) return "Введите корректный email.";
  if (message.includes("failed to fetch") || message.includes("network")) return "Нет соединения с Supabase. Проверьте интернет.";

  return "Supabase временно недоступен. Попробуйте позже.";
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error("supabase_not_configured");
  }
}
