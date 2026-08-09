"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { searchCreators } from "@/actions/creators";
import { sendCampaignOffers } from "@/actions/offers";
import { Button } from "@/components/ui/Button";
import { NICHE_OPTIONS } from "@/lib/domain/constants";
import { fmtNum } from "@/lib/domain/format";
import type { CreatorRow } from "@/components/creators/CreatorCard";

interface CampaignLite {
  id: string;
  title: string;
  niche: string | null;
  budget: number | null;
}

// Port of brand.js's openCampaignSendModal()/submitCampaignOffers() (bulk
// send to multiple creators).
export function CampaignSendModal({ campaign, onClose }: { campaign: CampaignLite; onClose: () => void }) {
  const [platform, setPlatform] = useState("");
  const [niche, setNiche] = useState(campaign.niche ?? "");
  const [query, setQuery] = useState("");
  const [shieldOnly, setShieldOnly] = useState(false);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    searchCreators({ query, niche, shieldOnly }).then(setCreators);
  }, [query, niche, shieldOnly]);

  const selectedCount = Object.keys(selected).filter((k) => selected[k]).length;

  async function handleSend() {
    const influencerIds = Object.keys(selected).filter((k) => selected[k]);
    if (!influencerIds.length) return setError("Pick at least one creator.");
    if (!platform.trim()) return setError("Enter the platform (e.g. Instagram Reel).");
    setError("");
    setPending(true);
    const res = await sendCampaignOffers({ campaignId: campaign.id, influencerIds, platform });
    setPending(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.push("/brand/deals");
  }

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-stretch justify-center bg-black/65 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex h-full min-h-0 w-full flex-col gap-3.5 overflow-y-auto rounded-none border-0 bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-[520px] sm:rounded-2xl sm:border sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold text-light">Send &quot;{campaign.title}&quot;</div>
            <div className="text-xs text-muted">Pick creators to send this campaign as an offer.</div>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-muted">&times;</button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Platform (e.g. Instagram Reel)"
            className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none"
          />
          <select value={niche} onChange={(e) => setNiche(e.target.value)} className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none">
            <option value="">All niches</option>
            {NICHE_OPTIONS.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators..."
            className="flex-1 rounded-xl border border-border bg-dark px-3 py-2 text-[13px] text-light outline-none"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={shieldOnly} onChange={(e) => setShieldOnly(e.target.checked)} /> Shield only
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-dark sm:max-h-[42vh]">
          {creators.length === 0 ? (
            <div className="p-5 text-center text-sm text-muted">No creators match.</div>
          ) : (
            creators.map((c) => {
              const name = c.profiles?.display_name ?? "Creator";
              return (
                <label key={c.id} className="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5">
                  <input
                    type="checkbox"
                    checked={!!selected[c.id]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [c.id]: e.target.checked }))}
                    className="h-4 w-4 accent-accent"
                  />
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold text-light">
                      {name} {c.shield_active ? "🛡" : ""}
                    </div>
                    <div className="text-[11px] text-muted">{[c.niche, c.profiles?.location].filter(Boolean).join(" · ")}</div>
                  </div>
                  <div className="flex-shrink-0 text-xs text-muted">{fmtNum(c.ig_followers)}</div>
                </label>
              );
            })
          )}
        </div>

        {error && <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">{error}</div>}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 text-xs text-muted">
            {selectedCount} selected · ₹{fmtNum(campaign.budget)} each · ₹{fmtNum((campaign.budget ?? 0) * selectedCount)} total
          </div>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={pending} onClick={handleSend}>{pending ? "Sending..." : "Send Offers"}</Button>
        </div>
      </div>
    </div>
  );
}
