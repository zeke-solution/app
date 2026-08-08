"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionForRole } from "@/lib/auth/roles";
import type { CreatorRow } from "@/components/creators/CreatorCard";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";

// Cross-user read (brand viewing creator profiles) — kept as a Server
// Action rather than a direct browser client call per the plan's "every
// read that needs cross-user visibility goes through a Server Component or
// Server Action" rule, even though RLS (inf_brand_read) already permits it.
export async function searchCreators(filters: {
  query?: string;
  niche?: string;
  shieldOnly?: boolean;
}): Promise<CreatorRow[]> {
  const session = await getSessionForRole("brand");
  if (!session) return [];
  const supabase = await createClient();

  let q = supabase
    .from("influencer_profiles")
    .select("id,niche,ig_followers,rating,shield_active,shield_expires,handle,profiles!influencer_profiles_id_fkey(display_name,location)")
    .order("shield_active", { ascending: false })
    .order("ig_followers", { ascending: false });

  if (filters.niche) q = q.eq("niche", filters.niche);

  const { data } = await q;
  let rows = ((data ?? []) as unknown as CreatorRow[]).map((creator) => ({
    ...creator,
    shield_active: isShieldMembershipActive(creator),
  }));

  if (filters.shieldOnly) rows = rows.filter((creator) => creator.shield_active);
  rows.sort((a, b) => Number(!!b.shield_active) - Number(!!a.shield_active));

  if (filters.query) {
    const needle = filters.query.toLowerCase();
    rows = rows.filter((c) => {
      const name = c.profiles?.display_name?.toLowerCase() ?? "";
      const niche = c.niche?.toLowerCase() ?? "";
      return name.includes(needle) || niche.includes(needle);
    });
  }

  return rows;
}
