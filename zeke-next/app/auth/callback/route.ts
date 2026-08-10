import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth/navigation";

// PKCE code-exchange endpoint. Replaces the old hash-fragment handling in
// auth.js (ZEKE_RECOVERY_FLOW / onAuthStateChange('PASSWORD_RECOVERY')) -
// with PKCE the email link carries `?code=...` (a real query param, sent to
// the server) instead of a `#access_token=...` fragment (never sent to a
// server), plus a `next` param we set ourselves when generating the link
// (see actions/auth.ts) so this one handler can serve both the signup
// confirmation and password-reset flows without guessing intent.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/login";
  const preferredRole = searchParams.get("role") === "brand" ? "brand" : "influencer";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (requestedNext === "/update-password") {
        return NextResponse.redirect(`${origin}/update-password`);
      }

      const { data: userResult } = await supabase.auth.getUser();
      const user = userResult.user;
      if (!user) {
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile) {
        return NextResponse.redirect(`${origin}/login?error=account_not_setup`);
      }

      if (!profile.onboarding_completed || profile.role === "pending") {
        return NextResponse.redirect(`${origin}/onboarding?role=${preferredRole}`);
      }

      return NextResponse.redirect(`${origin}${roleHome(profile.role)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
