import type { ButtonHTMLAttributes, ReactNode } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
}

export function GradientButton({ children, loading = false, className = "", ...props }: GradientButtonProps) {
  return (
    <button className={`gradient-button ${loading ? "is-loading" : ""} ${className}`} {...props}>
      <span>{children}</span>
    </button>
  );
}
