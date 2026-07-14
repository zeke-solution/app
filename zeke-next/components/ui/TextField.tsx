import { type InputHTMLAttributes, forwardRef } from "react";

// Tailwind port of .input-wrap/.input-label/.input-field from css/zeke.css.
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={id}
          className="text-[11px] font-bold uppercase tracking-wider text-light"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-xl border border-border bg-dark px-4 py-2.5 text-sm text-light outline-none transition-colors focus:border-accent/60 ${className}`}
          {...props}
        />
        {error && <div className="text-xs text-accent">{error}</div>}
      </div>
    );
  }
);
TextField.displayName = "TextField";
