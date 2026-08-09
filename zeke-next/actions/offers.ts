"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";
import { getSessionForRole } from "@/lib/auth/roles";
import { fmtNum } from "@/lib/domain/format";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import {
  sendOfferSchema,
  sendCampaignOffersSchema,
  editOfferSchema,
  type SendOfferInput,
  type SendCampaignOffersInput,
  type EditOfferInput,
} from "@/lib/validation/offer.schema";
import type { ActionResult } from "@/actions/auth";

export async function acceptOffer(dealId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();
  if (dealErr || !deal) return { ok: false, error: "Could not load deal." };
  if (deal.influencer_id !== userRes.user.id) return { ok: false, error: "Not your offer." };
  if (deal.status !== "negotiating") {
    return { ok: false, error: "This offer is no longer available." };
  }

  const { data: inf } = await supabase
    .from("influencer_profiles")
    .select("shield_active,shield_expires")
    .eq("id", userRes.user.id)
    .single();
  const isShield = isShieldMembershipActive(inf);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userRes.user.id)
    .single();
  const displayName = profile?.display_name ?? "Creator";

  const { data: updatedDeal, error: updateErr } = await supabase
    .from("deals")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", dealId)
    .eq("status", "negotiating")
    .select("id")
    .maybeSingle();
  if (updateErr) return { ok: false, error: "Could not accept this offer." };
  if (!updatedDeal) return { ok: false, error: "This offer was already processed." };

  await supabase.from("agreements").upsert(
    { deal_id: dealId, signed_brand: true, signed_creator: true },
    { onConflict: "deal_id", ignoreDuplicates: true }
  );
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: userRes.user.id,
    msg_type: isShield ? "event_gold" : "event",
    content:
      (isShield ? "🛡 " : "✓ ") +
      `Offer accepted by ${displayName} · Deal active` +
      (isShield ? " · Shield agreement generated" : ""),
  });
  if (deal.brand_id) {
    await createNotification(supabase, {
      userId: deal.brand_id,
      title: "Offer accepted",
      body: `${displayName} accepted your offer · ${deal.title}`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidatePath("/creator/offers");
  revalidatePath("/creator/deals");
  revalidatePath("/brand/deals");
  revalidatePath("/brand/chats");
  revalidatePath("/brand/campaigns");
  revalidatePath(`/creator/deals/${dealId}`);
  return { ok: true };
}

// Port of creator.js's declineOffer().
export async function declineOffer(dealId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("brand_id,title,influencer_id,status")
    .eq("id", dealId)
    .single();
  if (dealErr || !deal) return { ok: false, error: "Could not load deal." };
  if (deal.influencer_id !== userRes.user.id) return { ok: false, error: "Not your offer." };
  if (deal.status !== "negotiating") {
    return { ok: false, error: "This offer is no longer available." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userRes.user.id)
    .single();
  const displayName = profile?.display_name ?? "Creator";

  const { data: updatedDeal, error: updateErr } = await supabase
    .from("deals")
    .update({ status: "cancelled" })
    .eq("id", dealId)
    .eq("status", "negotiating")
    .select("id")
    .maybeSingle();
  if (updateErr) return { ok: false, error: "Could not decline this offer." };
  if (!updatedDeal) return { ok: false, error: "This offer was already processed." };

  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: userRes.user.id,
    msg_type: "event",
    content: `✗ Offer declined by ${displayName}`,
  });
  if (deal.brand_id) {
    await createNotification(supabase, {
      userId: deal.brand_id,
      title: "Offer declined",
      body: `${displayName} declined your offer · ${deal.title}`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidatePath("/creator/offers");
  revalidatePath("/creator/chats");
  revalidatePath("/brand/chats");
  revalidatePath("/brand/campaigns");
  return { ok: true };
}

// Port of brand.js's submitOffer().
export async function sendOffer(input: SendOfferInput): Promise<ActionResult> {
  const parsed = sendOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const session = await getSessionForRole("brand");
  if (!session) return { ok: false, error: "Brand account required." };
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", session.id).single();
  const brandName = profile?.display_name ?? "Brand";

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      brand_id: session.id,
      influencer_id: v.influencerId,
      title: v.title,
      amount: v.amount,
      platform: v.platform,
      deliverables: v.deliverables || null,
      status: "negotiating",
    })
    .select("id")
    .single();
  if (error || !deal) return { ok: false, error: error?.message ?? "Could not send offer." };

  await supabase.from("deal_messages").insert({
    deal_id: deal.id,
    sender_id: session.id,
    msg_type: "event",
    content: `📩 Offer sent by ${brandName} · ${v.title} · ₹${fmtNum(v.amount)} · ${v.platform}`,
  });
  await createNotification(supabase, {
    userId: v.influencerId,
    title: `New offer from ${brandName}`,
    body: `${v.title} · ₹${fmtNum(v.amount)}`,
    type: "deal",
    relatedDealId: deal.id,
  });

  revalidatePath("/brand/deals");
  revalidatePath("/brand/chats");
  revalidatePath("/brand/campaigns");
  return { ok: true };
}

// Port of brand.js's submitCampaignOffers() (bulk send).
export async function sendCampaignOffers(input: SendCampaignOffersInput): Promise<ActionResult> {
  const parsed = sendCampaignOffersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const session = await getSessionForRole("brand");
  if (!session) return { ok: false, error: "Brand account required." };
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title,budget,description,deadline,brand_id,status,platform,deliverables,usage_rights,exclusivity,payment_terms")
    .eq("id", v.campaignId)
    .single();
  if (!campaign || campaign.brand_id !== session.id || campaign.status !== "active") {
    return { ok: false, error: "Active campaign not found." };
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", session.id).single();
  const brandName = profile?.display_name ?? "Brand";

  v.platform = v.platform || campaign.platform || undefined;
  if (!v.platform) return { ok: false, error: 'Add a platform to this campaign before sending it.' };

  const rows = v.influencerIds.map((influencerId) => ({
    campaign_id: v.campaignId,
    brand_id: session.id,
    influencer_id: influencerId,
    title: campaign.title,
    platform: v.platform,
    amount: campaign.budget ?? 0,
    deliverables: campaign.deliverables ?? campaign.description ?? null,
    usage_rights: campaign.usage_rights ?? null,
    exclusivity: campaign.exclusivity ?? false,
    payment_terms: campaign.payment_terms ?? null,
    deadline: campaign.deadline ?? null,
    status: "negotiating" as const,
  }));

  const { data: inserted, error } = await supabase.from("deals").insert(rows).select("id,influencer_id");
  if (error) return { ok: false, error: error.message };

  const msgRows = (inserted ?? []).map((d) => ({
    deal_id: d.id,
    sender_id: session.id,
    msg_type: "event" as const,
    content: `📩 Offer sent by ${brandName} · ${campaign.title} · ₹${fmtNum(campaign.budget)} · ${v.platform}`,
  }));
  const notifRows = (inserted ?? []).map((d) => ({
    userId: d.influencer_id!,
    title: `New offer from ${brandName}`,
    body: `${campaign.title} · ₹${fmtNum(campaign.budget)}`,
    type: "deal" as const,
    relatedDealId: d.id,
  }));
  if (msgRows.length) await supabase.from("deal_messages").insert(msgRows);
  if (notifRows.length) {
    await Promise.all(notifRows.map((notification) => createNotification(supabase, notification)));
  }

  revalidatePath("/brand/deals");
  revalidatePath("/brand/chats");
  revalidatePath("/brand/campaigns");
  return { ok: true };
}

// Port of brand.js's saveEditedOffer().
export async function editOffer(input: EditOfferInput): Promise<ActionResult> {
  const parsed = editOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const session = await getSessionForRole("brand");
  if (!session) return { ok: false, error: "Brand account required." };
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,amount,status")
    .eq("id", v.dealId)
    .single();
  if (!deal || deal.brand_id !== session.id) return { ok: false, error: "Not your deal." };
  if (deal.status !== "negotiating") return { ok: false, error: "Offer can only be edited while still negotiating." };

  const { error } = await supabase
    .from("deals")
    .update({
      title: v.title,
      platform: v.platform,
      amount: v.amount,
      deliverables: v.deliverables || null,
      deadline: v.deadline || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", v.dealId);
  if (error) return { ok: false, error: error.message };

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", session.id).single();
  const brandName = profile?.display_name ?? "Brand";
  const changedAmount = Number(deal.amount) !== Number(v.amount);
  const summary = `Offer updated by ${brandName}` + (changedAmount ? ` · ₹${fmtNum(deal.amount)} → ₹${fmtNum(v.amount)}` : "");

  await supabase.from("deal_messages").insert({
    deal_id: v.dealId,
    sender_id: session.id,
    msg_type: "event_gold",
    content: `✎ ${summary}`,
  });
  if (deal.influencer_id) {
    await createNotification(supabase, {
      userId: deal.influencer_id,
      title: "Offer updated",
      body: `${brandName} updated the offer: ${v.title} · ₹${fmtNum(v.amount)}`,
      type: "deal",
      relatedDealId: v.dealId,
    });
  }

  revalidatePath(`/brand/deals/${v.dealId}`);
  revalidatePath("/brand/campaigns");
  return { ok: true };
}
