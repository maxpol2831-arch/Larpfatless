import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { getGlassStyles, type GlassCustomization } from "./glass-utils";

export type GlassButtonEffect = "none" | "glow" | "shimmer" | "ripple" | "lift" | "scale";
export type GlassButtonVariant = "glass" | "solid" | "ghost";
export type GlassButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  effect?: GlassButtonEffect;
  glass?: GlassCustomization;
  size?: GlassButtonSize;
  variant?: GlassButtonVariant;
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, effect = "glow", glass, size = "default", style, variant = "glass", ...props }, ref) => (
    <button
      ref={ref}
      className={classNames(
        "glass-ui-button",
        `glass-ui-button--${variant}`,
        `glass-ui-button--${size}`,
        effect !== "none" && `glass-ui-button--${effect}`,
        className
      )}
      style={{
        ...getGlassStyles(glass),
        ...style
      }}
      {...props}
    />
  )
);

Button.displayName = "Button";
