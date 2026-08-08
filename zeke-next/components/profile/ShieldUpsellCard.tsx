"use client";

import Link from "next/link";
import { useState } from "react";
import { requestShield } from "@/actions/shield";
import { Button } from "@/components/ui/Button";
import { SHIELD_MONTHLY_PRICE_INR } from "@/lib/domain/constants";

type Status = "active" | "pending" | "none";

// Port of creator.js's requestShield()/_renderShieldUpsell()/_refreshShieldUpsellState().
export function ShieldUpsellCard({ initialStatus }: { initialStatus: Status }) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);

  async function handleRequest() {
    if (
      !confirm(
        `Request Zeke Shield (₹${SHIELD_MONTHLY_PRICE_INR}/month)? Our team will follow up to confirm payment, then activate your Shield within 24h.`
      )
    )
      return;
    setPending(true);
    const res = await requestShield();
    setPending(false);
    if (res.ok) setStatus("pending");
    else alert(res.error);
  }

  if (status === "active") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/[0.08] p-3.5">
        <div>
          <div className="text-[13px] font-bold text-gold">&#128737; Zeke Shield</div>
          <div className="mt-0.5 text-xs text-muted">Shield is active. Open your support dashboard to manage cases and learn exactly what is covered.</div>
        </div>
        <Link href="/creator/shield">
          <Button variant="gold" size="sm">Open Shield</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-3.5">
      <div>
        <div className="text-[13px] font-bold text-gold">&#128737; Zeke Shield</div>
        <div className="mt-0.5 text-xs text-muted">
          {status === "pending"
            ? "Shield request submitted. Awaiting activation."
            : "Assisted follow-ups, creator-controlled legal access, gold badge and priority discovery"}
        </div>
      </div>
      <Button variant="gold" size="sm" onClick={handleRequest} disabled={pending || status === "pending"}>
        {status === "pending" ? "Pending" : `₹${SHIELD_MONTHLY_PRICE_INR}/month`}
      </Button>
    </div>
  );
}
