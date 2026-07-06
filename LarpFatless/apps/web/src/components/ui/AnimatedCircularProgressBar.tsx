interface AnimatedCircularProgressBarProps {
  className?: string;
  max?: number;
  min?: number;
  value?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
}

export function AnimatedCircularProgressBar({
  className = "",
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = "rgba(255, 255, 255, 0.96)",
  gaugeSecondaryColor = "rgba(255, 255, 255, 0.12)"
}: AnimatedCircularProgressBarProps) {
  const size = 196;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const boundedValue = Math.min(Math.max(value, min), max);
  const progress = (boundedValue - min) / Math.max(max - min, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className={`animated-circular-progress ${className}`} style={{ "--progress-size": `${size}px` } as CSSProperties}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(value)} из ${Math.round(max)} ккал`}>
        <circle
          className="animated-circular-progress__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={gaugeSecondaryColor}
        />
        <circle
          className="animated-circular-progress__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke={gaugePrimaryColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="animated-circular-progress__content">
        <strong>{Math.round(value)}</strong>
        <span>из {Math.round(max)} ккал</span>
      </div>
    </div>
  );
}
import type { CSSProperties } from "react";
