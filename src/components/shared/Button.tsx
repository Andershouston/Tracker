import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: "default" | "primary" | "danger" | "success" | "quiet";
  compact?: boolean;
}

export function Button({ children, tone = "default", compact = false, className, ...props }: ButtonProps) {
  return (
    <button {...props} className={`button button--${tone}${compact ? " button--compact" : ""}${className ? ` ${className}` : ""}`}>
      {children}
    </button>
  );
}
