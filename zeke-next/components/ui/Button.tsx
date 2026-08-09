import { type ButtonHTMLAttributes, forwardRef } from "react";

// Tailwind port of .btn/.btn-{sm,md,lg}/.btn-{primary,outline,ghost,gold}/.btn-full
// from css/zeke.css.
type Variant = "primary" | "outline" | "ghost" | "gold";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-[10px] border text-center font-bold leading-snug tracking-[0.02em] [overflow-wrap:normal] [word-break:normal] transition-all disabled:cursor-not-allowed disabled:opacity-50";

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-1.5 text-xs rounded-lg",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

const variantClasses: Record<Variant, string> = {
  primary: "brand-button-primary text-white",
  outline: "brand-button-outline bg-transparent text-light",
  ghost: "bg-transparent text-muted border-transparent hover:text-light",
  gold: "bg-gold text-white border-gold hover:opacity-90",
};

export interface ButtonStyleOptions {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  className = "",
}: ButtonStyleOptions = {}) {
  return [
    base,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className = "", ...props }, ref) => {
    return (
      <button ref={ref} className={buttonClassName({ variant, size, fullWidth, className })} {...props} />
    );
  }
);
Button.displayName = "Button";
