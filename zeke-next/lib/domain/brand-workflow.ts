import type { DealStatus } from "@/lib/domain/deal-status";

export interface BrandWorkflowDeal {
  id: string;
  status: DealStatus;
  cancel_requested_by: string | null;
}

export function brandDealNeedsAttention(deal: BrandWorkflowDeal, brandId: string) {
  return (
    deal.status === "negotiating" ||
    deal.status === "submitted" ||
    deal.status === "link_submitted" ||
    deal.status === "disputed" ||
    Boolean(deal.cancel_requested_by && deal.cancel_requested_by !== brandId)
  );
}

export function brandDealNextStep(deal: BrandWorkflowDeal, brandId: string) {
  if (
    deal.cancel_requested_by &&
    deal.cancel_requested_by !== brandId &&
    !["completed", "cancelled", "disputed"].includes(deal.status)
  ) {
    return {
      label: "Respond to cancellation",
      detail: "The creator is waiting for your decision.",
      href: `/brand/deals/${deal.id}?tab=cancel`,
    };
  }
  if (deal.status === "negotiating") {
    return {
      label: "Continue negotiation",
      detail: "Review messages or update the offer.",
      href: `/brand/chats/${deal.id}`,
    };
  }
  if (deal.status === "submitted") {
    return {
      label: "Review content",
      detail: "Content is ready for approval or changes.",
      href: `/brand/deals/${deal.id}?tab=review`,
    };
  }
  if (deal.status === "link_submitted") {
    return {
      label: "Send payment",
      detail: "The final live link has been submitted.",
      href: `/brand/deals/${deal.id}?tab=payment`,
    };
  }
  if (deal.status === "agreement_sent") {
    return {
      label: "View agreement",
      detail: "Review the accepted campaign record.",
      href: `/brand/deals/${deal.id}?tab=agreement`,
    };
  }
  if (deal.status === "disputed") {
    return {
      label: "Review dispute",
      detail: "This partnership is paused while the dispute is reviewed.",
      href: `/brand/deals/${deal.id}`,
    };
  }
  return {
    label:
      deal.status === "completed" || deal.status === "cancelled"
        ? "View record"
        : "Open partnership",
    detail:
      deal.status === "payment_sent"
        ? "Payment is awaiting creator confirmation."
        : "View the latest campaign activity.",
    href: `/brand/deals/${deal.id}`,
  };
}
