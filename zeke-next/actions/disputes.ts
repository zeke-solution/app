"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";
import type { ActionResult } from "@/actions/auth";

export async function raiseDispute(dealId: string, reason: string): Promise<ActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { ok: false, error: "Describe the issue." };
  if (trimmedReason.length > 2000) return { ok: false, error: "Reason is too long." };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };
  const uid = userRes.user.id;

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,title,status")
    .eq("id", dealId)
    .single();
  if (!deal || (deal.influencer_id !== uid && deal.brand_id !== uid)) {
    return { ok: false, error: "Not your deal." };
  }
  if (deal.status === "disputed") return { ok: false, error: "A dispute is already open." };
  if (deal.status === "completed" || deal.status === "cancelled") {
    return { ok: false, error: "This deal is closed; you cannot raise a dispute." };
  }

  const [{ data: profile }, { data: inf }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", uid).single(),
    supabase.from("influencer_profiles").select("shield_active").eq("id", uid).maybeSingle(),
  ]);
  const name = profile?.display_name ?? "User";
  const isShield = !!inf?.shield_active;

  const { error } = await supabase.from("disputes").insert({
    deal_id: dealId,
    raised_by: uid,
    reason: trimmedReason,
    status: "open",
    previous_deal_status: deal.status,
  });
  if (error) return { ok: false, error: "Could not open dispute." };

  const { error: statusError } = await supabase
    .from("deals")
    .update({ status: "disputed", updated_at: new Date().toISOString() })
    .eq("id", dealId);
  if (statusError) return { ok: false, error: "Dispute opened, but deal status could not be updated." };

  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: uid,
    msg_type: isShield ? "event_gold" : "event",
    content: `${isShield ? "Shield" : "Warning"}: dispute raised by ${name}: ${trimmedReason}`,
  });

  const otherParty = deal.influencer_id === uid ? deal.brand_id : deal.influencer_id;
  if (otherParty) {
    await createNotification(supabase, {
      userId: otherParty,
      title: "Dispute opened",
      body: `${name} raised a dispute on ${deal.title}`,
      type: "system",
      relatedDealId: dealId,
    });
  }

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  return { ok: true };
}

export async function resolveDispute(disputeId: string, resolution: string): Promise<ActionResult> {
  const trimmedResolution = resolution.trim();
  if (!trimmedResolution) return { ok: false, error: "Resolution note is required." };
  if (trimmedResolution.length > 2000) return { ok: false, error: "Resolution is too long." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_dispute_transaction", {
    p_dispute_id: disputeId,
    p_resolution: trimmedResolution,
  });
  if (error) return { ok: false, error: "Could not resolve dispute." };
  if (!data) return { ok: false, error: "This dispute was already processed." };

  revalidatePath("/admin/disputes");
  revalidatePath("/admin/overview");
  revalidatePath("/admin/deals");
  return { ok: true };
}

export async function escalateDispute(disputeId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("escalate_dispute_transaction", {
    p_dispute_id: disputeId,
  });
  if (error) return { ok: false, error: "Could not escalate dispute." };
  if (!data) return { ok: false, error: "Only open disputes can be escalated." };

  revalidatePath("/admin/disputes");
  return { ok: true };
}
