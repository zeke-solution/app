import type { HTMLAttributes } from "react";

// Tailwind port of .card/.card-md/.card-lg from css/zeke.css.
const paddingClasses = { md: "p-5", lg: "p-7" } as const;

export function Card({
  padding = "md",
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: "md" | "lg" }) {
  return (
    <div
      className={`brand-card rounded-2xl border ${paddingClasses[padding]} ${className}`}
      {...props}
    />
  );
}
