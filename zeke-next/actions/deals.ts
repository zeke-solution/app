"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";
import type { ActionResult } from "@/actions/auth";

const CLOSED_STATUSES = new Set(["completed", "cancelled"]);

async function getDisplayName(supabase: Awaited<ReturnType<typeof createClient>>, uid: string) {
  const { data } = await supabase.from("profiles").select("display_name").eq("id", uid).single();
  return data?.display_name ?? "User";
}

export async function requestCancel(dealId: string, reason: string): Promise<ActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { ok: false, error: "Please provide a reason." };
  if (trimmedReason.length > 1000) return { ok: false, error: "Cancellation reason is too long." };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };
  const uid = userRes.user.id;

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,title,status,cancel_requested_by")
    .eq("id", dealId)
    .single();
  if (!deal || (deal.influencer_id !== uid && deal.brand_id !== uid)) {
    return { ok: false, error: "Not your deal." };
  }
  if (CLOSED_STATUSES.has(deal.status) || deal.status === "disputed") {
    return { ok: false, error: "Cancellation is unavailable for this deal." };
  }
  if (deal.cancel_requested_by) {
    return { ok: false, error: "A cancellation request is already pending." };
  }

  const { data: updated, error } = await supabase
    .from("deals")
    .update({ cancel_requested_by: uid, cancel_reason: trimmedReason })
    .eq("id", dealId)
    .is("cancel_requested_by", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not request cancellation." };
  if (!updated) return { ok: false, error: "A cancellation request is already pending." };

  const name = await getDisplayName(supabase, uid);
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: uid,
    msg_type: "event",
    content: `Cancellation requested by ${name}: ${trimmedReason}`,
  });
  const otherParty = deal.influencer_id === uid ? deal.brand_id : deal.influencer_id;
  if (otherParty) {
    await createNotification(supabase, {
      userId: otherParty,
      title: "Cancellation requested",
      body: `${name} wants to cancel ${deal.title}`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidateDeal(dealId);
  return { ok: true };
}

export async function acceptCancel(dealId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };
  const uid = userRes.user.id;

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,title,status,cancel_requested_by")
    .eq("id", dealId)
    .single();
  if (!deal || (deal.influencer_id !== uid && deal.brand_id !== uid)) {
    return { ok: false, error: "Not your deal." };
  }
  if (!deal.cancel_requested_by) return { ok: false, error: "No cancellation request is pending." };
  if (deal.cancel_requested_by === uid) {
    return { ok: false, error: "The other party must respond to your request." };
  }
  if (CLOSED_STATUSES.has(deal.status)) return { ok: false, error: "This deal is already closed." };

  const { data: updated, error } = await supabase
    .from("deals")
    .update({ status: "cancelled" })
    .eq("id", dealId)
    .eq("cancel_requested_by", deal.cancel_requested_by)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not accept cancellation." };
  if (!updated) return { ok: false, error: "Cancellation was already processed." };

  const name = await getDisplayName(supabase, uid);
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: uid,
    msg_type: "event",
    content: `Cancellation accepted by ${name}. Deal cancelled.`,
  });
  const otherParty = deal.influencer_id === uid ? deal.brand_id : deal.influencer_id;
  if (otherParty) {
    await createNotification(supabase, {
      userId: otherParty,
      title: "Deal cancelled",
      body: `${deal.title} has been cancelled.`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidateDeal(dealId);
  return { ok: true };
}

export async function declineCancel(dealId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };
  const uid = userRes.user.id;

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,title,status,cancel_requested_by")
    .eq("id", dealId)
    .single();
  if (!deal || (deal.influencer_id !== uid && deal.brand_id !== uid)) {
    return { ok: false, error: "Not your deal." };
  }
  if (!deal.cancel_requested_by) return { ok: false, error: "No cancellation request is pending." };
  if (deal.cancel_requested_by === uid) {
    return { ok: false, error: "The other party must respond to your request." };
  }

  const { data: updated, error } = await supabase
    .from("deals")
    .update({ cancel_requested_by: null, cancel_reason: null })
    .eq("id", dealId)
    .eq("cancel_requested_by", deal.cancel_requested_by)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: "Could not decline cancellation." };
  if (!updated) return { ok: false, error: "Cancellation was already processed." };

  const name = await getDisplayName(supabase, uid);
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: uid,
    msg_type: "event",
    content: `Cancellation declined by ${name}.`,
  });
  const otherParty = deal.influencer_id === uid ? deal.brand_id : deal.influencer_id;
  if (otherParty) {
    await createNotification(supabase, {
      userId: otherParty,
      title: "Cancellation declined",
      body: `The other party declined cancellation of ${deal.title}`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidateDeal(dealId);
  return { ok: true };
}

function revalidateDeal(dealId: string) {
  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
}
