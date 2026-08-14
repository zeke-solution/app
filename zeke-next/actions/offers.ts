"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/supabase/notifications";
import { getSessionForRole } from "@/lib/auth/roles";
import { fmtNum } from "@/lib/domain/format";
import {
  sendCampaignInvitationEmails,
  type CampaignInvitationEmail,
} from "@/lib/email/campaign-invitation";
import {
  sendCampaignOffersSchema,
  respondToOfferSchema,
  editOfferSchema,
  type SendCampaignOffersInput,
  type RespondToOfferInput,
  type EditOfferInput,
} from "@/lib/validation/offer.schema";
import type { ActionResult } from "@/actions/auth";
import { transitionError } from "@/lib/domain/transitions";

async function respondToOffer(
  input: RespondToOfferInput,
  decision: "accept" | "decline"
): Promise<ActionResult> {
  const parsed = respondToOfferSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid offer details." };

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("respond_to_offer_transaction", {
    p_deal_id: parsed.data.dealId,
    p_decision: decision,
    p_seen_updated_at: parsed.data.seenUpdatedAt,
  });
  const fallback = decision === "accept"
    ? "Could not accept this offer."
    : "Could not decline this offer.";
  if (error) return { ok: false, error: fallback };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          wrong_status: "This offer is no longer available.",
          offer_changed: "This offer changed since you opened it. Review the latest terms before accepting.",
          invalid_decision: "Invalid offer response.",
        },
        fallback
      ),
    };
  }

  revalidatePath("/creator/offers");
  revalidatePath("/creator/deals");
  revalidatePath("/creator/chats");
  revalidatePath("/brand/deals");
  revalidatePath("/brand/chats");
  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/overview");
  revalidatePath("/brand/partnerships");
  revalidatePath(`/creator/deals/${parsed.data.dealId}`);
  return { ok: true };
}

export async function acceptOffer(input: RespondToOfferInput): Promise<ActionResult> {
  return respondToOffer(input, "accept");
}

export async function declineOffer(input: RespondToOfferInput): Promise<ActionResult> {
  return respondToOffer(input, "decline");
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

  const { data: existingOffers, error: existingOffersError } = await supabase
    .from("deals")
    .select("influencer_id")
    .eq("campaign_id", v.campaignId)
    .in("influencer_id", v.influencerIds)
    .neq("status", "cancelled");
  if (existingOffersError) {
    return { ok: false, error: "Could not verify existing campaign offers." };
  }
  const existingCreatorIds = new Set(
    (existingOffers ?? []).map((offer) => offer.influencer_id),
  );
  const newInfluencerIds = v.influencerIds.filter(
    (influencerId) => !existingCreatorIds.has(influencerId),
  );
  if (newInfluencerIds.length === 0) {
    return {
      ok: false,
      error:
        v.influencerIds.length === 1
          ? "This campaign has already been sent to this creator."
          : "This campaign has already been sent to every selected creator.",
    };
  }

  const rows = newInfluencerIds.map((influencerId) => ({
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
  if (error) {
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "This campaign is already active for one of the selected creators."
          : "Could not send this campaign. Please try again.",
    };
  }

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
  if (inserted?.length) {
    await emailNewCampaignInvitations({
      inserted,
      supabase,
      brandName,
      campaign: {
        title: campaign.title,
        platform: v.platform,
        budget: campaign.budget,
        deadline: campaign.deadline,
      },
    });
  }

  revalidatePath("/brand/deals");
  revalidatePath("/brand/chats");
  revalidatePath("/brand/campaigns");
  revalidatePath("/brand/overview");
  revalidatePath("/brand/partnerships");
  revalidatePath("/creator/offers");
  revalidatePath("/creator/chats");
  return { ok: true };
}

async function emailNewCampaignInvitations({
  inserted,
  supabase,
  brandName,
  campaign,
}: {
  inserted: { id: string; influencer_id: string | null }[];
  supabase: Awaited<ReturnType<typeof createClient>>;
  brandName: string;
  campaign: {
    title: string;
    platform: string;
    budget: number | null;
    deadline: string | null;
  };
}) {
  const creatorIds = inserted
    .map((deal) => deal.influencer_id)
    .filter((id): id is string => Boolean(id));
  if (creatorIds.length === 0) return;

  try {
    const { data: creatorProfiles } = await supabase
      .from("profiles")
      .select("id,display_name")
      .in("id", creatorIds);
    const creatorNames = new Map(
      (creatorProfiles ?? []).map((profile) => [
        profile.id,
        profile.display_name ?? "Creator",
      ]),
    );
    const admin = createAdminClient();

    const invitations = (
      await Promise.all(
        inserted.map(async (deal) => {
          if (!deal.influencer_id) return null;
          const { data, error } = await admin.auth.admin.getUserById(
            deal.influencer_id,
          );
          const email = data.user?.email;
          if (error || !email) return null;

          return {
            dealId: deal.id,
            to: email,
            creatorName: creatorNames.get(deal.influencer_id) ?? "Creator",
            brandName,
            campaignTitle: campaign.title,
            platform: campaign.platform,
            amount: campaign.budget,
            deadline: campaign.deadline,
          } satisfies CampaignInvitationEmail;
        }),
      )
    ).filter(
      (invitation): invitation is CampaignInvitationEmail =>
        invitation !== null,
    );

    const result = await sendCampaignInvitationEmails(invitations);
    if (!result.ok) {
      console.error("[email] campaign invitations remain available in-app", {
        invitationCount: inserted.length,
      });
    }
  } catch {
    console.error("[email] campaign invitation delivery could not start", {
      invitationCount: inserted.length,
    });
  }
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

  const { data: updatedDeal, error } = await supabase
    .from("deals")
    .update({
      title: v.title,
      platform: v.platform,
      amount: v.amount,
      deliverables: v.deliverables || null,
      deadline: v.deadline || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", v.dealId)
    .eq("status", "negotiating")
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!updatedDeal) {
    return { ok: false, error: "This offer was already processed. Refresh to see its latest status." };
  }

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
  revalidatePath(`/brand/chats/${v.dealId}`);
  revalidatePath("/creator/offers");
  revalidatePath("/brand/overview");
  revalidatePath("/brand/partnerships");
  revalidatePath("/brand/campaigns");
  return { ok: true };
}
