"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCreatorChatClosed } from "@/actions/chat";

export function CreatorChatControl({ dealId, initiallyClosed }: { dealId: string; initiallyClosed: boolean }) {
  const [closed, setClosed] = useState(initiallyClosed);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function toggle() {
    setPending(true);
    setError("");
    const next = !closed;
    const result = await setCreatorChatClosed(dealId, next);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setClosed(next);
    router.refresh();
  }

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div>
        <div className="text-xs font-bold text-light">Completed-deal chat</div>
        <div className="mt-0.5 text-[11px] text-muted">
          {closed ? "The brand cannot send new messages." : "The brand can still message you."}
        </div>
        {error && <div className="mt-1 text-[11px] font-semibold text-accent">{error}</div>}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-[11px] font-bold text-accent disabled:opacity-50"
      >
        {pending ? "Saving..." : closed ? "Reopen brand chat" : "Close brand chat"}
      </button>
    </div>
  );
}
