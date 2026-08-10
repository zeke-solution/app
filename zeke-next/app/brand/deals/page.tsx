import { getSessionProfile } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import type { DealStatus } from '@/lib/domain/deal-status';
import { DealCard, DealListHeader } from '@/components/deals/DealCard';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function BrandDealsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from('deals')
    .select(
      'id,title,platform,amount,status,creator:profiles!deals_influencer_id_fkey(display_name,avatar_url)',
    )
    .eq('brand_id', session.id)
    .not('status', 'in', '(negotiating,cancelled)')
    .order('updated_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title='Deals'
        description='Accepted campaigns, creator delivery, approvals, and payment progress.'
        actions={<span className='rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted'>{(data ?? []).length} total</span>}
      />
      {(data ?? []).length === 0 ? (
        <div className='rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted'>
          No accepted deals yet. Offer negotiations remain in Chats.
        </div>
      ) : (
        <>
          <DealListHeader />
          {(data ?? []).map((deal) => {
            const creator = deal.creator as {
              display_name?: string;
              avatar_url?: string | null;
            } | null;
            return (
              <DealCard
                key={deal.id}
                href={'/brand/deals/' + deal.id}
                counterpartName={creator?.display_name ?? 'Creator'}
                counterpartAvatarUrl={creator?.avatar_url}
                title={deal.title}
                platform={deal.platform}
                amount={deal.amount}
                status={deal.status as DealStatus}
                viewer='brand'
              />
            );
          })}
        </>
      )}
    </div>
  );
}
