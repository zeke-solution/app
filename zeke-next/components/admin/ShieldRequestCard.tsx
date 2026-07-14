"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { activateShield, rejectShield } from "@/actions/shield";
import { fmtDate } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { EntityDetailModal } from "@/components/admin/EntityDetailModal";

export interface ShieldRequestRow {
  id: string;
  influencer_id: string;
  amount: number | null;
  requested_at: string | null;
  creatorName: string;
  location: string;
}

// Port of admin.js's loadShieldRequests()/activateShield()/rejectShield().
export function ShieldRequestCard({ request }: { request: ShieldRequestRow }) {
  const [pending, setPending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  async function handleActivate() {
    if (!confirm("Confirm payment received and activate Shield for this creator?")) return;
    setPending(true);
    const res = await activateShield(request.id);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  async function handleReject() {
    const reason = prompt("Reason (shown to creator):");
    if (!reason) return;
    setPending(true);
    const res = await rejectShield(request.id, reason);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="mb-3 rounded-2xl border border-border bg-card p-4">
      <button onClick={() => setShowProfile(true)} className="mb-3 flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-xl bg-gold/15 text-[11px] font-black text-gold">
            {request.creatorName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{request.creatorName}</div>
            <div className="text-xs text-muted">{request.location} · Requested {fmtDate(request.requested_at)}</div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-black text-gold">₹{request.amount ?? 1999}</div>
          <Badge variant="gold">Pending</Badge>
        </div>
      </button>
      <div className="flex gap-2 border-t border-border pt-3">
        <button onClick={handleActivate} disabled={pending} className="flex-1 rounded-lg border border-zgreen/30 bg-zgreen/[0.05] py-2 text-xs font-bold text-zgreen disabled:opacity-50">
          &#128737; Activate
        </button>
        <button onClick={handleReject} disabled={pending} className="rounded-lg border border-accent/30 bg-accent/[0.05] px-4 py-2 text-xs font-bold text-accent disabled:opacity-50">
          &#10006; Reject
        </button>
      </div>
      {showProfile && (
        <EntityDetailModal target={{ type: "creator", id: request.influencer_id }} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}
