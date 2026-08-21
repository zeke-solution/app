"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryAdminRemovalJob } from "@/actions/admin-removal";

export function RemovalRetryButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function retry() {
    setPending(true);
    setMessage("");
    const result = await retryAdminRemovalJob(jobId);
    setPending(false);
    setMessage(result.ok ? result.message : result.error);
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={retry}
        disabled={pending}
        className="min-h-9 rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-white disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Retrying..." : "Retry cleanup"}
      </button>
      {message && (
        <p className="max-w-64 text-right text-[10px] leading-4 text-muted" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
