"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export function GoogleAuthButton({
  intendedRole,
  label = "Continue with Google",
}: {
  intendedRole?: "influencer" | "brand";
  label?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!GOOGLE_AUTH_ENABLED) return null;

  async function startGoogleSignIn() {
    setError("");
    setPending(true);

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/onboarding");
    if (intendedRole) callback.searchParams.set("role", intendedRole);

    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        queryParams: { prompt: "select_account" },
      },
    });

    if (oauthError) {
      setPending(false);
      setError("Google sign-in could not start. Please try again.");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startGoogleSignIn}
        disabled={pending}
        className="flex w-full items-center justify-center gap-3 rounded-[10px] border border-[#d6d9de] bg-white px-4 py-2.5 text-sm font-semibold text-[#2b2438] transition-colors hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark />
        {pending ? "Opening Google..." : label}
      </button>
      {error && (
        <div role="alert" className="mt-3 rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
          {error}
        </div>
      )}
    </div>
  );
}

export function AuthDivider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.259h2.909c1.702-1.567 2.684-3.874 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.963 10.706A5.42 5.42 0 0 1 3.681 9c0-.592.102-1.168.282-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.582-2.582C13.463.891 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z" />
    </svg>
  );
}
