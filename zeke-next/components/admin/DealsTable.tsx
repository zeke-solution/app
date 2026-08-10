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
// and the all-deals page) - clicking a row opens the shared EntityDetailModal.
export function DealsTable({ deals }: { deals: AdminDealRow[] }) {
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  if (deals.length === 0) {
    return <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">No deals yet.</div>;
  }

  return (
    <div>
      <div className="mb-2 hidden grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_7rem_8rem] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:grid">
        <div>Parties</div>
        <div>Campaign</div>
        <div>Fee</div>
        <div>Status</div>
      </div>
      {deals.map((d) => {
        const s = STATUS_DISPLAY[d.status] ?? { label: d.status, variant: "muted" as BadgeVariant };
        return (
          <button
            key={d.id}
            onClick={() => setOpenDealId(d.id)}
            className="mb-2 flex w-full flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/35 hover:bg-navy sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_7rem_8rem] sm:items-center sm:gap-4"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-light">{d.creatorName} × {d.brandName}</div>
              <div className="truncate text-sm text-muted sm:hidden">{d.title} {d.platform ? `· ${d.platform}` : ""}</div>
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm font-medium text-light">{d.title || "Untitled campaign"}</div>
              <div className="text-sm text-muted">{d.platform || "No platform"}</div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:contents">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Fee</div>
                <div className="text-sm font-semibold text-light">₹{fmtNum(d.amount)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Status</div>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
            </div>
          </button>
        );
      })}
      {openDealId && <EntityDetailModal target={{ type: "deal", id: openDealId }} onClose={() => setOpenDealId(null)} />}
    </div>
  );
}
