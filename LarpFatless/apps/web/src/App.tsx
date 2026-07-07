import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  DownloadCloud,
  FileText,
  Flame,
  ImagePlus,
  Lock,
  LogOut,
  Mail,
  Mic,
  Moon,
  RotateCcw,
  Save,
  Send,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Utensils
} from "lucide-react";
import { AnimatedProgressRing } from "./components/AnimatedProgressRing";
import { CustomSegmentedControl } from "./components/CustomSegmentedControl";
import { FoodItemCard } from "./components/FoodItemCard";
import { GradientButton } from "./components/GradientButton";
import { MainMenuHeader } from "./components/MainMenuHeader";
import { createTranslator } from "./i18n/translations";
import { WaveformView } from "./components/WaveformView";
import { AuroraText } from "./components/ui/AuroraText";
import { AnimatedCircularProgressBar } from "./components/ui/AnimatedCircularProgressBar";
import { RevealOnScroll } from "./components/ui/RevealOnScroll";
import { authErrorText, handleAuthRedirect, loginWithEmail, logout, observeAuth, registerWithEmail } from "./services/authService";
import { analyzeImage, analyzeText } from "./services/aiNutritionService";
import {
  clearCloudMeals,
  deleteCloudMeal,
  loadCloudSnapshot,
  migrateLocalDataToCloud,
  saveCloudMeal,
  saveCloudProfile,
  saveCloudSettings
} from "./services/cloudStorageService";
import { compressImageToBase64 } from "./services/imageService";
import { getDiaryEntries, getProfile } from "./services/storageService";
import { isSupabaseConfigured } from "./lib/supabase";
import type {
  ActivityLevel,
  AnalyzeInputType,
  AnalyzeResponse,
  AppSettings,
  DiaryEntry,
  Gender,
  NutritionItem,
  NutritionTotal,
  UserProfile,
  WeightGoal
} from "./types/nutrition";
import type { User } from "@supabase/supabase-js";
import type { AppLanguage, TranslationKey } from "./i18n/translations";
import "./styles/theme.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/animations.css";

type Screen = "home" | "chat" | "diary" | "profile" | "ai-calories" | "settings";
type ProfileFormValues = Pick<UserProfile, "name" | "gender" | "age" | "heightCm" | "weightKg" | "activityLevel" | "goal" | "weeklyWeightChangeKg">;
type ChatMessage = { id: string; role: "user" | "assistant"; text: string };
type TFunction = (key: TranslationKey) => string;
type CalorieProgressOverlayState = { id: string; total: number; goal: number; added: number };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const emptyTotal: NutritionTotal = {
  calories: 0,
  protein_g: 0,
  fat_g: 0,
  carbs_g: 0
};

const activityLabels: Record<ActivityLevel, string> = {
  sedentary: "Сидячий",
  light: "Лёгкая",
  moderate: "Средняя",
  high: "Высокая"
};

const goalLabels: Record<WeightGoal, string> = {
  lose: "Похудение",
  maintain: "Поддержание",
  gain: "Набор массы"
};

const activityLabelEn: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  high: "High"
};

const goalLabelEn: Record<WeightGoal, string> = {
  lose: "Weight loss",
  maintain: "Maintenance",
  gain: "Muscle gain"
};

const activityFactor: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725
};

const defaultForm: ProfileFormValues = {
  name: "",
  gender: "male",
  age: 25,
  heightCm: 175,
  weightKg: 75,
  activityLevel: "light",
  goal: "maintain",
  weeklyWeightChangeKg: 0.3
};

const defaultSettings: AppSettings = {
  theme: "dark",
  assistantEnabled: true,
  language: "ru",
  units: "kg",
  notifications: false,
  nickname: ""
};

const SETTINGS_KEY = "larpfatless-settings-v1";
const CHAT_KEY = "larpfatless-chat-v1";
const LANGUAGE_KEY = "appLanguage";
const NICKNAME_KEY = "larpfatless-nickname";
const appIconUrl = "/icons/app-avatar.png";

const inputOptions = [
  { value: "text", label: "Текст" },
  { value: "voice", label: "Голос" }
] as const;

