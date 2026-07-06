import type { CSSProperties, ReactNode } from "react";

interface AuroraTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

const monochromeAurora = ["#ffffff", "#d7d7d7", "#8f8f8f", "#ffffff"];

export function AuroraText({ children, className = "", colors = monochromeAurora, speed = 1 }: AuroraTextProps) {
  const safeSpeed = Math.max(0.2, speed);

  return (
    <span
      className={`aurora-text ${className}`.trim()}
      style={
        {
          "--aurora-color-1": colors[0] || monochromeAurora[0],
          "--aurora-color-2": colors[1] || monochromeAurora[1],
          "--aurora-color-3": colors[2] || monochromeAurora[2],
          "--aurora-color-4": colors[3] || monochromeAurora[3],
          "--aurora-speed": `${8 / safeSpeed}s`
        } as CSSProperties
      }
    >
      {children}
    </span>
  );
}
