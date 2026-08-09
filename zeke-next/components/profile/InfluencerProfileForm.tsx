"use client";

import { useState } from "react";
import { updateInfluencerProfile } from "@/actions/profile";
import { Button } from "@/components/ui/Button";
import type { InfluencerProfile } from "@/lib/auth/roles";

export function InfluencerProfileForm({ inf }: { inf: InfluencerProfile | null }) {
  const [igHandle, setIgHandle] = useState(inf?.handle ?? "");
  const [igFollowers, setIgFollowers] = useState(String(inf?.ig_followers ?? ""));
  const [ytEnabled, setYtEnabled] = useState(!!inf?.yt_enabled);
  const [ytHandle, setYtHandle] = useState(inf?.yt_handle ?? "");
  const [ytFollowers, setYtFollowers] = useState(String(inf?.yt_followers ?? ""));
  const [xEnabled, setXEnabled] = useState(!!inf?.x_enabled);
  const [xHandle, setXHandle] = useState(inf?.x_handle ?? "");
  const [xFollowers, setXFollowers] = useState(String(inf?.x_followers ?? ""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setPending(true);
    const res = await updateInfluencerProfile({
      igHandle,
      igFollowers: Number(igFollowers),
      ytEnabled,
      ytHandle: ytEnabled ? ytHandle : undefined,
      ytFollowers: ytEnabled ? Number(ytFollowers || 0) : undefined,
      xEnabled,
      xHandle: xEnabled ? xHandle : undefined,
      xFollowers: xEnabled ? Number(xFollowers || 0) : undefined,
    });
    setPending(false);
    if (!res.ok) setError(res.error);
    else setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 text-sm font-bold text-light">Update Platform Stats</div>
      <div className="flex flex-col gap-3.5">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-extrabold text-accent">IG</span>
            <span className="text-[13px] font-bold text-light">Instagram</span>
            <span className="ml-auto text-[10px] font-semibold text-accent">Required</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={igHandle}
              onChange={(e) => setIgHandle(e.target.value)}
              placeholder="@yourhandle"
              className="rounded-xl border border-border bg-dark px-3 py-2 text-[13px] text-light outline-none"
            />
            <input
              type="number"
              min={1}
              value={igFollowers}
              onChange={(e) => setIgFollowers(e.target.value)}
              placeholder="Followers"
              className="rounded-xl border border-border bg-dark px-3 py-2 text-[13px] text-light outline-none"
            />
          </div>
        </div>

        <PlatformEditRow
          label="YouTube"
          chip="YT"
          chipClass="bg-[#b91c1c]/10 text-[#b91c1c]"
          enabled={ytEnabled}
          onToggle={setYtEnabled}
          handle={ytHandle}
          onHandle={setYtHandle}
          handlePlaceholder="Channel name"
          followers={ytFollowers}
          onFollowers={setYtFollowers}
          followersPlaceholder="Subscribers"
        />
        <PlatformEditRow
          label="Twitter / X"
          chip="X"
          chipClass="bg-[#0369a1]/10 text-[#0369a1]"
          enabled={xEnabled}
          onToggle={setXEnabled}
          handle={xHandle}
          onHandle={setXHandle}
          handlePlaceholder="@xhandle"
          followers={xFollowers}
          onFollowers={setXFollowers}
          followersPlaceholder="Followers"
        />
      </div>

      {error && (
        <div className="mt-3 rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-[10px] border border-zgreen/25 bg-zgreen/[0.06] px-3.5 py-2 text-xs text-zgreen">
          &#10003; Saved.
        </div>
      )}
      <Button type="submit" disabled={pending} fullWidth className="mt-4">
        {pending ? "Please wait..." : "Save Changes"}
      </Button>
    </form>
  );
}

function PlatformEditRow({
  label,
  chip,
  chipClass,
  enabled,
  onToggle,
  handle,
  onHandle,
  handlePlaceholder,
  followers,
  onFollowers,
  followersPlaceholder,
}: {
  label: string;
  chip: string;
  chipClass: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  handle: string;
  onHandle: (v: string) => void;
  handlePlaceholder: string;
  followers: string;
  onFollowers: (v: string) => void;
  followersPlaceholder: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${chipClass}`}>{chip}</span>
        <span className="text-[13px] font-bold text-light">{label}</span>
        <label className="ml-auto flex cursor-pointer items-center gap-1.5">
          <span className="text-[11px] text-muted">Enable</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
        </label>
      </div>
      {enabled && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={handle}
            onChange={(e) => onHandle(e.target.value)}
            placeholder={handlePlaceholder}
            className="rounded-xl border border-border bg-dark px-3 py-2 text-[13px] text-light outline-none"
          />
          <input
            type="number"
            min={0}
            value={followers}
            onChange={(e) => onFollowers(e.target.value)}
            placeholder={followersPlaceholder}
            className="rounded-xl border border-border bg-dark px-3 py-2 text-[13px] text-light outline-none"
          />
        </div>
      )}
    </div>
  );
}
