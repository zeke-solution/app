"use client";

import { useState } from "react";
import { fmtNum } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { EntityDetailModal } from "@/components/admin/EntityDetailModal";
import type { BadgeVariant } from "@/lib/domain/deal-status";

export interface AdminDealRow {
  id: string;
  title: string | null;
  platform: string | null;
  amount: number | null;
  status: string;
  brandName: string;
  creatorName: string;
}

const STATUS_DISPLAY: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "green" },
  completed: { label: "Completed", variant: "muted" },
  negotiating: { label: "Offer", variant: "gold" },
  submitted: { label: "Reviewing", variant: "gold" },
  disputed: { label: "Disputed", variant: "accent" },
  cancelled: { label: "Cancelled", variant: "muted" },
  payment_sent: { label: "Paying", variant: "gold" },
};

// Port of admin.js's _renderDealsTable() (used by both the overview preview
// and the all-deals page) — clicking a row opens the shared EntityDetailModal.
export function DealsTable({ deals }: { deals: AdminDealRow[] }) {
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  if (deals.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">No deals yet.</div>;
  }

  return (
    <div>
      {deals.map((d) => {
        const s = STATUS_DISPLAY[d.status] ?? { label: d.status, variant: "muted" as BadgeVariant };
        return (
          <button
            key={d.id}
            onClick={() => setOpenDealId(d.id)}
            className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/30"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white">{d.creatorName} × {d.brandName}</div>
              <div className="text-xs text-muted">{d.title} {d.platform ? `· ${d.platform}` : ""}</div>
            </div>
            <div className="flex-shrink-0 text-sm font-black text-white">₹{fmtNum(d.amount)}</div>
            <Badge variant={s.variant}>{s.label}</Badge>
          </button>
        );
      })}
      {openDealId && <EntityDetailModal target={{ type: "deal", id: openDealId }} onClose={() => setOpenDealId(null)} />}
    </div>
  );
}
