import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export type PublicCreator = {
  display_name: string;
  location: string | null;
  avatar_url: string | null;
  handle: string;
  niche: string | null;
  ig_followers: number;
  yt_followers: number | null;
  x_followers: number | null;
  yt_enabled: boolean;
  x_enabled: boolean;
  rating: number | null;
  verified: boolean;
  shield_active: boolean;
  completed_deals: number;
};

const getCachedPublicCreatorProfile = unstable_cache(
  async (handle: string): Promise<PublicCreator | null> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data, error } = await supabase.rpc("get_public_creator_profile", { p_handle: handle });
    if (error) throw error;
    return (Array.isArray(data) ? data[0] : null) as PublicCreator | null;
  },
  ["public-creator-profile"],
  { revalidate: 300, tags: ["public-creator-profiles"] }
);

export function getPublicCreatorProfile(handle: string) {
  return getCachedPublicCreatorProfile(handle.toLowerCase());
}
