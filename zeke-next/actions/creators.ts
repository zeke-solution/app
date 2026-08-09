'use server';

import { createClient } from '@/lib/supabase/server';
import { getSessionForRole } from '@/lib/auth/roles';
import type { CreatorRow } from '@/components/creators/CreatorCard';
import { isShieldMembershipActive } from '@/lib/domain/shield-membership';

export async function searchCreators(filters: {
  query?: string;
  niche?: string;
  shieldOnly?: boolean;
}): Promise<CreatorRow[]> {
  const session = await getSessionForRole('brand');
  if (!session) return [];
  const supabase = await createClient();

  let query = supabase
    .from('influencer_profiles')
    .select(
      'id,niche,ig_followers,rating,shield_active,shield_expires,handle,profiles!influencer_profiles_id_fkey(display_name,location,avatar_url)',
    )
    .order('shield_active', { ascending: false })
    .order('ig_followers', { ascending: false });

  if (filters.niche) query = query.eq('niche', filters.niche);

  const { data } = await query;
  let rows = ((data ?? []) as unknown as CreatorRow[]).map((creator) => ({
    ...creator,
    shield_active: isShieldMembershipActive(creator),
  }));

  if (filters.shieldOnly) {
    rows = rows.filter((creator) => creator.shield_active);
  }
  rows.sort(
    (a, b) => Number(Boolean(b.shield_active)) - Number(Boolean(a.shield_active)),
  );

  if (filters.query) {
    const needle = filters.query.toLowerCase();
    rows = rows.filter((creator) => {
      const name = creator.profiles?.display_name?.toLowerCase() ?? '';
      const niche = creator.niche?.toLowerCase() ?? '';
      return name.includes(needle) || niche.includes(needle);
    });
  }

  return rows;
}
