import type { ReactNode } from "react";
import { fmtNum } from "@/lib/domain/format";

export interface CreatorRow {
  id: string;
  niche: string | null;
  ig_followers: number | null;
  rating: number | null;
  shield_active: boolean | null;
  shield_expires: string | null;
  handle: string | null;
  profiles: { display_name?: string; location?: string } | null;
}

// Port of brand.js's _renderCreatorGrid()/_csRender() card markup. No
// 'use client' directive — safe to render from a Server Component (no
// actions slot) or a Client Component (actions slot with handlers).
export function CreatorCard({ creator, actions }: { creator: CreatorRow; actions?: ReactNode }) {
  const name = creator.profiles?.display_name ?? "Creator";
  const loc = creator.profiles?.location ?? "";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-[11px] font-black text-accent">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="truncate text-sm font-bold text-light">{name}</div>
            {creator.shield_active && <span className="text-xs text-gold">&#128737;</span>}
          </div>
          <div className="truncate text-xs text-muted">{creator.handle ? `@${creator.handle}` : creator.niche || ""}</div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-bold text-light">{fmtNum(creator.ig_followers)}</div>
          <div className="text-xs text-gold">&#9733; {creator.rating || "--"}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted">{[creator.niche, loc].filter(Boolean).join(" · ")}</div>
      {actions}
    </div>
  );
}
