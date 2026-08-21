// Ports of the fmtNum/fmtDate/fmtDateShort helpers duplicated across
// creator.js/brand.js/admin.js - one canonical copy now.

export function fmtNum(n: number | null | undefined): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function fmtDate(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Builds an outbound link to a creator's profile on another network.
 *
 * Handles are stored with an optional leading "@" (the profile schema allows
 * it), so strip it rather than emitting youtube.com/@@name. Returns null when
 * no handle is saved so the caller renders plain text instead of a dead link.
 *
 * `base` is always a trusted literal and the handle charset is restricted by
 * updateInfluencerProfileSchema, so the handle can only ever form a path
 * segment - it cannot alter the host.
 */
export function socialUrl(base: string, handle: string | null | undefined): string | null {
  const clean = (handle ?? "").trim().replace(/^@+/, "");
  return clean ? `${base}${encodeURIComponent(clean)}` : null;
}
