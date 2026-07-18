"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transitionError } from "@/lib/domain/transitions";
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
  const { data: code, error } = await supabase.rpc("submit_final_link_transaction", {
    p_deal_id: dealId,
    p_url: parsedUrl.toString(),
  });
  if (error) return { ok: false, error: "Could not submit final link." };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          wrong_status: "Available after brand approves your content.",
          already_submitted: "A final link was already submitted.",
          invalid_scheme: "Only HTTP or HTTPS links are allowed.",
          invalid_input: "Enter a valid URL.",
        },
        "Could not submit final link."
      ),
    };
  }

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  return { ok: true };
}
