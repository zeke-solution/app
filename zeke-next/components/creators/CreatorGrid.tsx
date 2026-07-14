import type { ReactNode } from "react";
import { CreatorCard, type CreatorRow } from "@/components/creators/CreatorCard";

export function CreatorGrid({
  creators,
  renderActions,
}: {
  creators: CreatorRow[];
  renderActions?: (creator: CreatorRow) => ReactNode;
}) {
  if (creators.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">No creators found.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {creators.map((c) => (
        <CreatorCard key={c.id} creator={c} actions={renderActions?.(c)} />
      ))}
    </div>
  );
}
