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
  type GoogleOnboardingInput,
  type ResetInput,
  type UpdatePasswordInput,
} from "@/lib/validation/auth.schema";
import { roleHome } from "@/lib/auth/navigation";

export type ActionResult = { ok: true } | { ok: false; error: string };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

// Port of auth.js's doLogin().
export async function signInUser(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    console.error("[auth] sign-in failed", {
      name: error?.name ?? "MissingUser",
      code: error?.code ?? null,
      status: error?.status ?? null,
      message: error?.message ?? "Authentication returned no user.",
    });
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
    meta.handle = v.igHandle.replace(/^@/, "").toLowerCase();
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
      // Use a first-party token hash so confirmation works across browsers and devices.
      emailRedirectTo: `${SITE_URL}/auth/confirm-signup`,
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

export async function completeGoogleOnboarding(
  input: GoogleOnboardingInput,
): Promise<ActionResult> {
  // Reuse the complete registration validation while supplying server-only
  // placeholders for the two password-registration fields OAuth does not use.
  const parsed = registerSchema.safeParse({
    ...input,
    email: "oauth-onboarding@zekesolution.com",
    password: "oauth-onboarding",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your profile details.",
    };
  }

  const supabase = await createClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  const user = userResult.user;
  if (userError || !user) {
    return { ok: false, error: "Your Google session expired. Please sign in again." };
  }

  if (!user.identities?.some((identity) => identity.provider === "google")) {
    return { ok: false, error: "A verified Google sign-in is required." };
  }

  const v = parsed.data;
  const isBrand = v.role === "brand";
  const { data: code, error } = await supabase.rpc("complete_google_onboarding", {
    p_role: v.role,
    p_display_name: v.name,
    p_location: v.location,
    p_brand_type: isBrand ? v.brandType : null,
    p_niche: isBrand ? null : v.niche,
    p_handle: isBrand ? null : v.igHandle.replace(/^@/, "").toLowerCase(),
    p_ig_followers: isBrand ? null : v.igFollowers,
    p_yt_enabled: isBrand ? null : v.ytEnabled,
    p_yt_handle: isBrand || !v.ytEnabled ? null : (v.ytHandle ?? null),
    p_yt_followers: isBrand || !v.ytEnabled ? null : (v.ytFollowers ?? 0),
    p_x_enabled: isBrand ? null : v.xEnabled,
    p_x_handle: isBrand || !v.xEnabled ? null : (v.xHandle ?? null),
    p_x_followers: isBrand || !v.xEnabled ? null : (v.xFollowers ?? 0),
    p_is_adult: isBrand ? null : v.isAdult,
    p_guardian_name: isBrand || v.isAdult ? null : (v.guardianName ?? null),
    p_guardian_email: isBrand || v.isAdult ? null : (v.guardianEmail ?? null),
    p_guardian_relation: isBrand || v.isAdult ? null : (v.guardianRelation ?? null),
  });

  if (error) {
    console.error("[auth] Google onboarding failed", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, error: "Could not finish account setup. Please try again." };
  }

  if (code === "already_completed") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,onboarding_completed")
      .eq("id", user.id)
      .single();
    if (profile?.onboarding_completed) redirect(roleHome(profile.role));
  }

  const messages: Record<string, string> = {
    unauthenticated: "Your Google session expired. Please sign in again.",
    google_identity_required: "A verified Google sign-in is required.",
    profile_missing: "Your Zeke account could not be loaded. Contact support.",
    profile_state_invalid: "Your account needs support before setup can continue.",
    invalid_profile: "Check your name and location.",
    invalid_brand: "Select a valid brand type.",
    invalid_creator: "Complete the required creator and Instagram details.",
    guardian_required: "Complete all guardian details for an under-18 creator.",
    handle_taken: "That Instagram handle is already used by another creator.",
  };

  if (code) {
    return { ok: false, error: messages[code] ?? "Could not finish account setup." };
  }

  redirect(roleHome(v.role));
}

// Port of auth.js's requestReset().
export async function requestPasswordReset(input: ResetInput): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // The recovery template sends the token hash to a first-party confirmation
    // page. Unlike PKCE, token-hash verification is not tied to the browser
    // that requested the email, so a desktop request can be completed safely
    // on a phone. The intermediate form also prevents link-preview scanners
    // from consuming the one-time token with a GET request.
    redirectTo: `${SITE_URL}/auth/confirm`,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

function readTokenHash(formData: FormData): string | null {
  const tokenHash = String(formData.get('token_hash') ?? '').trim();
  return tokenHash.length >= 20 && tokenHash.length <= 1024 ? tokenHash : null;
}

export async function confirmEmailSignup(formData: FormData): Promise<never> {
  const tokenHash = readTokenHash(formData);
  if (!tokenHash) redirect('/login?error=signup_link_invalid');

  const supabase = await createClient();
  // This endpoint accepts signup-confirmation tokens only. Keeping the OTP
  // type server-side prevents it from becoming a generic token verifier.
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });

  if (error || !data.user) {
    console.error('[auth] signup token verification failed', {
      name: error?.name ?? 'MissingUser',
      code: error?.code ?? null,
      status: error?.status ?? null,
      message: error?.message ?? 'Verification returned no user.',
    });
    redirect('/login?error=signup_link_invalid');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,onboarding_completed')
    .eq('id', data.user.id)
    .single();

  if (!profile) redirect('/login?error=account_not_setup');
  redirect(roleHome(profile.onboarding_completed ? profile.role : 'pending'));
}

export async function confirmPasswordRecovery(formData: FormData): Promise<never> {
  const tokenHash = String(formData.get("token_hash") ?? "").trim();

  if (tokenHash.length < 20 || tokenHash.length > 1024) {
    redirect("/login?error=recovery_link_invalid");
  }

  const supabase = await createClient();
  // This action is recovery-only. Keeping the token type server-side avoids a
  // second query parameter that mobile mail clients can strip or rewrite,
  // while Supabase still verifies that the token itself is a recovery token.
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });

  if (error) {
    console.error("[auth] recovery token verification failed", {
      name: error.name,
      code: error.code ?? null,
      status: error.status ?? null,
      message: error.message,
    });
    redirect("/login?error=recovery_link_invalid");
  }

  redirect("/update-password");
}

// Port of auth.js's submitNewPassword(). Only reachable once either the
// legacy PKCE callback or the cross-device token-hash confirmation action has
// created a recovery session, so the user is authenticated when this runs.
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
