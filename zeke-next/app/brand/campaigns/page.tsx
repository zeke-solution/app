import { getSessionProfile } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { CampaignsPageClient } from '@/components/campaigns/CampaignsPageClient';
import type { CampaignRow } from '@/components/campaigns/CampaignCard';
import type { CampaignDeliveryRow } from '@/components/campaigns/CampaignsPageClient';

export default async function BrandCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();
  const openComposer = (await searchParams).new === '1';

  const [campaignsResult, deliveriesResult] = await Promise.all([
    supabase
      .from('campaigns')
      .select('*')
      .eq('brand_id', session.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('deals')
      .select(
        'id,campaign_id,title,platform,amount,status,created_at,creator:profiles!deals_influencer_id_fkey(display_name,avatar_url)',
      )
      .eq('brand_id', session.id)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <CampaignsPageClient
      key={openComposer ? 'composer' : 'campaign-list'}
      campaigns={(campaignsResult.data ?? []) as CampaignRow[]}
      deliveries={
        (deliveriesResult.data ?? []) as unknown as CampaignDeliveryRow[]
      }
      initialShowForm={openComposer}
    />
  );
}
