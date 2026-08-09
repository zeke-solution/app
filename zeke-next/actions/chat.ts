"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/auth";

export async function sendMessage(dealId: string, content: string): Promise<ActionResult> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Message is empty." };
  if (trimmed.length > 4000) return { ok: false, error: "Message is too long." };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("influencer_id,brand_id,status,creator_chat_closed_at")
    .eq("id", dealId)
    .single();
  if (!deal || (deal.influencer_id !== userRes.user.id && deal.brand_id !== userRes.user.id)) {
    return { ok: false, error: "Not your deal." };
  }
  if (
    deal.brand_id === userRes.user.id &&
    deal.status === "completed" &&
    deal.creator_chat_closed_at
  ) {
    return { ok: false, error: "The creator has closed messaging for this completed deal." };
  }

  const { error } = await supabase
    .from("deal_messages")
    .insert({ deal_id: dealId, sender_id: userRes.user.id, msg_type: "text", content: trimmed });
  if (error) {
    if (error.message.includes("creator_closed_completed_chat")) {
      return { ok: false, error: "The creator has closed messaging for this completed deal." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function setCreatorChatClosed(dealId: string, closed: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: code, error } = await supabase.rpc("set_creator_chat_closed", {
    p_deal_id: dealId,
    p_closed: closed,
  });
  if (error) return { ok: false, error: error.message };

  const errors: Record<string, string> = {
    not_authenticated: "Not authenticated.",
    not_found: "Deal not found.",
    not_creator: "Only the creator can control this chat.",
    deal_not_completed: "Chat can only be closed after the deal is completed.",
  };
  if (code) return { ok: false, error: errors[code] ?? "Could not update chat access." };

  revalidatePath(`/creator/chats/${dealId}`);
  revalidatePath(`/brand/chats/${dealId}`);
  return { ok: true };
}
