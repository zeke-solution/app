"use client";

import { useState } from "react";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { EntityDetailModal } from "@/components/admin/EntityDetailModal";
import type { BrandDirectoryRow, CreatorDirectoryRow } from "@/actions/admin";

// Port of admin.js's loadBrandsDirectory()/loadCreatorsDirectory() row markup.
export function UsersDirectoryTable({
  kind,
  brands,
  creators,
}: {
  kind: "brands" | "creators";
} & ({ brands: BrandDirectoryRow[]; creators?: never } | { creators: CreatorDirectoryRow[]; brands?: never })) {
  const [target, setTarget] = useState<{ type: "brand" | "creator"; id: string } | null>(null);

  if (kind === "brands") {
    const rows = brands ?? [];
    if (!rows.length) return <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">No brands yet.</div>;
    return (
      <div>
        <div className="mb-2 hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_5rem_7rem] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:grid">
          <div>Brand</div>
          <div>Profile</div>
          <div>Deals</div>
          <div>Spent</div>
        </div>
        {rows.map((b) => (
          <button
            key={b.id}
            onClick={() => setTarget({ type: "brand", id: b.id })}
            className="mb-2 flex w-full flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/35 hover:bg-navy sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_5rem_7rem] sm:gap-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-lg bg-purple/15 text-xs font-bold text-purple">
                {b.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-light">{b.name}</div>
                <div className="truncate text-sm text-muted sm:hidden" suppressHydrationWarning>
                  {b.type.replace(/^./, (c) => c.toUpperCase())} {b.location ? `· ${b.location}` : ""}
                </div>
              </div>
            </div>
            <div className="hidden min-w-0 text-sm text-muted sm:block" suppressHydrationWarning>
              <div>{b.type.replace(/^./, (c) => c.toUpperCase())} {b.location ? `· ${b.location}` : ""}</div>
              <div>Joined {fmtDate(b.joined)}</div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:contents">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Deals</div>
                <div className="text-sm font-semibold text-light">{b.dealsTotal}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Spent</div>
                <div className="text-sm font-semibold text-zgreen">₹{fmtNum(b.spent)}</div>
              </div>
            </div>
          </button>
        ))}
        {target && <EntityDetailModal target={target} onClose={() => setTarget(null)} />}
      </div>
    );
  }

  const rows = creators ?? [];
  if (!rows.length) return <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">No creators yet.</div>;
  return (
    <div>
      <div className="mb-2 hidden grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_5rem_7rem_7rem] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:grid">
        <div>Creator</div>
        <div>Profile</div>
        <div>Deals</div>
        <div>Earned</div>
        <div>Plan</div>
      </div>
      {rows.map((c) => (
        <button
          key={c.id}
          onClick={() => setTarget({ type: "creator", id: c.id })}
          className="mb-2 flex w-full flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/35 hover:bg-navy sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_5rem_7rem_7rem] sm:gap-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-light">{c.name}</div>
              <div className="truncate text-sm text-muted sm:hidden">
                {c.niche} {c.handle ? `· @${c.handle}` : ""}
              </div>
            </div>
          </div>
          <div className="hidden min-w-0 text-sm text-muted sm:block" suppressHydrationWarning>
            <div className="truncate">{c.niche} {c.handle ? `· @${c.handle}` : ""}</div>
            <div>IG {fmtNum(c.igFollowers)} · Joined {fmtDate(c.joined)}</div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 border-t border-border/60 pt-3 sm:contents">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Deals</div>
              <div className="text-sm font-semibold text-light">{c.dealsCompleted}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Earned</div>
              <div className="text-sm font-semibold text-zgreen">₹{fmtNum(c.earned)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only">Plan</div>
              <Badge variant={c.shieldActive ? "gold" : "muted"}>{c.shieldActive ? "🛡 Shield" : "Free"}</Badge>
            </div>
          </div>
        </button>
      ))}
      {target && <EntityDetailModal target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
