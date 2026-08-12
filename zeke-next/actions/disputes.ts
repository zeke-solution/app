"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transitionError } from "@/lib/domain/transitions";
import type { ActionResult } from "@/actions/auth";

export async function raiseDispute(dealId: string, reason: string): Promise<ActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { ok: false, error: "Describe the issue." };
  if (trimmedReason.length > 2000) return { ok: false, error: "Reason is too long." };

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("raise_dispute_transaction", {
    p_deal_id: dealId,
    p_reason: trimmedReason,
  });
  if (error) return { ok: false, error: "Could not open dispute." };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          already_disputed: "A dispute is already open.",
          deal_closed: "This deal is closed; you cannot raise a dispute.",
          reason_required: "Describe the issue.",
          reason_too_long: "Reason is too long.",
        },
        "Could not open dispute."
      ),
    };
  }

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  revalidatePath("/brand/overview");
  revalidatePath("/brand/partnerships");
  revalidatePath("/creator/shield");
  revalidatePath("/admin/shield/cases");
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
  revalidatePath("/brand/overview");
  revalidatePath("/brand/partnerships");
  return { ok: true };
}
