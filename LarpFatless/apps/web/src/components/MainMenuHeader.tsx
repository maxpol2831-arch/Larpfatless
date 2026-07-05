import { useRef } from "react";
import { Download, Settings } from "lucide-react";
import type { NutritionTotal, UserProfile } from "../types/nutrition";

const avatarUrl = new URL("../assets/avatar.svg", import.meta.url).href;

interface MainMenuHeaderProps {
  profile: UserProfile;
  today: NutritionTotal;
  onOpenProfile: () => void;
  onAvatarLongPress?: () => void;
  onInstall?: () => void;
  canInstall: boolean;
  avatarWink?: boolean;
}

export function MainMenuHeader({ profile, today, onOpenProfile, onAvatarLongPress, onInstall, canInstall, avatarWink = false }: MainMenuHeaderProps) {
  const timerRef = useRef<number | undefined>(undefined);
  const longPressTriggeredRef = useRef(false);
  const greeting = new Date().getHours() >= 0 && new Date().getHours() < 5 ? "Ночной дожор?" : `Привет, ${profile.name}`;

  const startLongPress = () => {
    longPressTriggeredRef.current = false;
    timerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      onAvatarLongPress?.();
      navigator.vibrate?.(24);
    }, 1100);
  };

  const clearLongPress = () => {
    window.clearTimeout(timerRef.current);
  };

  const clickAvatar = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onOpenProfile();
  };

  return (
    <header className="main-header">
      <button
        className={`avatar-button ${avatarWink ? "is-winking" : ""}`}
        type="button"
        onClick={clickAvatar}
        onPointerDown={startLongPress}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        aria-label="Открыть профиль"
      >
        <img src={avatarUrl} alt="" onError={(event) => (event.currentTarget.style.display = "none")} />
        <span>{profile.name.slice(0, 2).toUpperCase()}</span>
      </button>
      <div className="main-header__copy">
        <p>{greeting}</p>
        <strong>{Math.round(today.calories)} / {profile.dailyCalories} ккал сегодня</strong>
      </div>
      {canInstall ? (
        <button className="header-icon-button" type="button" onClick={onInstall} aria-label="Установить приложение">
          <Download size={20} />
        </button>
      ) : (
        <button className="header-icon-button" type="button" onClick={onOpenProfile} aria-label="Настройки">
          <Settings size={20} />
        </button>
      )}
    </header>
  );
}