const quickPrompts = [
  { icon: "🍗", label: "Рассчитать еду", text: "Рассчитай КБЖУ: куриная грудка 150 г, рис 200 г, овощи 100 г" },
  { icon: "🏋", label: "План тренировок", text: "Составь план тренировок на неделю для моей цели" },
  { icon: "🥗", label: "Рацион", text: "Составь рацион на день под мою норму калорий и БЖУ" },
  { icon: "💪", label: "Набор массы", text: "Как мне набрать массу без лишнего жира?" },
  { icon: "🔥", label: "Похудение", text: "Какой дефицит калорий выбрать для похудения?" },
  { icon: "⚡", label: "Сушка", text: "Как правильно сушиться и сохранить мышцы?" },
  { icon: "💬", label: "Задать вопрос", text: "Сколько мне ещё можно съесть сегодня?" }
];

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [cloudLoading, setCloudLoading] = useState(false);
  const [migrationAvailable, setMigrationAvailable] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [foodText, setFoodText] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "hello", role: "assistant", text: "Напишите, что вы съели, или задайте короткий вопрос про питание." }
  ]);
  const [draft, setDraft] = useState<AnalyzeResponse | null>(null);
  const [draftSource, setDraftSource] = useState("");
  const [draftType, setDraftType] = useState<AnalyzeInputType>("text");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<(typeof inputOptions)[number]["value"]>("text");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [toast, setToast] = useState("");
  const [avatarWink, setAvatarWink] = useState(false);
  const [calorieProgressOverlay, setCalorieProgressOverlay] = useState<CalorieProgressOverlayState | null>(null);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const t = useMemo(() => createTranslator(settings.language), [settings.language]);
  const titleText = settings.nickname.trim() || t("defaultNickname");
  const localizedInputOptions = useMemo(
    () => [
      { value: "text" as const, label: settings.language === "en" ? "Text" : "Текст" },
      { value: "voice" as const, label: settings.language === "en" ? "Voice" : "Голос" }
    ],
    [settings.language]
  );
  const localizedQuickPrompts = useMemo(
    () =>
      settings.language === "en"
        ? [
            { icon: "F", label: "Track food", text: "Calculate macros: chicken breast 150 g, rice 200 g, vegetables 100 g" },
            { icon: "W", label: "Workout plan", text: "Create a weekly workout plan for my goal" },
            { icon: "M", label: "Meal plan", text: "Create a daily meal plan for my calories and macros" },
            { icon: "G", label: "Muscle gain", text: "How can I gain muscle without adding too much fat?" },
            { icon: "L", label: "Weight loss", text: "What calorie deficit should I choose for weight loss?" },
            { icon: "C", label: "Cutting", text: "How should I cut while keeping muscle?" },
            { icon: "Q", label: "Ask", text: "How many calories can I still eat today?" }
          ]
        : quickPrompts,
    [settings.language]
  );
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastImageAnalysisRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const todayEntries = useMemo(() => entries.filter((entry) => isToday(entry.createdAt)), [entries]);
  const todayTotal = useMemo(() => todayEntries.reduce((total, entry) => addTotals(total, entry.total), emptyTotal), [todayEntries]);
  const weekTotal = useMemo(() => entries.filter((entry) => isThisWeek(entry.createdAt)).reduce((total, entry) => addTotals(total, entry.total), emptyTotal), [entries]);
  const lowConfidence = draft?.items.some((item) => item.confidence === "low") ?? false;
  const calorieStreak = useMemo(() => (profile ? countCalorieStreak(entries, profile.dailyCalories) : 0), [entries, profile]);

  useEffect(() => {
    return observeAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    void handleAuthRedirect().then((result) => {
      if (result.status === "success") {
        setAuthNotice(result.message);
        setAuthError("");
      }
      if (result.status === "error") {
        setAuthError(result.message);
        setAuthNotice("");
      }
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!authUser) {
      setProfile(null);
      setEntries([]);
      setDraft(null);
      setScreen("home");
      setIsReady(true);
      setCloudLoading(false);
      return;
    }

    setCloudLoading(true);
    setIsReady(false);
    setAuthError("");

    loadCloudSnapshot(authUser.id)
      .then(async (snapshot) => {
        setProfile(snapshot.profile);
        setEntries(snapshot.entries);
        setSettings(snapshot.settings ? { ...defaultSettings, ...snapshot.settings, language: normalizeLanguage(snapshot.settings.language) } : defaultSettings);
        setChatMessages(defaultChatMessages());
        setScreen("home");

        const [localProfile, localEntries] = await Promise.all([getProfile(), getDiaryEntries()]);
        setMigrationAvailable(Boolean(localProfile) || localEntries.length > 0);
      })
      .catch((error) => {
        setAuthError(supabaseDataErrorText(error));
      })
      .finally(() => {
        setCloudLoading(false);
        setIsReady(true);
      });
  }, [authReady, authUser]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.language;
    if (authUser && isReady && !cloudLoading) {
      saveCloudSettings(authUser.id, settings).catch((error) => setAuthError(supabaseDataErrorText(error)));
    }
  }, [settings, authUser, isReady, cloudLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages]);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 2800);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (!calorieProgressOverlay) return;
    const timer = window.setTimeout(() => setCalorieProgressOverlay(null), 3200);
    return () => window.clearTimeout(timer);
  }, [calorieProgressOverlay]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const submitAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Введите email и пароль.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");

    try {
      if (authMode === "register") {
        const result = await registerWithEmail(authEmail.trim(), authPassword, authName);
        if (result.needsConfirmation) {
          setAuthNotice("Письмо для подтверждения отправлено на email. Откройте ссылку из письма, затем вернитесь в приложение.");
          setAuthMode("login");
        }
      } else {
        await loginWithEmail(authEmail.trim(), authPassword);
      }
      setAuthPassword("");
    } catch (error) {
      setAuthError(authErrorText(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    setAuthLoading(true);
    setAuthError("");
    setAuthNotice("");
    try {
      await logout();
      setAuthPassword("");
    } catch (error) {
      setAuthError(authErrorText(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const migrateLocalData = async () => {
    if (!authUser) return;
    setMigrationBusy(true);
    setAuthError("");
    try {
      const [localProfile, localEntries] = await Promise.all([getProfile(), getDiaryEntries()]);
      await migrateLocalDataToCloud(authUser.id, {
        profile: localProfile,
        entries: localEntries,
        settings
      });
      const snapshot = await loadCloudSnapshot(authUser.id);
      setProfile(snapshot.profile);
      setEntries(snapshot.entries);
      if (snapshot.settings) setSettings({ ...defaultSettings, ...snapshot.settings, language: normalizeLanguage(snapshot.settings.language) });
      setMigrationAvailable(false);
      setToast("Локальные данные перенесены в Supabase.");
    } catch (error) {
      setAuthError(supabaseDataErrorText(error));
    } finally {
      setMigrationBusy(false);
    }
  };

  const createOrUpdateProfile = async (values: ProfileFormValues) => {
    if (!authUser) return;
    const now = new Date().toISOString();
    const targets = calculateTargets(values);
    const nextProfile: UserProfile = {
      ...values,
      ...targets,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now
    };

    await saveCloudProfile(authUser.id, nextProfile);
    setProfile(nextProfile);
    setScreen("home");
    setToast("Профиль сохранён, нормы пересчитаны.");
  };

  const runTextAnalysis = async (text = foodText) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Опишите, что вы съели.");
      return;
    }
    await runAnalysis("text", trimmed, () => analyzeText(trimmed, buildAnalyzeContext(settings, profile, todayTotal)));
  };

  const sendChat = async () => {
    const trimmed = foodText.trim();
    if (!trimmed) {
      setError("Напишите сообщение для ассистента.");
      return;
    }

    setChatMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: trimmed }]);
    setFoodText("");
    setError("");

    if (/съел(а)?\s+слона|слон/i.test(trimmed)) {
      setChatMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: "Слона оставим в легендах. А вот реальный приём пищи я посчитаю без паники." }
      ]);
      return;
    }

    if (!settings.assistantEnabled && trimmed.includes("?") && !looksLikeFood(trimmed)) {
      setChatMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: t("assistantDisabledAdvice") }
      ]);
      return;
    }

    await runAnalysis("text", trimmed, () => analyzeText(trimmed, buildAnalyzeContext(settings, profile, todayTotal)));
  };

  const selectImage = (file: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
    setDraft(null);
  };

  const analyzeSelectedImage = async () => {
    if (!selectedImage) {
      setError("Сначала выберите фото блюда.");
      return;
    }
    if (Date.now() - lastImageAnalysisRef.current < 10_000) {
      setError("Подождите несколько секунд перед повторным анализом фото.");
      return;
    }

    lastImageAnalysisRef.current = Date.now();
    const base64 = await compressImageToBase64(selectedImage);
    await runAnalysis("image", selectedImage.name, () => analyzeImage(base64, buildAnalyzeContext(settings, profile, todayTotal)));
  };

  const runAnalysis = async (type: AnalyzeInputType, source: string, loader: () => Promise<AnalyzeResponse>) => {
    if (!isOnline) {
      setError("Нет подключения. ИИ-анализ станет доступен после восстановления сети.");
      return;
    }

    setIsLoading(true);
    setError("");
    vibrate();

    try {
      const result = await loader();
      setDraft(result.items.length > 0 ? result : null);
      setDraftSource(source);
      setDraftType(type);
      if (result.assistantMessage) {
        setChatMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: result.assistantMessage || "" }]);
      } else if (type === "text") {
        setChatMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", text: result.items.length > 0 ? "Я оценил КБЖУ. Проверьте карточки ниже и сохраните в дневник, если всё похоже на правду." : "Готов помочь с питанием, тренировками и рационом. Уточните вопрос или опишите приём пищи." }
        ]);
      }
    } catch (nextError) {
      setError(errorText(nextError));
      if (nextError instanceof Error && nextError.message === "parse_failed") {
        setDraft({
          items: [createManualItem(source)],
          total: emptyTotal
        });
        setDraftSource(source);
        setDraftType(type);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!authUser) return;
    if (!draft) return;
    const normalized = normalizeResponse(draft);
    const entry: DiaryEntry = {
      ...normalized,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      inputType: draftType,
      sourceText: draftSource
    };

    await saveCloudMeal(authUser.id, entry);
    setEntries((current) => [entry, ...current]);
    setCalorieProgressOverlay({
      id: entry.id,
      total: todayTotal.calories + entry.total.calories,
      goal: profile?.dailyCalories ?? Math.max(todayTotal.calories + entry.total.calories, 1),
      added: entry.total.calories
    });
    setDraft(null);
    setSelectedImage(null);
    setImagePreview("");
    setScreen("diary");
    setToast("Сохранено в дневник.");
    vibrate();
  };

  const deleteEntry = async (id: string) => {
    if (!authUser) return;
    await deleteCloudMeal(authUser.id, id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const resetDiary = async () => {
    if (!authUser) return;
    await clearCloudMeals(authUser.id, entries);
    setEntries([]);
    setToast("Дневник очищен.");
  };

  const clearChat = () => {
    const nextMessages = [{ id: "hello", role: "assistant" as const, text: "История очищена. Можно снова начать с питания и тренировок." }];
    setChatMessages(nextMessages);
    setDraft(null);
    setToast("История ИИ очищена.");
  };

  const exportDiary = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "larpfatless-diary.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDiary = async (file: File) => {
    if (!authUser) return;
    const text = await file.text();
    const data = JSON.parse(text) as { entries?: DiaryEntry[] } | DiaryEntry[];
    const importedEntries = Array.isArray(data) ? data : data.entries ?? [];
    const validEntries = importedEntries.filter((entry) => entry.id && entry.createdAt && Array.isArray(entry.items));

    for (const entry of validEntries) {
      await saveCloudMeal(authUser.id, entry);
    }

    setEntries((current) => [...validEntries, ...current].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setToast(`Импортировано записей: ${validEntries.length}.`);
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch, language: normalizeLanguage(patch.language ?? current.language) }));
  };

  const updateDraftItem = (index: number, item: NutritionItem) => {
    if (!draft) return;
    const items = draft.items.map((current, itemIndex) => (itemIndex === index ? item : current));
    setDraft({ items, total: calculateTotal(items) });
  };

  const deleteDraftItem = (index: number) => {
    if (!draft) return;
    const items = draft.items.filter((_, itemIndex) => itemIndex !== index);
    setDraft({ items, total: calculateTotal(items) });
  };

  const startVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setError("Голосовой ввод недоступен в этом браузере. Используйте текстовый ввод.");
      return;
    }

    setError("");
    setIsListening(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const nextAnalyser = audioContext.createAnalyser();
      nextAnalyser.fftSize = 256;
      source.connect(nextAnalyser);
      mediaStreamRef.current = stream;
      setAnalyser(nextAnalyser);
    } catch {
      setAnalyser(null);
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setFoodText(transcript);
      void runTextAnalysis(transcript);
    };
    recognition.onerror = () => setError("Не удалось распознать голос. Попробуйте текстовый ввод.");
    recognition.onend = () => {
      setIsListening(false);
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setAnalyser(null);
    };
    recognition.start();
  };

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const triggerAvatarEasterEgg = () => {
    setAvatarWink(true);
    setToast("Секрет активирован: аватар на вашей стороне.");
    window.setTimeout(() => setAvatarWink(false), 1200);
  };

  if (!isReady) {
    return (
      <main className="app-shell">
        <div className="panel skeleton-panel">
          <Sparkles size={28} />
          <p>Загружаем LarpFatless...</p>
        </div>
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="app-shell">
        <AuthPanel
          mode={authMode}
          email={authEmail}
          password={authPassword}
          name={authName}
          loading={authLoading}
          error={authError}
          notice={authNotice}
          supabaseConfigured={isSupabaseConfigured}
          onModeChange={setAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onNameChange={setAuthName}
          onSubmit={submitAuth}
        />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="app-shell">
        {authError && <div className="error-card auth-wide-error"><strong>Supabase</strong><p>{authError}</p></div>}
        {migrationAvailable && (
          <MigrationBanner busy={migrationBusy} onMigrate={migrateLocalData} onDismiss={() => setMigrationAvailable(false)} />
        )}
        <OnboardingForm onSubmit={createOrUpdateProfile} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {!isOnline && <div className="offline-banner">{t("offline")}</div>}
      {toast && <div className="toast">{toast}</div>}
      {calorieStreak >= 3 && <div className="streak-banner">Вы уже {calorieStreak} дня держитесь в дневной норме. Хорошая серия.</div>}
      {calorieProgressOverlay && <CalorieProgressOverlay progress={calorieProgressOverlay} />}

      <MainMenuHeader
        profile={profile}
        accountId={authUser.id}
        today={todayTotal}
        title={titleText}
        dailyLabel={`${t("kcal")} ${t("today").toLowerCase()}`}
        onOpenProfile={() => setScreen("profile")}
        onOpenSettings={() => setScreen("settings")}
        onAvatarLongPress={triggerAvatarEasterEgg}
        onInstall={installApp}
        canInstall={Boolean(installPrompt)}
        avatarWink={avatarWink}
      />

      <nav className="main-tabs" aria-label="Разделы">
        <button className={screen === "home" ? "is-active" : ""} onClick={() => setScreen("home")} type="button">
          <Flame size={18} />
          <span>{t("menu")}</span>
        </button>
        <button className={screen === "chat" ? "is-active" : ""} onClick={() => setScreen("chat")} type="button">
          <Bot size={18} />
          <span>{t("ai")}</span>
        </button>
        <button className={screen === "diary" ? "is-active" : ""} onClick={() => setScreen("diary")} type="button">
          <FileText size={18} />
          <span>{t("diary")}</span>
        </button>
        <button className={screen === "ai-calories" ? "is-active" : ""} onClick={() => setScreen("ai-calories")} type="button">
          <Camera size={18} />
          <span>{t("photo")}</span>
        </button>
      </nav>
      {authError && <div className="error-card auth-wide-error"><strong>Supabase</strong><p>{authError}</p></div>}
      {cloudLoading && <div className="toast">Загружаем данные Supabase...</div>}
      {migrationAvailable && (
        <MigrationBanner busy={migrationBusy} onMigrate={migrateLocalData} onDismiss={() => setMigrationAvailable(false)} />
      )}

      {screen === "home" && (
        <section className="screen">
          <HomeDashboard profile={profile} today={todayTotal} entries={todayEntries} accountId={authUser.id} t={t} />
          <div className="menu-grid">
            <MenuCard icon={<Bot size={24} />} title={t("aiChat")} text={t("aiChatText")} onClick={() => setScreen("chat")} />
            <MenuCard icon={<FileText size={24} />} title={t("diary")} text={t("diaryText")} onClick={() => setScreen("diary")} />
            <MenuCard icon={<Camera size={24} />} title="AI Calories" text={t("aiCaloriesText")} onClick={() => setScreen("ai-calories")} />
            <MenuCard icon={<Settings size={24} />} title={t("settings")} text={t("settingsText")} onClick={() => setScreen("settings")} />
          </div>
          {installPrompt && (
            <button className="install-strip" type="button" onClick={installApp}>
              <Download size={18} />
              Установить LarpFatless на экран
            </button>
          )}
        </section>
      )}

      {screen === "chat" && (
        <section className="screen">
          <ScreenBack title={t("aiChat")} subtitle={t("fitnessAssistant")} onBack={() => setScreen("home")} />
          <CustomSegmentedControl options={localizedInputOptions} value={inputMode} onChange={setInputMode} />

          <div className="chat-log" aria-live="polite">
            {chatMessages.map((message) => (
              <article className={`chat-message chat-message--${message.role}`} key={message.id}>
                <span className="chat-message__avatar">{message.role === "assistant" ? <Sparkles size={15} /> : <UserRound size={15} />}</span>
                {message.text}
              </article>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="quick-prompts" aria-label="Quick prompts">
            {localizedQuickPrompts.map((prompt) => (
              <button key={prompt.label} type="button" onClick={() => setFoodText(prompt.text)}>
                <span>{prompt.icon}</span>
                {prompt.label}
              </button>
            ))}
          </div>

          {inputMode === "text" ? (
            <div className="panel">
              <label className="field-label" htmlFor="foodText">{t("message")}</label>
              <textarea id="foodText" value={foodText} onChange={(event) => setFoodText(event.target.value)} placeholder="Например: гречка 200 г и куриная грудка 150 г" />
              <GradientButton onClick={sendChat} disabled={isLoading || !isOnline} loading={isLoading}>
                <Send size={18} />
                {t("send")}
              </GradientButton>
            </div>
          ) : (
            <div className="panel">
              <WaveformView active={isListening} analyser={analyser} />
              <GradientButton onClick={startVoice} disabled={isLoading || !isOnline || isListening} loading={isListening}>
                <Mic size={18} />
                {t("recordVoice")}
              </GradientButton>
              {!voiceSupported && <p className="hint">Браузер не поддерживает Web Speech API. Текстовый ввод остаётся доступен.</p>}
            </div>
          )}

          <ErrorBlock error={error} onRetry={sendChat} disabled={isLoading || !isOnline} t={t} />
          <DraftResult draft={draft} lowConfidence={lowConfidence} onChange={updateDraftItem} onDelete={deleteDraftItem} onSave={saveDraft} t={t} />
        </section>
      )}

      {screen === "ai-calories" && (
        <section className="screen">
          <ScreenBack title="AI Calories" subtitle={t("aiCaloriesText")} onBack={() => setScreen("home")} />
          <div className="panel file-panel">
            {imagePreview ? (
              <img className="photo-preview" src={imagePreview} alt="Превью блюда" />
            ) : (
              <ImagePlus size={46} />
            )}
            <strong>{selectedImage ? selectedImage.name : t("foodPhoto")}</strong>
            <p>Снимите блюдо на телефон или выберите файл из галереи. Перед отправкой фото останется только в этом сеансе.</p>
            <label className="file-button">
              <input accept="image/*" capture="environment" type="file" onChange={(event) => event.target.files?.[0] && selectImage(event.target.files[0])} />
              {t("choosePhoto")}
            </label>
            <GradientButton onClick={analyzeSelectedImage} disabled={isLoading || !isOnline || !selectedImage} loading={isLoading}>
              <Camera size={18} />
              {t("analyze")}
            </GradientButton>
          </div>

          <ErrorBlock error={error} onRetry={analyzeSelectedImage} disabled={isLoading || !isOnline || !selectedImage} t={t} />
          <DraftResult draft={draft} lowConfidence={lowConfidence} onChange={updateDraftItem} onDelete={deleteDraftItem} onSave={saveDraft} showMedicalWarning t={t} />
        </section>
      )}

      {screen === "diary" && (
        <section className="screen">
          <ScreenBack title={t("diary")} subtitle={t("diaryText")} onBack={() => setScreen("home")} />
          <div className="summary-grid">
            <SummaryTile label={t("today")} value={`${Math.round(todayTotal.calories)} ${t("kcal")}`} />
            <SummaryTile label={settings.language === "en" ? "Week" : "Неделя"} value={`${Math.round(weekTotal.calories)} ${t("kcal")}`} />
            <SummaryTile label={t("protein")} value={`${Math.round(todayTotal.protein_g)} / ${profile.proteinGoal} ${t("grams")}`} />
            <SummaryTile label={t("carbs")} value={`${Math.round(todayTotal.carbs_g)} / ${profile.carbsGoal} ${t("grams")}`} />
          </div>
          <button className="icon-text-button danger diary-clear" onClick={resetDiary} type="button" disabled={entries.length === 0}>
            <Trash2 size={16} />
            {t("clearDiary")}
          </button>

          {todayEntries.length === 0 ? (
            <div className="empty-state">
              <FileText size={38} />
              <p>{t("noFoodToday")}</p>
            </div>
          ) : (
            todayEntries.map((entry) => (
              <article className="diary-entry" key={entry.id}>
                <div className="diary-entry__head">
                  <div>
                    <strong>{Math.round(entry.total.calories)} {t("kcal")}</strong>
                    <span>{new Date(entry.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <button className="icon-text-button danger" onClick={() => deleteEntry(entry.id)} type="button">
                    <Trash2 size={16} />
                    {t("delete")}
                  </button>
                </div>
                {entry.items.map((item, index) => (
                  <FoodItemCard key={`${entry.id}-${item.name}-${index}`} item={item} index={index} />
                ))}
              </article>
            ))
          )}
        </section>
      )}

      {screen === "profile" && (
        <section className="screen">
          <ScreenBack title={t("profile")} subtitle={t("recalculateGoal")} onBack={() => setScreen("home")} />
          <ProfileForm initial={profile} onSubmit={createOrUpdateProfile} t={t} />
        </section>
      )}

      {screen === "settings" && (
        <section className="screen">
          <ScreenBack title={t("settings")} subtitle={t("app")} onBack={() => setScreen("home")} />
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            t={t}
            onClearDiary={resetDiary}
            onClearChat={clearChat}
            onExportDiary={exportDiary}
            onImportDiary={importDiary}
            authEmail={authUser.email ?? ""}
            authLoading={authLoading}
            onSignOut={signOutUser}
          />
        </section>
      )}
    </main>
  );
}

function OnboardingForm({ onSubmit }: { onSubmit: (values: ProfileFormValues) => void }) {
  return (
    <section className="screen onboarding">
      <div className="brand-mark">
        <img src={appIconUrl} alt="" />
      </div>
      <h1><AuroraText speed={0.82}>LarpFatless</AuroraText></h1>
      <p>Сначала создадим профиль. Без него приложение не откроет меню, потому что нормы КБЖУ должны быть личными.</p>
      <ProfileForm initial={defaultForm} onSubmit={onSubmit} submitLabel="Создать профиль" />
    </section>
  );
}

function AuthPanel({
  mode,
  email,
  password,
  name,
  loading,
  error,
  notice,
  supabaseConfigured,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onSubmit
}: {
  mode: "login" | "register";
  email: string;
  password: string;
  name: string;
  loading: boolean;
  error: string;
  notice: string;
  supabaseConfigured: boolean;
  onModeChange: (mode: "login" | "register") => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const isRegister = mode === "register";

  return (
    <section className="screen auth-screen">
      <div className="brand-mark">
        <img src={appIconUrl} alt="" />
      </div>
      <h1><AuroraText speed={0.82}>LarpFatless</AuroraText></h1>

      <div className="panel auth-panel">
        <div className="auth-mode">
          <button className={!isRegister ? "is-active" : ""} type="button" onClick={() => onModeChange("login")}>Вход</button>
          <button className={isRegister ? "is-active" : ""} type="button" onClick={() => onModeChange("register")}>Регистрация</button>
        </div>

        {isRegister && (
          <label className="profile-field">
            <span>Имя</span>
            <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Максим" />
          </label>
        )}

        <label className="profile-field">
          <span>Email</span>
          <div className="input-with-icon">
            <Mail size={17} />
            <input value={email} inputMode="email" autoComplete="email" onChange={(event) => onEmailChange(event.target.value)} placeholder="you@email.com" />
          </div>
        </label>

        <label className="profile-field">
          <span>Пароль</span>
          <div className="input-with-icon">
            <Lock size={17} />
            <input value={password} type="password" autoComplete={isRegister ? "new-password" : "current-password"} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Минимум 6 символов" />
          </div>
        </label>

        {!supabaseConfigured && (
          <div className="error-card auth-inline-error">
            <strong>Supabase не настроен</strong>
            <p>Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY на Vercel и в локальный `.env`.</p>
          </div>
        )}

        {error && (
          <div className="error-card auth-inline-error">
            <strong>Не получилось</strong>
            <p>{error}</p>
          </div>
        )}

        {notice && (
          <div className="auth-success">
            <strong>Письмо</strong>
            <p>{notice}</p>
          </div>
        )}

        <GradientButton onClick={onSubmit} disabled={loading || !supabaseConfigured} loading={loading}>
          <UserRound size={18} />
          {isRegister ? "Создать аккаунт" : "Войти"}
        </GradientButton>
      </div>
    </section>
  );
}

function MigrationBanner({ busy, onMigrate, onDismiss }: { busy: boolean; onMigrate: () => void; onDismiss: () => void }) {
  return (
    <div className="migration-banner">
      <div>
        <strong>Найдены старые локальные данные</strong>
        <p>Можно перенести профиль и дневник в Supabase. Локальные данные не будут удалены автоматически.</p>
      </div>
      <div className="migration-actions">
        <button type="button" onClick={onMigrate} disabled={busy}>{busy ? "Переносим..." : "Перенести"}</button>
        <button type="button" onClick={onDismiss} disabled={busy}>Позже</button>
      </div>
    </div>
  );
}

function CalorieProgressOverlay({ progress }: { progress: CalorieProgressOverlayState }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.round((progress.total / Math.max(progress.goal, 1)) * 100);

  useEffect(() => {
    setAnimatedValue(0);
    const frame = window.requestAnimationFrame(() => setAnimatedValue(progress.total));
    return () => window.cancelAnimationFrame(frame);
  }, [progress.id, progress.total]);

  return (
    <div className="calorie-progress-overlay" role="status" aria-live="polite">
      <div className="calorie-progress-overlay__panel">
        <AnimatedCircularProgressBar
          value={animatedValue}
          max={Math.max(progress.goal, progress.total, 1)}
          gaugePrimaryColor="rgba(255, 255, 255, 0.98)"
          gaugeSecondaryColor="rgba(255, 255, 255, 0.12)"
        />
        <div className="calorie-progress-overlay__copy">
          <span>Добавлено {Math.round(progress.added)} ккал</span>
          <strong>{Math.round(progress.total)} ккал за сегодня</strong>
          <small>{percentage}% дневной нормы</small>
        </div>
      </div>
    </div>
  );
}

function HomeDashboard({ profile, today, entries, accountId, t }: { profile: UserProfile; today: NutritionTotal; entries: DiaryEntry[]; accountId: string; t: TFunction }) {
  const caloriesLeft = Math.max(0, profile.dailyCalories - today.calories);
  const recentEntries = entries.slice(0, 3);
  const isEn = t("menu") === "Menu";
  const displayName = profile.name.trim() || "LarpFatless";

  return (
    <div className="dashboard">
      <RevealOnScroll as="section" className="dashboard-hero">
        <div className="dashboard-hero__intro">
          <span>LarpFatless cloud</span>
          <h2><AuroraText speed={0.72}>{isEn ? `${displayName}, nutrition cockpit` : `${displayName}, центр питания`}</AuroraText></h2>
          <p>{isEn ? "Live balance of calories, macros and today's meals." : "Живой баланс калорий, макроцелей и сегодняшних приёмов пищи."}</p>
        </div>
        <div className="dashboard-hero__ring">
          <AnimatedProgressRing value={today.calories} target={profile.dailyCalories} />
        </div>
        <div className="dashboard-stat">
          <span>{t("eaten")}</span>
          <strong>{Math.round(today.calories)} {t("kcal")}</strong>
        </div>
        <div className="dashboard-stat">
          <span>{t("remaining")}</span>
          <strong>{Math.round(caloriesLeft)} {t("kcal")}</strong>
        </div>
        <div className="dashboard-stat dashboard-stat--goal">
          <span>{t("dailyGoal")}</span>
          <strong>{profile.dailyCalories} {t("kcal")}</strong>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" className="macro-panel" delay={60}>
        <MacroProgress label={t("protein")} icon="Б" value={today.protein_g} target={profile.proteinGoal} unit={t("grams")} />
        <MacroProgress label={t("fat")} icon="Ж" value={today.fat_g} target={profile.fatGoal} unit={t("grams")} />
        <MacroProgress label={t("carbs")} icon="У" value={today.carbs_g} target={profile.carbsGoal} unit={t("grams")} />
      </RevealOnScroll>

      <RevealOnScroll as="section" className="today-card" delay={100}>
        <div className="section-heading compact">
          <div>
            <p>{t("today")}</p>
            <h2>{t("stats")}</h2>
          </div>
        </div>
        <div className="summary-grid">
          <SummaryTile label={t("calories")} value={`${Math.round(today.calories)} ${t("kcal")}`} />
          <SummaryTile label={t("protein")} value={`${Math.round(today.protein_g)} ${t("grams")}`} />
          <SummaryTile label={t("fat")} value={`${Math.round(today.fat_g)} ${t("grams")}`} />
          <SummaryTile label={t("carbs")} value={`${Math.round(today.carbs_g)} ${t("grams")}`} />
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" className="recent-card" delay={140}>
        <div className="section-heading compact">
          <div>
            <p>{t("recent")}</p>
            <h2>{t("meals")}</h2>
          </div>
          <Utensils size={22} />
        </div>
        {recentEntries.length === 0 ? (
          <div className="empty-state inline">
            <p>{t("noFoodToday")}</p>
          </div>
        ) : (
          <div className="recent-list">
            {recentEntries.map((entry) => (
              <RevealOnScroll as="article" className="recent-meal" key={entry.id}>
                <div>
                  <strong>{entry.items[0]?.name || t("meals")}</strong>
                  <span>{new Date(entry.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <b>{Math.round(entry.total.calories)} {t("kcal")}</b>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </RevealOnScroll>
    </div>
  );
}

function MacroProgress({ label, icon, value, target, unit }: { label: string; icon: string; value: number; target: number; unit: string }) {
  const percent = Math.min(100, Math.round((value / Math.max(1, target)) * 100));

  return (
    <div className="macro-progress">
      <div className="macro-progress__top">
        <span>{icon} {label}</span>
        <strong>{Math.round(value)} / {target} {unit}</strong>
      </div>
      <div className="macro-progress__track">
        <div style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SettingsPanel({
  settings,
  onChange,
  t,
  onClearDiary,
  onClearChat,
  onExportDiary,
  onImportDiary,
  authEmail,
  authLoading,
  onSignOut
}: {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  t: TFunction;
  onClearDiary: () => void;
  onClearChat: () => void;
  onExportDiary: () => void;
  onImportDiary: (file: File) => void;
  authEmail: string;
  authLoading: boolean;
  onSignOut: () => void;
}) {
  const [nicknameDraft, setNicknameDraft] = useState(settings.nickname);
  const [nicknameError, setNicknameError] = useState("");

  useEffect(() => {
    setNicknameDraft(settings.nickname);
  }, [settings.nickname]);

  const saveNickname = () => {
    const trimmed = nicknameDraft.trim();
    if (nicknameDraft.length > 0 && trimmed.length === 0) {
      setNicknameError(t("nicknameEmptyError"));
      return;
    }
    setNicknameError("");
    onChange({ nickname: trimmed.slice(0, 24) });
  };

  return (
    <div className="settings-stack">
      <RevealOnScroll as="section" className="settings-card">
        <h3>{t("theme")}</h3>
        <label className="settings-field">
          <span>{t("nickname")}</span>
          <div className="nickname-row">
            <input
              value={nicknameDraft}
              maxLength={24}
              placeholder={t("nicknamePlaceholder")}
              onChange={(event) => {
                setNicknameDraft(event.target.value.slice(0, 24));
                setNicknameError("");
              }}
            />
            <button type="button" onClick={saveNickname}>{t("save")}</button>
          </div>
          <small className={nicknameError ? "field-error" : "field-hint"}>{nicknameError || t("nicknameHelp")}</small>
        </label>
        <div className="theme-switcher">
          <button className={settings.theme === "dark" ? "is-active" : ""} type="button" onClick={() => onChange({ theme: "dark" })}>
            <Moon size={18} />
            {t("darkTheme")}
          </button>
          <button className={settings.theme === "light" ? "is-active" : ""} type="button" onClick={() => onChange({ theme: "light" })}>
            <Sun size={18} />
            {t("lightTheme")}
          </button>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" className="settings-card" delay={60}>
        <h3>{t("fitnessAssistant")}</h3>
        <SettingToggle
          icon={<Bot size={20} />}
          title={t("enableFitnessAssistant")}
          text={settings.assistantEnabled ? t("assistantOn") : t("assistantOff")}
          checked={settings.assistantEnabled}
          onChange={(checked) => onChange({ assistantEnabled: checked })}
        />
      </RevealOnScroll>

      <RevealOnScroll as="section" className="settings-card" delay={100}>
        <h3>{t("app")}</h3>
        <label className="settings-field">
          <span>{t("language")}</span>
          <div className="theme-switcher language-switcher">
            <button className={settings.language === "ru" ? "is-active" : ""} type="button" onClick={() => onChange({ language: "ru" })}>
              {t("russian")}
            </button>
            <button className={settings.language === "en" ? "is-active" : ""} type="button" onClick={() => onChange({ language: "en" })}>
              {t("english")}
            </button>
          </div>
        </label>
        <label className="settings-field">
          <span>{t("units")}</span>
          <select value={settings.units} onChange={(event) => onChange({ units: event.target.value as AppSettings["units"] })}>
            <option value="kg">{t("kilograms")}</option>
            <option value="lb">{t("pounds")}</option>
          </select>
        </label>
        <SettingToggle
          icon={<Bell size={20} />}
          title={t("notifications")}
          text={settings.language === "en" ? "Local setting for future reminders." : "Локальная настройка для будущих напоминаний."}
          checked={settings.notifications}
          onChange={(checked) => onChange({ notifications: checked })}
        />
      </RevealOnScroll>

      <RevealOnScroll as="section" className="settings-card" delay={140}>
        <h3>{t("data")}</h3>
        <div className="settings-actions">
          <button type="button" onClick={onClearDiary}>
            <Trash2 size={18} />
            {t("clearDiary")}
          </button>
          <button type="button" onClick={onClearChat}>
            <Bot size={18} />
            {t("clearAiHistory")}
          </button>
          <button type="button" onClick={onExportDiary}>
            <DownloadCloud size={18} />
            {t("exportDiary")}
          </button>
          <label className="settings-import">
            <Upload size={18} />
            {t("importDiary")}
            <input type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && onImportDiary(event.target.files[0])} />
          </label>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" className="settings-card" delay={180}>
        <h3>Аккаунт</h3>
        <div className="account-settings">
          <span>{authEmail}</span>
          <button type="button" onClick={onSignOut} disabled={authLoading}>
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </RevealOnScroll>

      <RevealOnScroll as="section" className="settings-card" delay={220}>
        <h3>{t("aboutApp")}</h3>
        <div className="about-list">
          <span>{t("privacy")}</span>
          <span>{t("version")}</span>
        </div>
      </RevealOnScroll>
    </div>
  );
}

function SettingToggle({ icon, title, text, checked, onChange }: { icon: ReactNode; title: string; text: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="setting-toggle">
      <span className="setting-toggle__icon">{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

function ProfileForm({ initial, onSubmit, t, submitLabel }: { initial: ProfileFormValues; onSubmit: (values: ProfileFormValues) => void; t?: TFunction; submitLabel?: string }) {
  const [values, setValues] = useState<ProfileFormValues>({
    name: initial.name,
    gender: initial.gender,
    age: initial.age,
    heightCm: initial.heightCm,
    weightKg: initial.weightKg,
    activityLevel: initial.activityLevel,
    goal: initial.goal,
    weeklyWeightChangeKg: initial.weeklyWeightChangeKg
  });
  const targets = useMemo(() => calculateTargets(values), [values]);
  const canSubmit = values.name.trim().length >= 2 && values.age > 0 && values.heightCm > 0 && values.weightKg > 0;
  const isEn = t?.("menu") === "Menu";

  const update = <Key extends keyof ProfileFormValues>(key: Key, value: ProfileFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form className="panel profile-form" onSubmit={(event) => {
      event.preventDefault();
      if (canSubmit) onSubmit(values);
    }}>
      <ProfileField label={isEn ? "Name" : "Имя"} value={values.name} onChange={(value) => update("name", value)} />
      <div className="form-grid">
        <ProfileField label={t?.("age") ?? "Возраст"} value={String(values.age)} inputMode="numeric" onChange={(value) => update("age", numeric(value))} />
        <ProfileField label={`${t?.("height") ?? "Рост"}, см`} value={String(values.heightCm)} inputMode="decimal" onChange={(value) => update("heightCm", numeric(value))} />
        <ProfileField label={`${t?.("weight") ?? "Вес"}, кг`} value={String(values.weightKg)} inputMode="decimal" onChange={(value) => update("weightKg", numeric(value))} />
        <ProfileField label={isEn ? "Tempo, kg/week" : "Темп, кг/нед."} value={String(values.weeklyWeightChangeKg)} inputMode="decimal" onChange={(value) => update("weeklyWeightChangeKg", numeric(value))} />
      </div>

      <label className="profile-field">
        <span>{t?.("gender") ?? "Пол"}</span>
        <select value={values.gender} onChange={(event) => update("gender", event.target.value as Gender)}>
          <option value="male">{isEn ? "Male" : "Мужской"}</option>
          <option value="female">{isEn ? "Female" : "Женский"}</option>
        </select>
      </label>

      <label className="profile-field">
        <span>{t?.("activity") ?? "Активность"}</span>
        <select value={values.activityLevel} onChange={(event) => update("activityLevel", event.target.value as ActivityLevel)}>
          {Object.entries(activityLabels).map(([value, label]) => <option key={value} value={value}>{isEn ? activityLabelEn[value as ActivityLevel] : label}</option>)}
        </select>
      </label>

      <label className="profile-field">
        <span>{t?.("goal") ?? "Цель"}</span>
        <select value={values.goal} onChange={(event) => update("goal", event.target.value as WeightGoal)}>
          {Object.entries(goalLabels).map(([value, label]) => <option key={value} value={value}>{isEn ? goalLabelEn[value as WeightGoal] : label}</option>)}
        </select>
      </label>

      <div className="targets-preview">
        <SummaryTile label={t?.("goal") ?? "Норма"} value={`${targets.dailyCalories} ${t?.("kcal") ?? "ккал"}`} />
        <SummaryTile label={t?.("protein") ?? "Белки"} value={`${targets.proteinGoal} ${t?.("grams") ?? "г"}`} />
        <SummaryTile label={t?.("fat") ?? "Жиры"} value={`${targets.fatGoal} ${t?.("grams") ?? "г"}`} />
        <SummaryTile label={t?.("carbs") ?? "Углеводы"} value={`${targets.carbsGoal} ${t?.("grams") ?? "г"}`} />
      </div>

      <GradientButton disabled={!canSubmit}>
        <Check size={18} />
        {submitLabel ?? t?.("recalculateGoal") ?? "Сохранить профиль"}
      </GradientButton>
    </form>
  );
}

function ProfileField({ label, value, inputMode, onChange }: { label: string; value: string; inputMode?: "numeric" | "decimal"; onChange: (value: string) => void }) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <input value={value} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MenuCard({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button className="menu-card" type="button" onClick={onClick}>
      <span className="menu-card__icon">{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
      <span className="menu-card__arrow"><ChevronRight size={18} /></span>
    </button>
  );
}

function ScreenBack({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <div className="section-heading">
      <div>
        <p>{subtitle}</p>
        <h2>{title}</h2>
      </div>
      <button className="header-icon-button" type="button" onClick={onBack} aria-label="Назад в меню">
        <ChevronLeft size={22} />
      </button>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ErrorBlock({ error, onRetry, disabled, t }: { error: string; onRetry: () => void; disabled?: boolean; t: TFunction }) {
  if (!error) return null;

  return (
    <div className="error-card">
      <strong>{t("couldNot")}</strong>
      <p>{error}</p>
      <button type="button" onClick={onRetry} disabled={disabled}>
        <RotateCcw size={16} />
        {t("retry")}
      </button>
    </div>
  );
}

function DraftResult({
  draft,
  lowConfidence,
  onChange,
  onDelete,
  onSave,
  t,
  showMedicalWarning = false
}: {
  draft: AnalyzeResponse | null;
  lowConfidence: boolean;
  onChange: (index: number, item: NutritionItem) => void;
  onDelete: (index: number) => void;
  onSave: () => void;
  t: TFunction;
  showMedicalWarning?: boolean;
}) {
  if (!draft) return null;

  return (
    <section className="result-panel">
      <div className="section-heading">
        <div>
          <p>{t("result")}</p>
          <h2>{Math.round(draft.total.calories)} {t("kcal")}</h2>
        </div>
        {lowConfidence && <span className="confidence-badge">{t("checkValues")}</span>}
      </div>
      {draft.items.map((item, index) => (
        <FoodItemCard key={`${item.name}-${index}`} item={item} index={index} editable onChange={(nextItem) => onChange(index, nextItem)} onDelete={() => onDelete(index)} />
      ))}
      {showMedicalWarning && (
        <p className="medical-warning">
          <AlertTriangle size={16} />
          {t("medicalWarning")}
        </p>
      )}
      <GradientButton onClick={onSave}>
        <Save size={18} />
        {t("saveToDiary")}
      </GradientButton>
    </section>
  );
}

function calculateTargets(values: ProfileFormValues) {
  const bmr = values.gender === "male"
    ? 10 * values.weightKg + 6.25 * values.heightCm - 5 * values.age + 5
    : 10 * values.weightKg + 6.25 * values.heightCm - 5 * values.age - 161;
  const maintenance = bmr * activityFactor[values.activityLevel];
  const weeklyDeltaCalories = Math.min(Math.max(values.weeklyWeightChangeKg, 0.1), 1) * 1100;
  const goalAdjustment = values.goal === "lose" ? -weeklyDeltaCalories : values.goal === "gain" ? weeklyDeltaCalories : 0;
  const dailyCalories = Math.max(1200, Math.round(maintenance + goalAdjustment));
  const proteinGoal = Math.round(values.weightKg * (values.goal === "gain" ? 2 : 1.7));
  const fatGoal = Math.round((dailyCalories * 0.27) / 9);
  const carbsGoal = Math.max(0, Math.round((dailyCalories - proteinGoal * 4 - fatGoal * 9) / 4));

  return { dailyCalories, proteinGoal, fatGoal, carbsGoal };
}

function createManualItem(source: string): NutritionItem {
  return {
    name: source || "Блюдо",
    weight_g: 0,
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    confidence: "low"
  };
}

function normalizeResponse(response: AnalyzeResponse): AnalyzeResponse {
  return {
    items: response.items,
    total: calculateTotal(response.items),
    assistantMessage: response.assistantMessage
  };
}

function calculateTotal(items: NutritionItem[]): NutritionTotal {
  return items.reduce((total, item) => addTotals(total, item), emptyTotal);
}

function addTotals(total: NutritionTotal, item: Pick<NutritionTotal, "calories" | "protein_g" | "fat_g" | "carbs_g">): NutritionTotal {
  return {
    calories: total.calories + item.calories,
    protein_g: total.protein_g + item.protein_g,
    fat_g: total.fat_g + item.fat_g,
    carbs_g: total.carbs_g + item.carbs_g
  };
}

function numeric(value: string) {
  return Number(value.replace(",", ".")) || 0;
}

function vibrate() {
  navigator.vibrate?.(12);
}

function errorText(error: unknown) {
  if (!(error instanceof Error)) return "Проблема с распознаванием. Попробуйте позже.";
  if (error.message === "timeout") return "Запрос занял больше 15 секунд. Попробуйте ещё раз или задайте вопрос короче.";
  if (error.message === "parse_failed") return "ИИ вернул неполный ответ. Заполните значения вручную.";
  if (error.message === "gemini_key_missing") return "На хостинге не задан серверный ключ анализа.";
  if (error.message === "rate_limited") return "Сервис анализа временно перегружен, попробуйте через минуту.";
  return "Не удалось распознать еду. Попробуйте другой ввод или фото.";
}

function isToday(value: string) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function isThisWeek(value: string) {
  const date = new Date(value);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return date >= weekAgo && date <= now;
}

function countCalorieStreak(entries: DiaryEntry[], dailyGoal: number) {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    const key = new Date(entry.createdAt).toDateString();
    totals.set(key, (totals.get(key) ?? 0) + entry.total.calories);
  });

  let streak = 0;
  for (let index = 0; index < 14; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const total = totals.get(date.toDateString());
    if (!total || total > dailyGoal) break;
    streak += 1;
  }
  return streak;
}

function looksLikeFood(text: string) {
  return /(рассчитай кбжу|посчитай кбжу|сколько кбжу|съел|съела|ел |ела |завтрак|обед|ужин|перекус|\d+\s?(г|гр|gram|grams|g)\b|яйцо|курица|рис|гречка|овсянка|творог|молоко|сыр|мясо|рыба|хлеб|салат|суп|картошка|кофе|банан|ate|i had|food log|meal log|breakfast|lunch|dinner|chicken|rice|egg|oat|banana)/i.test(text);
}

function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
    const storedNickname = window.localStorage.getItem(NICKNAME_KEY);
    const language = normalizeLanguage(storedLanguage ?? stored.language);
    return {
      ...defaultSettings,
      ...stored,
      language,
      nickname: typeof storedNickname === "string" ? storedNickname.slice(0, 24) : stored.nickname ?? ""
    };
  } catch {
    return defaultSettings;
  }
}

function normalizeLanguage(value: unknown): AppLanguage {
  return value === "en" || value === "english" ? "en" : "ru";
}

function loadChatMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : null;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ id: "hello", role: "assistant", text: "Я ваш ИИ фитнес-ассистент. Могу считать еду, помогать с тренировками, рационом, сушкой и восстановлением." }];
  } catch {
    return [{ id: "hello", role: "assistant", text: "Я ваш ИИ фитнес-ассистент. Могу считать еду, помогать с тренировками, рационом, сушкой и восстановлением." }];
  }
}

function defaultChatMessages(): ChatMessage[] {
  return [{ id: "hello", role: "assistant", text: "Я ваш ИИ фитнес-ассистент. Могу считать еду, помогать с тренировками, рационом, сушкой и восстановлением." }];
}

function supabaseDataErrorText(error: unknown) {
  if (!navigator.onLine) return "Нет интернета. Данные Supabase сейчас недоступны.";
  if (error instanceof Error && error.message === "supabase_not_configured") {
    return "Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY.";
  }

  const details = supabaseErrorDetails(error);
  if (details.includes("pgrst205") || details.includes("could not find the table") || details.includes("schema cache")) {
    return "В Supabase не найдены таблицы profiles, meals или user_settings. Выполните SQL из docs/supabase-vercel.md в SQL Editor.";
  }
  if (details.includes("42501") || details.includes("permission denied") || details.includes("row-level security") || details.includes("rls")) {
    return "Supabase отклонил доступ к данным. Проверьте RLS-политики для profiles, meals и user_settings.";
  }
  if (details.includes("401") || details.includes("invalid api key") || details.includes("jwt")) {
    return "Supabase ключ или URL указаны неверно. Проверьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в Vercel.";
  }
  if (details.includes("failed to fetch") || details.includes("network")) {
    return "Нет соединения с Supabase. Проверьте интернет, URL проекта и блокировку запросов в браузере.";
  }

  return "Supabase вернул ошибку данных. Проверьте таблицы, RLS-политики и env-переменные проекта.";
}

function supabaseErrorDetails(error: unknown) {
  if (!error) return "";
  if (error instanceof Error) return error.message.toLowerCase();

  try {
    return JSON.stringify(error).toLowerCase();
  } catch {
    return String(error).toLowerCase();
  }
}

function buildAnalyzeContext(settings: AppSettings, profile: UserProfile | null, today: NutritionTotal) {
  return {
    assistantEnabled: settings.assistantEnabled,
    language: settings.language,
    profile: profile
      ? {
          name: profile.name,
          age: profile.age,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          gender: profile.gender,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          dailyCalories: profile.dailyCalories,
          proteinGoal: profile.proteinGoal,
          fatGoal: profile.fatGoal,
          carbsGoal: profile.carbsGoal
        }
      : undefined,
    today
  };
}

declare global {
  interface SpeechRecognitionResultList {
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
