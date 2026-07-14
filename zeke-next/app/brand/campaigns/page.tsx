import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { CampaignsPageClient } from "@/components/campaigns/CampaignsPageClient";

export default async function BrandCampaignsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("brand_id", session.id)
    .order("created_at", { ascending: false });

  return <CampaignsPageClient campaigns={data ?? []} />;
}
