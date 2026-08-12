"use client";

import { useEffect, useState, useTransition } from "react";
import { searchCreators } from "@/actions/creators";
import { CreatorGrid } from "@/components/creators/CreatorGrid";
import {
  ExistingCampaignOfferModal,
  type DiscoverCampaign,
} from "@/components/offers/ExistingCampaignOfferModal";
import { Button } from "@/components/ui/Button";
import { NICHE_OPTIONS } from "@/lib/domain/constants";
import type { CreatorRow } from "@/components/creators/CreatorCard";
import { PageHeader } from "@/components/layout/PageHeader";

// Port of brand.js's loadAllCreators()/filterCreators() - moved server-side
// filtering (searchCreators Server Action) instead of fetch-everything-then-
// filter-in-JS, since this is the page most likely to need pagination later.
export function DiscoverClient({
  initialCreators,
  campaigns,
}: {
  initialCreators: CreatorRow[];
  campaigns: DiscoverCampaign[];
}) {
  const [creators, setCreators] = useState(initialCreators);
  const [query, setQuery] = useState("");
  const [niche, setNiche] = useState("");
  const [shieldOnly, setShieldOnly] = useState(false);
  const [offerTarget, setOfferTarget] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const rows = await searchCreators({ query, niche, shieldOnly });
        if (active) setCreators(rows);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [niche, query, shieldOnly]);

  return (
    <div>
      <PageHeader
        title="Discover creators"
        description="Search the creator directory, compare fit, and send an existing campaign brief."
        actions={<span className="rounded-md bg-card px-3 py-1.5 text-sm font-semibold text-muted">{isPending ? "Searching..." : creators.length + " results"}</span>}
      />
      <div className="mb-5 grid gap-2 rounded-xl border border-border bg-card p-3 sm:grid-cols-[minmax(14rem,1fr)_auto_auto]">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Search by name or niche..."
          className="min-w-0 rounded-lg border border-border bg-dark px-3.5 py-2.5 text-sm text-light outline-none focus:border-accent"
        />
        <select
          value={niche}
          onChange={(e) => {
            setNiche(e.target.value);
          }}
          className="rounded-lg border border-border bg-dark px-3.5 py-2.5 text-sm text-light outline-none focus:border-accent"
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
          }}
          className="rounded-lg border border-border bg-dark px-3.5 py-2.5 text-sm text-light outline-none focus:border-accent"
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
              Send campaign
            </Button>
          </div>
        )}
      />

      {offerTarget && (
        <ExistingCampaignOfferModal
          influencerId={offerTarget.id}
          creatorName={offerTarget.name}
          campaigns={campaigns}
          onClose={() => setOfferTarget(null)}
        />
      )}
    </div>
  );
}
