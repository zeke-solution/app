"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendOffer } from "@/actions/offers";
import { Button } from "@/components/ui/Button";

// Port of brand.js's openOfferModal()/submitOffer().
export function OfferModal({
  influencerId,
  creatorName,
  onClose,
}: {
  influencerId: string;
  creatorName: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [amount, setAmount] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setPending(true);
    const res = await sendOffer({ influencerId, title, platform, amount: Number(amount), deliverables });
    setPending(false);
    if (!res.ok) return setError(res.error);
    onClose();
    router.push("/brand/deals");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-base font-bold text-white">Send Offer</div>
        <div className="mb-4 text-xs text-muted">To: {creatorName}</div>
        <div className="flex flex-col gap-2.5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Deal title (e.g. Eid Collection Reel)" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
          <input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Platform (e.g. Instagram Reel)" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Offer amount in ₹" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
          <input value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder="Deliverables (e.g. 1 Reel · 30-day usage)" className="rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none" />
        </div>
        {error && <div className="mt-2 rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">{error}</div>}
        <div className="mt-4 flex gap-2.5">
          <Button className="flex-1" disabled={pending} onClick={handleSubmit}>
            {pending ? "Sending..." : "Send Offer"}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
