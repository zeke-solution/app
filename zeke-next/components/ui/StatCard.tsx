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
    <div className="brand-card flex flex-col gap-2 rounded-2xl border p-4">
      <div style={{ color: iconColor }}>{icon}</div>
      <div className="text-[22px] font-black" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>;
}
