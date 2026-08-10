import type { ReactNode } from "react";
import type { BadgeVariant } from "@/lib/domain/deal-status";

// Tailwind port of .badge/.badge-{accent,gold,green,muted} from css/zeke.css.
const variantClasses: Record<BadgeVariant, string> = {
  accent: "bg-accent/15 text-accent",
  gold: "bg-gold/15 text-gold",
  green: "bg-zgreen/15 text-zgreen",
  muted: "bg-muted/15 text-muted",
  danger: "bg-danger/15 text-danger",
};

export function Badge({
  variant = "muted",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
