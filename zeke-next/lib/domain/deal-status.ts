// Canonical replacement for the three slightly-divergent `_si()`/statusMap
// copies in creator.js, brand.js and admin.js.
//
// Reconciliation notes (plan deviation #6):
// - Colors/badges are now consistent everywhere. The old admin.js table had
//   `active` as green and `completed` as muted, while creator.js/brand.js
//   had `active` as accent(pink) and `completed` as green — that was a real
//   inconsistency (not intentional perspective), fixed here in favor of the
//   creator/brand version since it's used in two places vs admin's one.
// - Labels for "negotiating" and "submitted" genuinely differ by who's
//   looking: a brand sees their own outbound action ("Offer" / "Reviewing"),
//   a creator sees the same deal from the receiving end ("Negotiating" /
//   "Submitted"). That's preserved intentionally via `roleLabel`, not
//   collapsed into one string.

export type DealStatus =
  | "negotiating"
  | "agreement_sent"
  | "active"
  | "submitted"
  | "approved"
  | "link_submitted"
  | "payment_sent"
  | "completed"
  | "cancelled"
  | "disputed";

export type BadgeVariant = "accent" | "gold" | "green" | "muted" | "danger";

export type Viewer = "creator" | "brand" | "admin";

interface StatusMeta {
  label: string;
  roleLabel?: Partial<Record<Viewer, string>>;
  color: string;
  bg: string;
  border: string;
  badge: BadgeVariant;
  /** Progress-bar percentage shown on the deal detail page. */
  progress: number;
}

export const DEAL_STATUS_META: Record<DealStatus, StatusMeta> = {
  negotiating: {
    label: "Negotiating",
    roleLabel: { brand: "Offer" },
    color: "#64748B",
    bg: "rgba(100,116,139,.03)",
    border: "rgba(100,116,139,.3)",
    badge: "muted",
    progress: 10,
  },
  agreement_sent: {
    label: "Agreement Sent",
    color: "#92400E",
    bg: "rgba(146,64,14,.03)",
    border: "rgba(146,64,14,.3)",
    badge: "gold",
    progress: 20,
  },
  active: {
    label: "Active",
    color: "#4338CA",
    bg: "rgba(67,56,202,.03)",
    border: "rgba(67,56,202,.3)",
    badge: "accent",
    progress: 30,
  },
  submitted: {
    label: "Submitted",
    roleLabel: { brand: "Reviewing" },
    color: "#92400E",
    bg: "rgba(146,64,14,.03)",
    border: "rgba(146,64,14,.3)",
    badge: "gold",
    progress: 55,
  },
  approved: {
    label: "Approved",
    color: "#047857",
    bg: "rgba(4,120,87,.03)",
    border: "rgba(4,120,87,.3)",
    badge: "green",
    progress: 70,
  },
  link_submitted: {
    label: "Link Sent",
    color: "#92400E",
    bg: "rgba(146,64,14,.03)",
    border: "rgba(146,64,14,.3)",
    badge: "gold",
    progress: 80,
  },
  payment_sent: {
    label: "Paying",
    color: "#92400E",
    bg: "rgba(146,64,14,.03)",
    border: "rgba(146,64,14,.3)",
    badge: "gold",
    progress: 90,
  },
  completed: {
    label: "Paid",
    roleLabel: { admin: "Completed" },
    color: "#047857",
    bg: "rgba(4,120,87,.03)",
    border: "rgba(4,120,87,.3)",
    badge: "green",
    progress: 100,
  },
  cancelled: {
    label: "Cancelled",
    color: "#64748B",
    bg: "rgba(100,116,139,.03)",
    border: "rgba(100,116,139,.3)",
    badge: "muted",
    progress: 0,
  },
  disputed: {
    label: "Disputed",
    color: "#BE123C",
    bg: "rgba(190,18,60,.03)",
    border: "rgba(190,18,60,.3)",
    badge: "danger",
    progress: 30,
  },
};

export function dealStatusLabel(status: DealStatus, viewer: Viewer = "creator"): string {
  const meta = DEAL_STATUS_META[status];
  return meta.roleLabel?.[viewer] ?? meta.label;
}
