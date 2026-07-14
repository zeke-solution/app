"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/auth";

// Port of creator.js's submitFinalLink().
export async function submitFinalLink(dealId: string, url: string): Promise<ActionResult> {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, error: "Enter the live URL." };
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid URL." };
  }
  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    return { ok: false, error: "Only HTTP or HTTPS links are allowed." };
  }

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase.from("deals").select("influencer_id,status").eq("id", dealId).single();
  if (!deal || deal.influencer_id !== userRes.user.id) return { ok: false, error: "Not your deal." };
  if (deal.status !== "approved") return { ok: false, error: "Available after brand approves your content." };

  const { data: existing } = await supabase.from("final_links").select("id").eq("deal_id", dealId).maybeSingle();
  if (existing) return { ok: false, error: "A final link was already submitted." };

  const { error } = await supabase.from("final_links").insert({ deal_id: dealId, url: parsedUrl.toString() });
  if (error) return { ok: false, error: "Could not submit final link." };

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userRes.user.id).single();
  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: userRes.user.id,
    msg_type: "event",
    content: `✓ Final link submitted by ${profile?.display_name ?? "Creator"}`,
  });
  const { error: statusError } = await supabase
    .from("deals")
    .update({ status: "link_submitted" })
    .eq("id", dealId)
    .eq("status", "approved");
  if (statusError) return { ok: false, error: "Link saved, but deal status could not be updated." };

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  return { ok: true };
}
