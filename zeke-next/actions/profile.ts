"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateInfluencerProfileSchema,
  type UpdateInfluencerProfileInput,
} from "@/lib/validation/profile.schema";
import type { ActionResult } from "@/actions/auth";

// Port of creator.js's saveProfile().
export async function updateInfluencerProfile(
  input: UpdateInfluencerProfileInput
): Promise<ActionResult> {
  const parsed = updateInfluencerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("influencer_profiles")
    .update({
      handle: v.igHandle.replace("@", ""),
      ig_followers: v.igFollowers,
      yt_enabled: v.ytEnabled,
      yt_followers: v.ytEnabled ? v.ytFollowers ?? 0 : null,
      yt_handle: v.ytEnabled ? v.ytHandle ?? "" : null,
      x_enabled: v.xEnabled,
      x_followers: v.xEnabled ? v.xFollowers ?? 0 : null,
      x_handle: v.xEnabled ? v.xHandle ?? "" : null,
    })
    .eq("id", userRes.user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/creator/profile");
  revalidatePath("/creator/overview");
  return { ok: true };
}
