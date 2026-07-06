import { useRef } from "react";
import { Download, Settings, UserRound } from "lucide-react";
import { getAccountAvatar } from "../lib/accountAvatars";
import type { NutritionTotal, UserProfile } from "../types/nutrition";

interface MainMenuHeaderProps {
  profile: UserProfile;
  accountId?: string;
  today: NutritionTotal;
  title: string;
  dailyLabel: string;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onAvatarLongPress?: () => void;
  onInstall?: () => void;
  canInstall: boolean;
  avatarWink?: boolean;
}

export function MainMenuHeader({ profile, accountId, today, title, dailyLabel, onOpenProfile, onOpenSettings, onAvatarLongPress, onInstall, canInstall, avatarWink = false }: MainMenuHeaderProps) {
  const timerRef = useRef<number | undefined>(undefined);
  const longPressTriggeredRef = useRef(false);
  const accountAvatar = getAccountAvatar(accountId || profile.name);

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
        <img src={accountAvatar.imageUrl} alt="" onError={(event) => (event.currentTarget.style.display = "none")} />
        <span>{profile.name.slice(0, 2).toUpperCase()}</span>
      </button>
      <div className="main-header__copy">
        <p>{title}</p>
        <strong>{Math.round(today.calories)} / {profile.dailyCalories} {dailyLabel}</strong>
      </div>
      <div className="header-actions">
        <button className="header-icon-button" type="button" onClick={onOpenProfile} aria-label="Открыть профиль">
          <UserRound size={20} />
        </button>
        <button className="header-icon-button" type="button" onClick={onOpenSettings} aria-label="Настройки">
          <Settings size={20} />
        </button>
        {canInstall && (
          <button className="header-icon-button" type="button" onClick={onInstall} aria-label="Установить приложение">
            <Download size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
