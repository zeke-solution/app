"use client";

import { useState, useTransition } from "react";
import { searchCreators } from "@/actions/creators";
import { CreatorGrid } from "@/components/creators/CreatorGrid";
import { OfferModal } from "@/components/offers/OfferModal";
import { Button } from "@/components/ui/Button";
import { NICHE_OPTIONS } from "@/lib/domain/constants";
import type { CreatorRow } from "@/components/creators/CreatorCard";

// Port of brand.js's loadAllCreators()/filterCreators() — moved server-side
// filtering (searchCreators Server Action) instead of fetch-everything-then-
// filter-in-JS, since this is the page most likely to need pagination later.
export function DiscoverClient({ initialCreators }: { initialCreators: CreatorRow[] }) {
  const [creators, setCreators] = useState(initialCreators);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [shieldOnly, setShieldOnly] = useState(false);
  const [offerTarget, setOfferTarget] = useState<{ id: string; name: string } | null>(null);
  const [, startTransition] = useTransition();

  function refetch(next: { query?: string; niche?: string; shieldOnly?: boolean }) {
    const merged = { query, niche, shieldOnly, ...next };
    startTransition(async () => {
      const rows = await searchCreators(merged);
      setCreators(rows);
    });
  }

  return (
    <div>
      <h2 className="mb-3 text-xl font-black text-white">Discover Creators</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            refetch({ query: e.target.value });
          }}
          placeholder="Search by name or niche..."
          className="min-w-48 flex-1 rounded-xl border border-border bg-navy px-4 py-2.5 text-sm text-light outline-none"
        />
        <select
          value={niche}
          onChange={(e) => {
            setNiche(e.target.value);
            refetch({ niche: e.target.value });
          }}
          className="rounded-xl border border-border bg-navy px-3.5 py-2.5 text-[13px] text-light outline-none"
        >
          <option value="">All Niches</option>
          {NICHE_OPTIONS.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <select
          value={shieldOnly ? "shield" : ""}
          onChange={(e) => {
            const v = e.target.value === "shield";
            setShieldOnly(v);
            refetch({ shieldOnly: v });
          }}
          className="rounded-xl border border-border bg-navy px-3.5 py-2.5 text-[13px] text-light outline-none"
        >
          <option value="">All Creators</option>
          <option value="shield">Shield Only</option>
        </select>
      </div>

      <CreatorGrid
        creators={creators}
        renderActions={(c) => (
          <div className="mt-3 flex gap-2 border-t border-border pt-3">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setOfferTarget({ id: c.id, name: c.profiles?.display_name ?? "Creator" })}
            >
              Send Offer
            </Button>
          </div>
        )}
      />

      {offerTarget && (
        <OfferModal influencerId={offerTarget.id} creatorName={offerTarget.name} onClose={() => setOfferTarget(null)} />
      )}
    </div>
  );
}
