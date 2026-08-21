import type { ReactNode } from "react";
import Link from "next/link";

// Port of .stats-grid/.stat-card from css/zeke.css.
export function StatCard({
  icon,
  iconColor,
  value,
  label,
  valueColor = "var(--color-light)",
  href,
}: {
  icon: ReactNode;
  iconColor: string;
  value: ReactNode;
  label: string;
  valueColor?: string;
  /** When set the whole card becomes one link to the page behind the number. */
  href?: string;
}) {
  const body = (
    <>
      <div className="flex flex-col-reverse items-start justify-between gap-2 sm:flex-row sm:gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark" style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-[-0.02em]" style={{ color: valueColor }}>
        {value}
      </div>
    </>
  );

  const shell = "brand-card block min-w-0 rounded-xl border p-4";

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Link
      href={href}
      // A stat is a summary of a page, so the whole tile is the target rather
      // than a separate "view" affordance competing with the number.
      className={`${shell} transition-shadow hover:shadow-[0_2px_4px_rgba(43,36,56,0.08),0_10px_24px_rgba(43,36,56,0.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      {body}
    </Link>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{children}</div>;
}
