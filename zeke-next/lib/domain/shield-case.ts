import type { Database } from "@/lib/supabase/types";

export type ShieldCaseRow = Database["public"]["Tables"]["shield_cases"]["Row"];
export type ShieldCaseStatus = ShieldCaseRow["status"];
export type LegalProviderRow = Database["public"]["Tables"]["legal_providers"]["Row"];
export type ShieldCaseUpdateRow = Database["public"]["Tables"]["shield_case_updates"]["Row"];

export const SHIELD_CASE_STATUS: Record<
  ShieldCaseStatus,
  { label: string; description: string; color: string }
> = {
  intake: {
    label: "Choice needed",
    description: "Review the case and choose assisted follow-up or independent legal help.",
    color: "#92400E",
  },
  assisted_follow_up: {
    label: "Assisted follow-up",
    description: "Zeke is handling structured payment follow-ups with the brand.",
    color: "#7C3AED",
  },
  settlement_talks: {
    label: "Settlement talks",
    description: "Table talks are continuing while you remain in control of escalation.",
    color: "#2563EB",
  },
  lawyer_selection: {
    label: "Choose legal help",
    description: "Select and contact an independent legal provider directly.",
    color: "#92400E",
  },
  legal_coordination: {
    label: "Legal coordination",
    description: "You hired the provider directly; Zeke is coordinating authorised records and communication.",
    color: "#BE123C",
  },
  resolved: {
    label: "Resolved",
    description: "The case reached a recorded resolution.",
    color: "#047857",
  },
  closed: {
    label: "Closed",
    description: "The Shield case is closed with its history preserved.",
    color: "#64748B",
  },
};

export const LEGAL_PROVIDER_SCALE: Record<LegalProviderRow["firm_scale"], string> = {
  independent: "Independent advocate",
  boutique: "Boutique firm",
  mid_size: "Mid-size firm",
  full_service: "Full-service firm",
};

export function shieldCaseLabel(status: ShieldCaseStatus) {
  return SHIELD_CASE_STATUS[status].label;
}
