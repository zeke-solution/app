"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptOffer, declineOffer } from "@/actions/offers";
import { Button } from "@/components/ui/Button";

export function OfferActions({
  dealId,
  seenUpdatedAt,
}: {
  dealId: string;
  seenUpdatedAt: string;
}) {
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const router = useRouter();

  async function handleAccept() {
    if (!confirm("Accept this offer? Terms will be locked once accepted.")) return;
    setPending("accept");
    const res = await acceptOffer({ dealId, seenUpdatedAt });
    setPending(null);
    if (!res.ok) alert(res.error);
    else router.push(`/creator/deals/${dealId}`);
  }

  async function handleDecline() {
    if (!confirm("Decline this offer?")) return;
    setPending("decline");
    const res = await declineOffer({ dealId, seenUpdatedAt });
    setPending(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2 border-t border-border pt-3">
      <Button
        size="sm"
        variant="primary"
        className="flex-1 !border-zgreen !bg-zgreen !bg-none"
        onClick={handleAccept}
        disabled={pending !== null}
      >
        &#10003; Accept
      </Button>
      <Button
        size="sm"
        variant="primary"
        onClick={() => router.push(`/creator/chats/${dealId}`)}
        disabled={pending !== null}
      >
        Negotiate
      </Button>
      <Button size="sm" variant="outline" onClick={handleDecline} disabled={pending !== null}>
        Decline
      </Button>
    </div>
  );
}
