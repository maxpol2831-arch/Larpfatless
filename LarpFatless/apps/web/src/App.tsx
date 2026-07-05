import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  Check,
  ChevronLeft,
  Download,
  FileText,
  Flame,
  ImagePlus,
  Mic,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  Utensils
} from "lucide-react";
import { AnimatedProgressRing } from "./components/AnimatedProgressRing";
import { CustomSegmentedControl } from "./components/CustomSegmentedControl";
import { FoodItemCard } from "./components/FoodItemCard";
import { GradientButton } from "./components/GradientButton";
import { MainMenuHeader } from "./components/MainMenuHeader";
import { WaveformView } from "./components/WaveformView";
import { analyzeImage, analyzeText } from "./services/aiNutritionService";
import { compressImageToBase64 } from "./services/imageService";
import { clearDiary, deleteDiaryEntry, getDiaryEntries, getProfile, saveDiaryEntry, saveProfile } from "./services/storageService";
import type {
  ActivityLevel,
  AnalyzeInputType,
  AnalyzeResponse,
  DiaryEntry,
  Gender,
  NutritionItem,
  NutritionTotal,
  UserProfile,
  WeightGoal
} from "./types/nutrition";
import "./theme/theme.css";
import "./styles.css";

type Screen = "home" | "chat" | "diary" | "profile" | "ai-calories";
type ProfileFormValues = Pick<UserProfile, "name" | "gender" | "age" | "heightCm" | "weightKg" | "activityLevel" | "goal" | "weeklyWeightChangeKg">;
type ChatMessage = { id: string; role: "user" | "assistant"; text: string };
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

