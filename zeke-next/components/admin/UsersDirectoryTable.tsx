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
        {rows.map((b) => (
          <button
            key={b.id}
            onClick={() => setTarget({ type: "brand", id: b.id })}
            className="mb-2 flex w-full flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/30"
          >
            <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-xl bg-purple/15 text-[11px] font-black text-purple">
              {b.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-light">{b.name}</div>
              <div className="text-xs text-muted" suppressHydrationWarning>
                {b.type.replace(/^./, (c) => c.toUpperCase())} {b.location ? `· ${b.location}` : ""} · Joined {fmtDate(b.joined)}
              </div>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:ml-auto sm:w-auto sm:min-w-[160px] sm:border-0 sm:pt-0 sm:text-right">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Deals</div>
                <div className="text-[13px] font-bold text-light">{b.dealsTotal}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Spent</div>
                <div className="text-[12px] font-bold text-zgreen">₹{fmtNum(b.spent)}</div>
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
      {rows.map((c) => (
        <button
          key={c.id}
          onClick={() => setTarget({ type: "creator", id: c.id })}
          className="mb-2 flex w-full flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-accent/30"
        >
          <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-[11px] font-black text-accent">
            {c.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-light">{c.name}</div>
            <div className="text-xs text-muted">
              {c.niche} {c.handle ? `· @${c.handle}` : ""} {c.location ? `· ${c.location}` : ""}
            </div>
            <div className="text-[11px] text-muted" suppressHydrationWarning>
              IG {fmtNum(c.igFollowers)} · Joined {fmtDate(c.joined)}
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 border-t border-border/60 pt-3 sm:ml-auto sm:w-auto sm:min-w-[230px] sm:border-0 sm:pt-0 sm:text-right">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Deals</div>
              <div className="text-[13px] font-bold text-light">{c.dealsCompleted}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Earned</div>
              <div className="text-[12px] font-bold text-zgreen">₹{fmtNum(c.earned)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Plan</div>
              <Badge variant={c.shieldActive ? "gold" : "muted"}>{c.shieldActive ? "🛡 Shield" : "Free"}</Badge>
            </div>
          </div>
        </button>
      ))}
      {target && <EntityDetailModal target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
