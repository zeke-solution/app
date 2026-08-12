"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionForRole } from "@/lib/auth/roles";
import { createCampaignSchema, type CreateCampaignInput } from "@/lib/validation/campaign.schema";
import type { ActionResult } from "@/actions/auth";

// Port of brand.js's createCampaign().
export async function createCampaign(input: CreateCampaignInput): Promise<ActionResult> {
  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const session = await getSessionForRole("brand");
  if (!session) return { ok: false, error: "Brand account required." };
  const supabase = await createClient();

  const { error } = await supabase.from("campaigns").insert({
    brand_id: session.id,
    title: v.title,
    niche: v.niche,
    platform: v.platform,
    objective: v.objective,
    deliverables: v.deliverables,
    creator_requirements: v.creatorRequirements || null,
    budget: v.budget,
    deadline: v.deadline,
    description: v.description || null,
    usage_rights: v.usageRights,
    exclusivity: v.exclusivity,
    payment_terms: v.paymentTerms,
    status: "active",
  });
  if (error) return { ok: false, error: "Could not create campaign." };

  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/overview");
  return { ok: true };
}

// Port of brand.js's deleteCampaign() (closes, doesn't actually delete).
export async function closeCampaign(campaignId: string): Promise<ActionResult> {
  const session = await getSessionForRole("brand");
  if (!session) return { ok: false, error: "Brand account required." };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .update({ status: "closed" })
    .eq("id", campaignId)
    .eq("brand_id", session.id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not close campaign." };
  if (!data) return { ok: false, error: "Campaign was already closed or could not be found." };

  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/overview");
  return { ok: true };
}
