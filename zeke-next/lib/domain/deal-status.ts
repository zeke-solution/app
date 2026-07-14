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

export type BadgeVariant = "accent" | "gold" | "green" | "muted";

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
    color: "#7B84A3",
    bg: "rgba(123,132,163,.03)",
    border: "rgba(123,132,163,.3)",
    badge: "muted",
    progress: 10,
  },
  agreement_sent: {
    label: "Agreement Sent",
    color: "#D97706",
    bg: "rgba(217,119,6,.03)",
    border: "rgba(217,119,6,.3)",
    badge: "gold",
    progress: 20,
  },
  active: {
    label: "Active",
    color: "#E94560",
    bg: "rgba(233,69,96,.03)",
    border: "rgba(233,69,96,.3)",
    badge: "accent",
    progress: 30,
  },
  submitted: {
    label: "Submitted",
    roleLabel: { brand: "Reviewing" },
    color: "#D97706",
    bg: "rgba(217,119,6,.03)",
    border: "rgba(217,119,6,.3)",
    badge: "gold",
    progress: 55,
  },
  approved: {
    label: "Approved",
    color: "#059669",
    bg: "rgba(5,150,105,.03)",
    border: "rgba(5,150,105,.3)",
    badge: "green",
    progress: 70,
  },
  link_submitted: {
    label: "Link Sent",
    color: "#D97706",
    bg: "rgba(217,119,6,.03)",
    border: "rgba(217,119,6,.3)",
    badge: "gold",
    progress: 80,
  },
  payment_sent: {
    label: "Paying",
    color: "#D97706",
    bg: "rgba(217,119,6,.03)",
    border: "rgba(217,119,6,.3)",
    badge: "gold",
    progress: 90,
  },
  completed: {
    label: "Paid",
    roleLabel: { admin: "Completed" },
    color: "#059669",
    bg: "rgba(5,150,105,.03)",
    border: "rgba(5,150,105,.3)",
    badge: "green",
    progress: 100,
  },
  cancelled: {
    label: "Cancelled",
    color: "#7B84A3",
    bg: "rgba(123,132,163,.03)",
    border: "rgba(123,132,163,.3)",
    badge: "muted",
    progress: 0,
  },
  disputed: {
    label: "Disputed",
    color: "#E94560",
    bg: "rgba(233,69,96,.03)",
    border: "rgba(233,69,96,.3)",
    badge: "accent",
    progress: 30,
  },
};

export function dealStatusLabel(status: DealStatus, viewer: Viewer = "creator"): string {
  const meta = DEAL_STATUS_META[status];
  return meta.roleLabel?.[viewer] ?? meta.label;
}
