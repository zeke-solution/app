"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/actions/auth";

export async function withdrawShieldProviderSharing(caseId: string): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(caseId)) return { ok: false, error: "Invalid Shield case." };
  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("withdraw_shield_provider_sharing", {
    p_case_id: caseId,
  });
  if (error) return { ok: false, error: "Could not stop future provider sharing." };
  if (code && code !== "sharing_already_off") {
    return {
      ok: false,
      error: code === "not_your_case" ? "This Shield case is not available to your account." : "Could not stop future provider sharing.",
    };
  }
  revalidatePath(`/creator/shield/cases/${caseId}`);
  revalidatePath(`/admin/shield/cases/${caseId}`);
  return { ok: true };
}
