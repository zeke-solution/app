"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { transitionError } from "@/lib/domain/transitions";
import type { ActionResult } from "@/actions/auth";

export async function markPaymentSent(dealId: string, amount: number): Promise<ActionResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Invalid payment amount." };
  }

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("mark_payment_sent_transaction", {
    p_deal_id: dealId,
    p_amount: amount,
  });
  if (error) return { ok: false, error: "Could not record payment." };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          wrong_status: "Payment can only be marked after the final link is submitted.",
          amount_mismatch: "Payment amount must match the agreed deal amount.",
          already_sent: "Payment was already marked as sent.",
          invalid_amount: "Invalid payment amount.",
        },
        "Could not record payment."
      ),
    };
  }

  revalidatePath(`/brand/deals/${dealId}`);
  revalidatePath(`/creator/deals/${dealId}`);
  return { ok: true };
}

export async function confirmPayment(paymentId: string, dealId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("confirm_payment_transaction", {
    p_payment_id: paymentId,
    p_deal_id: dealId,
  });
  if (error) return { ok: false, error: "Could not confirm payment." };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          wrong_status: "This deal is not awaiting payment confirmation.",
          payment_mismatch: "Payment does not belong to this deal.",
          already_confirmed: "Payment was already confirmed.",
        },
        "Could not confirm payment."
      ),
    };
  }

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  return { ok: true };
}
