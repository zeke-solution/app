import "server-only";
import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function createNotification(
  supabase: SupabaseServerClient,
  input: {
    userId: string;
    title: string;
    body?: string | null;
    type?: string | null;
    relatedDealId?: string | null;
  }
) {
  return supabase.rpc("create_notification", {
    p_user_id: input.userId,
    p_title: input.title,
    p_body: input.body ?? null,
    p_type: input.type ?? null,
    p_related_deal_id: input.relatedDealId ?? null,
  });
}
