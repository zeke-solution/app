"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/auth";

// Port of creator.js/brand.js's sendChatMessage()/sendBrandMessage() —
// insert only; the realtime fan-out to the other party happens client-side
// via ChatThread's Supabase Realtime subscription (see plan section 3.4).
export async function sendMessage(dealId: string, content: string): Promise<ActionResult> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Message is empty." };
  if (trimmed.length > 4000) return { ok: false, error: "Message is too long." };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("influencer_id,brand_id")
    .eq("id", dealId)
    .single();
  if (!deal || (deal.influencer_id !== userRes.user.id && deal.brand_id !== userRes.user.id)) {
    return { ok: false, error: "Not your deal." };
  }

  const { error } = await supabase
    .from("deal_messages")
    .insert({ deal_id: dealId, sender_id: userRes.user.id, msg_type: "text", content: trimmed });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