const inputOptions = [
  { value: "text", label: "Текст" },
  { value: "voice", label: "Голос" }
] as const;

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastImageAnalysisRef = useRef(0);

  const todayEntries = useMemo(() => entries.filter((entry) => isToday(entry.createdAt)), [entries]);
  const todayTotal = useMemo(() => todayEntries.reduce((total, entry) => addTotals(total, entry.total), emptyTotal), [todayEntries]);
  const weekTotal = useMemo(() => entries.filter((entry) => isThisWeek(entry.createdAt)).reduce((total, entry) => addTotals(total, entry.total), emptyTotal), [entries]);
  const lowConfidence = draft?.items.some((item) => item.confidence === "low") ?? false;
  const calorieStreak = useMemo(() => (profile ? countCalorieStreak(entries, profile.dailyCalories) : 0), [entries, profile]);

  useEffect(() => {
    Promise.all([getProfile(), getDiaryEntries()]).then(([storedProfile, storedEntries]) => {
      setProfile(storedProfile);
      setEntries(storedEntries);
      setIsReady(true);
    });
  }, []);

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
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const createOrUpdateProfile = async (values: ProfileFormValues) => {
    const now = new Date().toISOString();
    const targets = calculateTargets(values);
    const nextProfile: UserProfile = {
      ...values,
      ...targets,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now
    };

    await saveProfile(nextProfile);
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
    await runAnalysis("text", trimmed, () => analyzeText(trimmed));
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

    if (/[?？]/.test(trimmed) && !looksLikeFood(trimmed)) {
      setChatMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: "Для точного КБЖУ напишите продукты и порции. В общем случае держите белок в каждом приёме пищи и не режьте калории слишком резко." }
      ]);
      return;
    }

    await runAnalysis("text", trimmed, () => analyzeText(trimmed));
    setChatMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "assistant", text: "Я оценил КБЖУ. Проверьте карточки ниже и сохраните в дневник, если всё похоже на правду." }
    ]);
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
    await runAnalysis("image", selectedImage.name, () => analyzeImage(base64));
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
      setDraft(result);
      setDraftSource(source);
      setDraftType(type);
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
    if (!draft) return;
    const normalized = normalizeResponse(draft);
    const entry: DiaryEntry = {
      ...normalized,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      inputType: draftType,
      sourceText: draftSource
    };

    await saveDiaryEntry(entry);
    setEntries((current) => [entry, ...current]);
    setDraft(null);
    setSelectedImage(null);
    setImagePreview("");
    setScreen("diary");
    setToast("Добавлено в дневник.");
    vibrate();
  };

  const deleteEntry = async (id: string) => {
    await deleteDiaryEntry(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const resetDiary = async () => {
    await clearDiary();
    setEntries([]);
    setToast("Дневник очищен.");
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
    setToast("Аватар подмигнул: курс на зелёную зону.");
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

  if (!profile) {
    return (
      <main className="app-shell">
        <OnboardingForm onSubmit={createOrUpdateProfile} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      {!isOnline && <div className="offline-banner">Нет подключения. Дневник и профиль доступны, анализ временно отключён.</div>}
      {toast && <div className="toast">{toast}</div>}
      {calorieStreak >= 3 && <div className="streak-banner">Вы уже {calorieStreak} дня держитесь в дневной норме. Хорошая серия.</div>}

      <MainMenuHeader
        profile={profile}
        today={todayTotal}
        onOpenProfile={() => setScreen("profile")}
        onAvatarLongPress={triggerAvatarEasterEgg}
        onInstall={installApp}
        canInstall={Boolean(installPrompt)}
        avatarWink={avatarWink}
      />

      <nav className="main-tabs" aria-label="Разделы">
        <button className={screen === "home" ? "is-active" : ""} onClick={() => setScreen("home")} type="button">Меню</button>
        <button className={screen === "chat" ? "is-active" : ""} onClick={() => setScreen("chat")} type="button">ИИ</button>
        <button className={screen === "diary" ? "is-active" : ""} onClick={() => setScreen("diary")} type="button">Дневник</button>
        <button className={screen === "profile" ? "is-active" : ""} onClick={() => setScreen("profile")} type="button">Профиль</button>
      </nav>

      {screen === "home" && (
        <section className="screen">
          <AnimatedProgressRing value={todayTotal.calories} target={profile.dailyCalories} />
          <div className="menu-grid">
            <MenuCard icon={<UserRound size={24} />} title="Профиль" text="Данные, цель и пересчёт нормы" onClick={() => setScreen("profile")} />
            <MenuCard icon={<Bot size={24} />} title="ИИ-чат" text="Текст, голос и быстрый подсчёт еды" onClick={() => setScreen("chat")} />
            <MenuCard icon={<FileText size={24} />} title="Дневник" text="Записи за сегодня и неделя" onClick={() => setScreen("diary")} />
            <MenuCard icon={<Camera size={24} />} title="AI Calories" text="Калории по фото блюда" onClick={() => setScreen("ai-calories")} />
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
          <ScreenBack title="ИИ-чат" subtitle="Ассистент по питанию" onBack={() => setScreen("home")} />
          <CustomSegmentedControl options={inputOptions} value={inputMode} onChange={setInputMode} />

          <div className="chat-log" aria-live="polite">
            {chatMessages.map((message) => (
              <article className={`chat-message chat-message--${message.role}`} key={message.id}>
                {message.text}
              </article>
            ))}
          </div>

          {inputMode === "text" ? (
            <div className="panel">
              <label className="field-label" htmlFor="foodText">Сообщение</label>
              <textarea id="foodText" value={foodText} onChange={(event) => setFoodText(event.target.value)} placeholder="Например: гречка 200 г и куриная грудка 150 г" />
              <GradientButton onClick={sendChat} disabled={isLoading || !isOnline} loading={isLoading}>
                <Send size={18} />
                Отправить
              </GradientButton>
            </div>
          ) : (
            <div className="panel">
              <WaveformView active={isListening} analyser={analyser} />
              <GradientButton onClick={startVoice} disabled={isLoading || !isOnline || isListening} loading={isListening}>
                <Mic size={18} />
                Записать голос
              </GradientButton>
              {!voiceSupported && <p className="hint">Браузер не поддерживает Web Speech API. Текстовый ввод остаётся доступен.</p>}
            </div>
          )}

          <ErrorBlock error={error} onRetry={sendChat} disabled={isLoading || !isOnline} />
          <DraftResult draft={draft} lowConfidence={lowConfidence} onChange={updateDraftItem} onDelete={deleteDraftItem} onSave={saveDraft} />
        </section>
      )}

      {screen === "ai-calories" && (
        <section className="screen">
          <ScreenBack title="AI Calories" subtitle="Фотоанализ еды" onBack={() => setScreen("home")} />
          <div className="panel file-panel">
            {imagePreview ? (
              <img className="photo-preview" src={imagePreview} alt="Превью блюда" />
            ) : (
              <ImagePlus size={46} />
            )}
            <strong>{selectedImage ? selectedImage.name : "Фото еды"}</strong>
            <p>Снимите блюдо на телефон или выберите файл из галереи. Перед отправкой фото останется только в этом сеансе.</p>
            <label className="file-button">
              <input accept="image/*" capture="environment" type="file" onChange={(event) => event.target.files?.[0] && selectImage(event.target.files[0])} />
              Выбрать фото
            </label>
            <GradientButton onClick={analyzeSelectedImage} disabled={isLoading || !isOnline || !selectedImage} loading={isLoading}>
              <Camera size={18} />
              Анализировать
            </GradientButton>
          </div>

          <ErrorBlock error={error} onRetry={analyzeSelectedImage} disabled={isLoading || !isOnline || !selectedImage} />
          <DraftResult draft={draft} lowConfidence={lowConfidence} onChange={updateDraftItem} onDelete={deleteDraftItem} onSave={saveDraft} showMedicalWarning />
        </section>
      )}

      {screen === "diary" && (
        <section className="screen">
          <ScreenBack title="Дневник питания" subtitle="Сегодня и неделя" onBack={() => setScreen("home")} />
          <div className="summary-grid">
            <SummaryTile label="Сегодня" value={`${Math.round(todayTotal.calories)} ккал`} />
            <SummaryTile label="Неделя" value={`${Math.round(weekTotal.calories)} ккал`} />
            <SummaryTile label="Белки" value={`${Math.round(todayTotal.protein_g)} / ${profile.proteinGoal} г`} />
            <SummaryTile label="Углеводы" value={`${Math.round(todayTotal.carbs_g)} / ${profile.carbsGoal} г`} />
          </div>
          <button className="icon-text-button danger diary-clear" onClick={resetDiary} type="button" disabled={entries.length === 0}>
            <Trash2 size={16} />
            Очистить дневник
          </button>

          {todayEntries.length === 0 ? (
            <div className="empty-state">
              <FileText size={38} />
              <p>Сегодня пока нет записей. Добавьте еду через ИИ-чат или AI Calories.</p>
            </div>
          ) : (
            todayEntries.map((entry) => (
              <article className="diary-entry" key={entry.id}>
                <div className="diary-entry__head">
                  <div>
                    <strong>{Math.round(entry.total.calories)} ккал</strong>
                    <span>{new Date(entry.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <button className="icon-text-button danger" onClick={() => deleteEntry(entry.id)} type="button">
                    <Trash2 size={16} />
                    Удалить
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
          <ScreenBack title="Профиль" subtitle="Цель и нормы" onBack={() => setScreen("home")} />
          <ProfileForm initial={profile} onSubmit={createOrUpdateProfile} />
        </section>
      )}
    </main>
  );
}

function OnboardingForm({ onSubmit }: { onSubmit: (values: ProfileFormValues) => void }) {
  return (
    <section className="screen onboarding">
      <div className="brand-mark">
        <Flame size={26} />
      </div>
      <h1>LarpFatless</h1>
      <p>Сначала создадим профиль. Без него приложение не откроет меню, потому что нормы КБЖУ должны быть личными.</p>
      <ProfileForm initial={defaultForm} onSubmit={onSubmit} submitLabel="Создать профиль" />
    </section>
  );
}

function ProfileForm({ initial, onSubmit, submitLabel = "Сохранить профиль" }: { initial: ProfileFormValues; onSubmit: (values: ProfileFormValues) => void; submitLabel?: string }) {
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

  const update = <Key extends keyof ProfileFormValues>(key: Key, value: ProfileFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return (
    <form className="panel profile-form" onSubmit={(event) => {
      event.preventDefault();
      if (canSubmit) onSubmit(values);
    }}>
      <ProfileField label="Имя" value={values.name} onChange={(value) => update("name", value)} />
      <div className="form-grid">
        <ProfileField label="Возраст" value={String(values.age)} inputMode="numeric" onChange={(value) => update("age", numeric(value))} />
        <ProfileField label="Рост, см" value={String(values.heightCm)} inputMode="decimal" onChange={(value) => update("heightCm", numeric(value))} />
        <ProfileField label="Вес, кг" value={String(values.weightKg)} inputMode="decimal" onChange={(value) => update("weightKg", numeric(value))} />
        <ProfileField label="Темп, кг/нед." value={String(values.weeklyWeightChangeKg)} inputMode="decimal" onChange={(value) => update("weeklyWeightChangeKg", numeric(value))} />
      </div>

      <label className="profile-field">
        <span>Пол</span>
        <select value={values.gender} onChange={(event) => update("gender", event.target.value as Gender)}>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
      </label>

      <label className="profile-field">
        <span>Активность</span>
        <select value={values.activityLevel} onChange={(event) => update("activityLevel", event.target.value as ActivityLevel)}>
          {Object.entries(activityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      <label className="profile-field">
        <span>Цель</span>
        <select value={values.goal} onChange={(event) => update("goal", event.target.value as WeightGoal)}>
          {Object.entries(goalLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>

      <div className="targets-preview">
        <SummaryTile label="Норма" value={`${targets.dailyCalories} ккал`} />
        <SummaryTile label="Белки" value={`${targets.proteinGoal} г`} />
        <SummaryTile label="Жиры" value={`${targets.fatGoal} г`} />
        <SummaryTile label="Углеводы" value={`${targets.carbsGoal} г`} />
      </div>

      <GradientButton disabled={!canSubmit}>
        <Check size={18} />
        {submitLabel}
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
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
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

function ErrorBlock({ error, onRetry, disabled }: { error: string; onRetry: () => void; disabled?: boolean }) {
  if (!error) return null;

  return (
    <div className="error-card">
      <strong>Не получилось</strong>
      <p>{error}</p>
      <button type="button" onClick={onRetry} disabled={disabled}>
        <RotateCcw size={16} />
        Повторить
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
  showMedicalWarning = false
}: {
  draft: AnalyzeResponse | null;
  lowConfidence: boolean;
  onChange: (index: number, item: NutritionItem) => void;
  onDelete: (index: number) => void;
  onSave: () => void;
  showMedicalWarning?: boolean;
}) {
  if (!draft) return null;

  return (
    <section className="result-panel">
      <div className="section-heading">
        <div>
          <p>Результат</p>
          <h2>{Math.round(draft.total.calories)} ккал</h2>
        </div>
        {lowConfidence && <span className="confidence-badge">проверьте значения</span>}
      </div>
      {draft.items.map((item, index) => (
        <FoodItemCard key={`${item.name}-${index}`} item={item} index={index} editable onChange={(nextItem) => onChange(index, nextItem)} onDelete={() => onDelete(index)} />
      ))}
      {showMedicalWarning && (
        <p className="medical-warning">
          <AlertTriangle size={16} />
          Расчёт примерный и не является медицинской рекомендацией
        </p>
      )}
      <GradientButton onClick={onSave}>
        <Save size={18} />
        Сохранить в дневник
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
    name: source || "Еда",
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
    total: calculateTotal(response.items)
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
  if (!(error instanceof Error)) return "Проблема с подключением. Попробуйте позже.";
  if (error.message === "timeout") return "Запрос занял больше 15 секунд. Попробуйте ещё раз.";
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
  return /(г|ккал|яйц|кур|рис|греч|творог|молок|сыр|мяс|рыб|хлеб|салат|суп|карто|кофе|банан|яблок|овсян)/i.test(text);
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
