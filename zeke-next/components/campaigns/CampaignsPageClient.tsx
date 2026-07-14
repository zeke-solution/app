"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, closeCampaign } from "@/actions/campaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignSendModal } from "@/components/offers/CampaignSendModal";
import { Button } from "@/components/ui/Button";
import { NICHE_OPTIONS } from "@/lib/domain/constants";

interface CampaignRow {
  id: string;
  title: string;
  niche: string | null;
  budget: number | null;
  deadline: string | null;
  status: string | null;
}

// Port of brand.js's loadBrandCampaigns()/showCreateCampaign()/createCampaign()/deleteCampaign().
export function CampaignsPageClient({ campaigns }: { campaigns: CampaignRow[] }) {
  const [showForm, setShowForm] = useState(false);
  const [sendTarget, setSendTarget] = useState<CampaignRow | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-white">Campaigns</h2>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          + Create Campaign
        </Button>
      </div>

      {showForm && <CreateCampaignForm onDone={() => setShowForm(false)} />}

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">No campaigns yet.</div>
      ) : (
        campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c}>
            {c.status === "active" ? (
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <Button size="sm" className="flex-1" onClick={() => setSendTarget(c)}>
                  &#10148; Send to Creators
                </Button>
                <CloseCampaignButton campaignId={c.id} />
              </div>
            ) : (
              <div className="mt-3 border-t border-border pt-3 text-xs text-muted">Closed</div>
            )}
          </CampaignCard>
        ))
      )}

      {sendTarget && <CampaignSendModal campaign={sendTarget} onClose={() => setSendTarget(null)} />}
    </div>
  );
}

function CloseCampaignButton({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!confirm("Close this campaign?")) return;
    setPending(true);
    await closeCampaign(campaignId);
    setPending(false);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={handleClick}>
      Close
    </Button>
  );
}

function CreateCampaignForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    const res = await createCampaign({ title, niche, budget: Number(budget), deadline, description });
    setPending(false);
    if (!res.ok) return setError(res.error);
    onDone();
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-2xl border border-accent/20 bg-card p-5">
      <div className="mb-4 text-sm font-bold text-white">New Campaign</div>
      <div className="flex flex-col gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eid Collection 2026" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
        <select value={niche} onChange={(e) => setNiche(e.target.value)} className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none">
          <option value="">Select niche</option>
          {NICHE_OPTIONS.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (₹) e.g. 45000" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you looking for..."
          rows={3}
          className="resize-y rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none"
        />
        {error && <div className="rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">{error}</div>}
        <div className="flex gap-2.5">
          <Button className="flex-1" disabled={pending} onClick={handleSubmit}>
            {pending ? "Posting..." : "Post Campaign"}
          </Button>
          <Button variant="outline" onClick={onDone}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
