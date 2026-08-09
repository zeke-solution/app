"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SHIELD_MONTHLY_PRICE_INR } from "@/lib/domain/constants";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import type { ActionResult } from "@/actions/auth";

export type ShieldRequestResult = ActionResult | { ok: true; alreadyPending: true };

export async function requestShield(): Promise<ShieldRequestResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };
  const uid = userRes.user.id;

  const { data: inf } = await supabase
    .from("influencer_profiles")
    .select("shield_active,shield_expires")
    .eq("id", uid)
    .single();
  if (!inf) return { ok: false, error: "Creator profile not found." };
  if (isShieldMembershipActive(inf)) return { ok: false, error: "You already have an active Shield membership." };

  const { data: pending } = await supabase
    .from("shield_requests")
    .select("id")
    .eq("influencer_id", uid)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) return { ok: true, alreadyPending: true };

  const { error } = await supabase.from("shield_requests").insert({
    influencer_id: uid,
    amount: SHIELD_MONTHLY_PRICE_INR,
    status: "pending",
  });
  if (error) return { ok: false, error: "Could not submit Shield request." };

  revalidatePath("/creator/profile");
  revalidatePath("/creator/shield");
  revalidatePath("/creator/shield/payment");
  return { ok: true };
}

export async function activateShield(requestId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("activate_shield_request", {
    p_request_id: requestId,
  });
  if (error) return { ok: false, error: "Could not activate Shield." };
  if (!data) return { ok: false, error: "This Shield request was already processed." };

  revalidatePath("/admin/shield");
  revalidatePath("/admin/overview");
  return { ok: true };
}

export async function rejectShield(requestId: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, error: "Reason is required." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reject_shield_request", {
    p_request_id: requestId,
    p_reason: reason.trim(),
  });
  if (error) return { ok: false, error: "Could not reject Shield request." };
  if (!data) return { ok: false, error: "This Shield request was already processed." };

  revalidatePath("/admin/shield");
  revalidatePath("/admin/overview");
  return { ok: true };
}
