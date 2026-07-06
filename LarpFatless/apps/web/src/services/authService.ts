import type { EmailOtpType, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type AuthRedirectResult =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

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

export async function handleAuthRedirect(): Promise<AuthRedirectResult> {
  if (!supabase) return { status: "idle" };

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const errorDescription = url.searchParams.get("error_description") ?? hashParams.get("error_description");
  const errorCode = url.searchParams.get("error_code") ?? hashParams.get("error_code");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const hasImplicitTokens = hashParams.has("access_token") || hashParams.has("refresh_token");

  if (!errorDescription && !code && !tokenHash && !hasImplicitTokens) return { status: "idle" };

  if (errorDescription) {
    clearAuthParams();
    return { status: "error", message: authRedirectErrorText(errorDescription, errorCode) };
  }

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) throw error;
    } else if (hasImplicitTokens) {
      await supabase.auth.getSession();
    }

    clearAuthParams();
    return { status: "success", message: "Email подтверждён. Можно продолжать в LarpFatless." };
  } catch (error) {
    clearAuthParams();
    return { status: "error", message: authRedirectErrorText(error) };
  }
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  ensureSupabase();
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirectUrl(),
      data: {
        display_name: displayName.trim()
      }
    }
  });
  if (error) throw error;
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("email_already_registered");
  }
  return { user: data.user, needsConfirmation: !data.session };
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
  if (message.includes("email_already_registered")) return "Пользователь с таким email уже существует.";
  if (message.includes("already registered") || message.includes("already exists")) return "Пользователь с таким email уже существует.";
  if (message.includes("invalid login credentials")) return "Неверный email или пароль.";
  if (message.includes("email not confirmed")) return "Email ещё не подтверждён. Проверьте письмо от Supabase.";
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

function authRedirectUrl() {
  return `${window.location.origin}/auth/callback`;
}

function clearAuthParams() {
  window.history.replaceState({}, document.title, "/");
}

function authRedirectErrorText(error: unknown, code?: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = `${code ?? ""} ${message}`.toLowerCase();

  if (normalized.includes("expired") || normalized.includes("invalid")) {
    return "Ссылка подтверждения истекла или недействительна. Попробуйте зарегистрироваться ещё раз.";
  }

  if (normalized.includes("access_denied")) {
    return "Подтверждение email было отменено или отклонено.";
  }

  return "Не удалось подтвердить email. Откройте ссылку ещё раз или попробуйте войти позже.";
}
