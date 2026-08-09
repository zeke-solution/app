import { searchCreators } from "@/actions/creators";
import { DiscoverClient } from "@/components/creators/DiscoverClient";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function BrandDiscoverPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();
  const [creators, campaignsResult] = await Promise.all([
    searchCreators({}),
    supabase
      .from("campaigns")
      .select("id,title,niche,platform,budget,deadline,status")
      .eq("brand_id", session.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <DiscoverClient
      initialCreators={creators}
      campaigns={campaignsResult.data ?? []}
    />
  );
}
