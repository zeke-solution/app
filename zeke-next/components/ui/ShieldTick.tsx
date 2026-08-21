import { isShieldMembershipActive } from "@/lib/domain/shield-membership";

type ShieldTickProps = {
  shieldActive: boolean | null | undefined;
  shieldExpires?: string | null;
  /** `mark` is the inline tick beside a name; `badge` adds the "Shield" wordmark. */
  variant?: "mark" | "badge";
  className?: string;
};

const SIZE = { mark: 16, badge: 14 } as const;

/**
 * The single source of truth for "this creator is a Shield member" in the UI.
 *
 * Membership is read through isShieldMembershipActive() so an expired
 * membership stops showing the mark. Call sites used to test `shield_active`
 * alone, which kept the marker visible after expiry - the same gap migration
 * 0023 closed for dispute classification.
 */
export function ShieldTick({
  shieldActive,
  shieldExpires = null,
  variant = "mark",
  className = "",
}: ShieldTickProps) {
  if (!isShieldMembershipActive({ shield_active: shieldActive ?? false, shield_expires: shieldExpires })) {
    return null;
  }

  const size = SIZE[variant];
  const label = "Zeke Shield member";

  const glyph = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={variant === "mark" ? label : undefined}
      aria-hidden={variant === "badge" ? true : undefined}
      className="flex-shrink-0"
    >
      <title>{label}</title>
      <path
        d="M12 2.2 4.6 5v6.1c0 4.7 3.1 9 7.4 10.7 4.3-1.7 7.4-6 7.4-10.7V5L12 2.2Z"
        fill="var(--color-accent)"
      />
      <path
        d="m8.4 12.1 2.5 2.5 4.7-4.8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "mark") {
    return <span className={`inline-flex items-center ${className}`}>{glyph}</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent ${className}`}
    >
      {glyph}
      Shield
    </span>
  );
}
