"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  resetSchema,
  updatePasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ResetInput,
  type UpdatePasswordInput,
} from "@/lib/validation/auth.schema";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function roleHome(role: string) {
  if (role === "admin") return "/admin";
  if (role === "brand") return "/brand";
  return "/creator";
}

// Port of auth.js's doLogin().
export async function signInUser(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    return { ok: false, error: "Account not set up. Contact support." };
  }

  redirect(roleHome(profile.role));
}

// Port of auth.js's doRegister(). Builds the same `meta` shape the
// handle_new_user() Postgres trigger expects (raw_user_meta_data), so the
// trigger needs no changes for this migration.
export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const meta: Record<string, unknown> = { role: v.role, display_name: v.name };

  if (v.role === "brand") {
    meta.brand_type = v.brandType;
    meta.location = v.location;
  } else {
    meta.location = v.location;
    meta.niche = v.niche;
    meta.handle = v.igHandle.replace("@", "");
    meta.ig_followers = v.igFollowers;
    meta.yt_enabled = v.ytEnabled;
    meta.x_enabled = v.xEnabled;
    if (v.ytEnabled) {
      meta.yt_handle = v.ytHandle ?? "";
      meta.yt_followers = v.ytFollowers ?? 0;
    }
    if (v.xEnabled) {
      meta.x_handle = v.xHandle ?? "";
      meta.x_followers = v.xFollowers ?? 0;
    }
    meta.is_adult = v.isAdult;
    if (!v.isAdult) {
      meta.guardian_name = v.guardianName;
      meta.guardian_email = v.guardianEmail;
      meta.guardian_relation = v.guardianRelation;
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: v.email,
    password: v.password,
    options: {
      data: meta,
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/login`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // If email confirmation is OFF in Supabase, signUp returns a session
  // immediately and the user is already logged in.
  if (data.session) {
    redirect(roleHome(v.role === "brand" ? "brand" : "influencer"));
  }

  redirect(`/verify?email=${encodeURIComponent(v.email)}`);
}

// Port of auth.js's requestReset().
export async function requestPasswordReset(input: ResetInput): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Port of auth.js's submitNewPassword(). Only reachable once
// auth/callback/route.ts has already exchanged the recovery code for a
// session, so the user is authenticated by the time this runs.
export async function updatePassword(input: UpdatePasswordInput): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Could not update password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    return { ok: false, error: "Your account profile could not be loaded. Contact support." };
  }

  redirect(roleHome(profile.role));
}

// Port of session.js's zekeSignOut().
export async function signOutUser(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
