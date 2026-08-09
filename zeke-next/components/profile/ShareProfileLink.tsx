"use client";

import { useState } from "react";

export function ShareProfileLink({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://zekesolution.com").replace(/\/$/, "");
  const url = `${siteUrl}/c/${encodeURIComponent(handle)}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-xl border border-border bg-dark p-3">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Public Zeke profile</div>
      <div className="flex items-center gap-2">
        <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-semibold text-accent">
          {url}
        </a>
        <button type="button" onClick={copy} className="rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent">
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
