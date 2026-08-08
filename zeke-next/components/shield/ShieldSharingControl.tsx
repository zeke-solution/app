"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawShieldProviderSharing } from "@/actions/shield-consent";

export function ShieldSharingControl({ caseId, sharingEnabled }: { caseId: string; sharingEnabled: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!sharingEnabled) return null;

  async function withdraw() {
    if (!confirm("Stop all future optional sharing and legal-provider coordination for this case? Previously shared records cannot be recalled.")) return;
    setPending(true);
    setError("");
    const result = await withdrawShieldProviderSharing(caseId);
    setPending(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs leading-5 text-muted">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <strong className="text-light">Provider sharing consent is active.</strong>
          <div className="text-[10px]">Only records you marked may be coordinated. You can stop future sharing at any time.</div>
        </div>
        <button onClick={withdraw} disabled={pending} className="rounded-lg border border-accent/25 px-3 py-1.5 text-[10px] font-bold text-accent disabled:opacity-50">
          {pending ? "Stopping..." : "Stop future sharing"}
        </button>
      </div>
      {error && <div className="mt-2 text-[10px] text-accent">{error}</div>}
    </div>
  );
}
