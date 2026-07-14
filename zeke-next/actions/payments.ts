"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";
import { fmtNum } from "@/lib/domain/format";
import type { ActionResult } from "@/actions/auth";

export async function markPaymentSent(dealId: string, amount: number): Promise<ActionResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Invalid payment amount." };
  }

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,title,status,amount")
    .eq("id", dealId)
    .single();
  if (!deal || deal.brand_id !== userRes.user.id) return { ok: false, error: "Not your deal." };
  if (deal.status !== "link_submitted") {
    return { ok: false, error: "Payment can only be marked after the final link is submitted." };
  }

  const dealAmount = Number(deal.amount);
  if (!Number.isFinite(dealAmount) || dealAmount <= 0 || Number(amount) !== dealAmount) {
    return { ok: false, error: "Payment amount must match the agreed deal amount." };
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("deal_id", dealId)
    .maybeSingle();
  if (existing) return { ok: false, error: "Payment was already marked as sent." };

  const { error } = await supabase.from("payments").insert({
    deal_id: dealId,
    amount: dealAmount,
    sent_by: userRes.user.id,
    status: "pending",
    sent_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Could not record payment." };

  const { error: statusError } = await supabase
    .from("deals")
    .update({ status: "payment_sent" })
    .eq("id", dealId)
    .eq("status", "link_submitted");
  if (statusError) return { ok: false, error: "Payment recorded, but deal status could not be updated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userRes.user.id)
    .single();
  const name = profile?.display_name ?? "Brand";
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: userRes.user.id,
    msg_type: "event_gold",
    content: `Payment of ₹${fmtNum(dealAmount)} sent by ${name}`,
  });
  if (deal.influencer_id) {
    await createNotification(supabase, {
      userId: deal.influencer_id,
      title: "Payment sent",
      body: `₹${fmtNum(dealAmount)} has been sent for ${deal.title}. Confirm receipt to close the deal.`,
      type: "payment",
      relatedDealId: dealId,
    });
  }

  revalidatePath(`/brand/deals/${dealId}`);
  revalidatePath(`/creator/deals/${dealId}`);
  return { ok: true };
}

export async function confirmPayment(paymentId: string, dealId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("influencer_id,status")
    .eq("id", dealId)
    .single();
  if (!deal || deal.influencer_id !== userRes.user.id) return { ok: false, error: "Not your deal." };
  if (deal.status !== "payment_sent") {
    return { ok: false, error: "This deal is not awaiting payment confirmation." };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id,status")
    .eq("id", paymentId)
    .eq("deal_id", dealId)
    .single();
  if (!payment) return { ok: false, error: "Payment does not belong to this deal." };
  if (payment.status !== "pending") return { ok: false, error: "Payment was already confirmed." };

  const { error } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      confirmed_by: userRes.user.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("deal_id", dealId)
    .eq("status", "pending");
  if (error) return { ok: false, error: "Could not confirm payment." };

  const { error: statusError } = await supabase
    .from("deals")
    .update({ status: "completed" })
    .eq("id", dealId)
    .eq("status", "payment_sent");
  if (statusError) return { ok: false, error: "Payment confirmed, but deal could not be completed." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userRes.user.id)
    .single();
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: userRes.user.id,
    msg_type: "event",
    content: `Payment confirmed by ${profile?.display_name ?? "Creator"}. Deal complete.`,
  });

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  return { ok: true };
}
