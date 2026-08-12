import type { ReactNode } from "react";

// Port of .stats-grid/.stat-card from css/zeke.css.
export function StatCard({
  icon,
  iconColor,
  value,
  label,
  valueColor = "var(--color-light)",
}: {
  icon: ReactNode;
  iconColor: string;
  value: ReactNode;
  label: string;
  valueColor?: string;
}) {
  return (
    <div className="brand-card min-w-0 rounded-xl border p-4">
      <div className="flex flex-col-reverse items-start justify-between gap-2 sm:flex-row sm:gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark" style={{ color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-2xl font-extrabold tracking-[-0.02em]" style={{ color: valueColor }}>
        {value}
      </div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">{children}</div>;
}
