"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "@/actions/disputes";
import { fmtDate } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { EntityDetailModal } from "@/components/admin/EntityDetailModal";
import { AdminRemoveButton } from "@/components/admin/AdminRemoveButton";

export interface DisputeRow {
  id: string;
  dealId: string;
  reason: string;
  status: string;
  resolution: string | null;
  createdAt: string | null;
  resolvedAt: string | null;
  previousDealStatus: string | null;
  brandName: string;
  creatorName: string;
  raiserName: string;
  shieldCaseId: string | null;
  shieldCaseStatus: string | null;
}

export function DisputeCard({ dispute }: { dispute: DisputeRow }) {
  const [pending, setPending] = useState(false);
  const [showDeal, setShowDeal] = useState(false);
  const router = useRouter();

  async function handleResolve() {
    const resolution = prompt("Resolution note:");
    if (!resolution) return;
    setPending(true);
    const res = await resolveDispute(dispute.id, resolution);
    setPending(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="mb-3 rounded-2xl border border-border bg-card p-4">
      <button onClick={() => setShowDeal(true)} className="mb-2.5 flex w-full items-center justify-between gap-3 text-left">
        <div>
          <div className="text-sm font-bold text-light">{dispute.creatorName} x {dispute.brandName}</div>
          <div className="text-xs text-muted">Raised by {dispute.raiserName} - {fmtDate(dispute.createdAt)}</div>
        </div>
        <Badge variant={dispute.status === "resolved" ? "green" : "accent"}>{dispute.status}</Badge>
      </button>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${dispute.shieldCaseId ? "border-purple/30 bg-purple/10 text-purple" : "border-border bg-dark text-muted"}`}>
          {dispute.shieldCaseId ? "Shield protected" : "Standard dispute"}
        </span>
        {dispute.shieldCaseStatus && <span className="text-[11px] font-semibold text-muted">Case: {dispute.shieldCaseStatus.replaceAll("_", " ")}</span>}
      </div>
      <div className="mb-3 text-[13px] leading-relaxed text-light">{dispute.reason}</div>
      {dispute.resolution && (
        <div className="mb-3 rounded-xl bg-zgreen/10 px-3.5 py-3 text-xs leading-5 text-zgreen">
          <span className="font-bold">Resolution:</span> {dispute.resolution}
          {dispute.resolvedAt && <span> · {fmtDate(dispute.resolvedAt)}</span>}
          {dispute.previousDealStatus && <span> · Restored from {dispute.previousDealStatus.replaceAll("_", " ")}</span>}
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {dispute.shieldCaseId && (
          <Link href={`/admin/shield/cases/${dispute.shieldCaseId}`} className="flex-1 rounded-lg border border-purple/30 bg-purple/[0.06] py-2 text-center text-xs font-bold text-purple">Open Shield case</Link>
        )}
        {dispute.status === "open" && <button onClick={handleResolve} disabled={pending} className="flex-1 rounded-lg border border-zgreen/30 bg-zgreen/[0.05] py-2 text-xs font-bold text-zgreen disabled:opacity-50">&#10003; Resolve</button>}
        {dispute.status === "open" && (
          <AdminRemoveButton
          kind="dispute"
          entityId={dispute.id}
          entityLabel={`${dispute.creatorName} × ${dispute.brandName} dispute`}
          description="This permanently removes the dispute and any linked Shield case, then restores the deal to its status from before the dispute."
          />
        )}
      </div>
      {showDeal && <EntityDetailModal target={{ type: "deal", id: dispute.dealId }} onClose={() => setShowDeal(false)} />}
    </div>
  );
}
