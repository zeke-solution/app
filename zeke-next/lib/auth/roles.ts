import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Role = "influencer" | "brand" | "admin";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type InfluencerProfile =
  Database["public"]["Tables"]["influencer_profiles"]["Row"];
export type BrandProfile = Database["public"]["Tables"]["brand_profiles"]["Row"];

export type SessionProfile = {
  id: string;
  email: string;
  profile: Profile;
  inf: InfluencerProfile | null;
  brand: BrandProfile | null;
};

// Direct replacement for session.js's window.ZK. Wrapped in React's cache()
// so a layout and its child pages calling this in the same request only hit
// Postgres once. Returns null if there's no valid session or no profile row
// (mirrors the old "no profile -> bounce to auth" behavior) - callers decide
// whether to redirect.
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const { data: claimsRes, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsRes?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (claimsError || !userId) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;

  let inf: InfluencerProfile | null = null;
  let brand: BrandProfile | null = null;

  if (profile.role === "influencer") {
    const { data } = await supabase
      .from("influencer_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    inf = data ?? null;
  } else if (profile.role === "brand") {
    const { data } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    brand = data ?? null;
  }

  const email = typeof claims?.email === "string" ? claims.email : "";
  return { id: userId, email, profile, inf, brand };
});

// Call from each app/{creator,brand,admin}/layout.tsx. Redirects to /login
// if there's no session, or if the session's role doesn't match the
// dashboard being rendered (direct port of session.js's role guard).
export async function requireRole(role: Role): Promise<SessionProfile> {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== role) {
    redirect("/login");
  }
  return session;
}

export async function getSessionForRole(role: Role): Promise<SessionProfile | null> {
  const session = await getSessionProfile();
  return session?.profile.role === role ? session : null;
}
