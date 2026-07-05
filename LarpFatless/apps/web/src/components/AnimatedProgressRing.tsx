interface AnimatedProgressRingProps {
  value: number;
  target: number;
}

export function AnimatedProgressRing({ value, target }: AnimatedProgressRingProps) {
  const size = 156;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / Math.max(target, 1), 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="progress-ring" aria-label={`Съедено ${value} из ${target} килокалорий`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="progress-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring__content">
        <strong>{Math.round(value)}</strong>
        <span>из {target} ккал</span>
      </div>
    </div>
  );
}
