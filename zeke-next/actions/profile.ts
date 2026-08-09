"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateInfluencerProfileSchema, type UpdateInfluencerProfileInput } from "@/lib/validation/profile.schema";
import type { ActionResult } from "@/actions/auth";

export async function updateInfluencerProfile(input: UpdateInfluencerProfileInput): Promise<ActionResult> {
  const parsed = updateInfluencerProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const v = parsed.data;

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const handle = v.igHandle.replace(/^@/, "").toLowerCase();
  const { error } = await supabase
    .from("influencer_profiles")
    .update({
      handle,
      ig_followers: v.igFollowers,
      yt_enabled: v.ytEnabled,
      yt_followers: v.ytEnabled ? v.ytFollowers ?? 0 : null,
      yt_handle: v.ytEnabled ? v.ytHandle ?? "" : null,
      x_enabled: v.xEnabled,
      x_followers: v.xEnabled ? v.xFollowers ?? 0 : null,
      x_handle: v.xEnabled ? v.xHandle ?? "" : null,
    })
    .eq("id", userRes.user.id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "That profile handle is already in use." };
    return { ok: false, error: error.message };
  }

  revalidatePath("/creator/profile");
  revalidatePath("/creator/overview");
  revalidatePath(`/c/${handle}`);
  revalidateTag("public-creator-profiles", { expire: 0 });
  return { ok: true };
}

export async function updateAvatarPath(objectPath: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return { ok: false, error: "Not authenticated." };

  const allowedPath = new RegExp(`^${user.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/avatar\\.(jpg|png|webp)$`);
  if (!allowedPath.test(objectPath)) return { ok: false, error: "Invalid profile image path." };

  const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  const { data: inf } = await supabase.from("influencer_profiles").select("handle").eq("id", user.id).maybeSingle();
  revalidatePath("/creator/profile");
  revalidatePath("/creator/overview");
  if (inf?.handle) revalidatePath(`/c/${inf.handle}`);
  revalidateTag("public-creator-profiles", { expire: 0 });
  return { ok: true };
}
