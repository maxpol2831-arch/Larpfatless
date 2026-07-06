import type { CSSProperties } from "react";

export interface GlassCustomization {
  color?: string;
  transparency?: number;
  blur?: number | string;
  outline?: string;
  outlineWidth?: number | string;
  shadow?: string;
  innerGlow?: string;
  innerGlowBlur?: number | string;
}

function withTransparency(color: string, transparency?: number) {
  if (transparency === undefined) return color;

  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  }

  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  }

  return color;
}

export function getGlassStyles(customization?: GlassCustomization): CSSProperties {
  if (!customization) return {};

  const styles: CSSProperties = {};

  if (customization.color || customization.transparency !== undefined) {
    styles.backgroundColor = withTransparency(customization.color || "rgba(255, 255, 255, 0.055)", customization.transparency);
  }

  if (customization.blur !== undefined) {
    const blurValue = typeof customization.blur === "number" ? `${customization.blur}px` : customization.blur;
    styles.backdropFilter = `blur(${blurValue})`;
    styles.WebkitBackdropFilter = `blur(${blurValue})`;
  }

  if (customization.outline !== undefined) {
    styles.borderColor = customization.outline;
    styles.borderWidth = typeof customization.outlineWidth === "number" ? `${customization.outlineWidth}px` : customization.outlineWidth || "1px";
    styles.borderStyle = "solid";
  }

  const shadows: string[] = [];
  if (customization.shadow) shadows.push(customization.shadow);
  if (customization.innerGlow) {
    const blurValue =
      typeof customization.innerGlowBlur === "number" ? `${customization.innerGlowBlur}px` : customization.innerGlowBlur || "18px";
    shadows.push(`inset 0 0 ${blurValue} ${customization.innerGlow}`);
  }
  if (shadows.length > 0) styles.boxShadow = shadows.join(", ");

  return styles;
}
