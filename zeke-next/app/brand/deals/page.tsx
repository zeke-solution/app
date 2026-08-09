import { getSessionProfile } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import type { DealStatus } from '@/lib/domain/deal-status';
import { DealCard } from '@/components/deals/DealCard';

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
      <h1 className='mb-1 text-xl font-black text-light'>Deals</h1>
      <p className='mb-4 text-xs text-muted'>
        Accepted campaigns and their delivery progress
      </p>
      {(data ?? []).length === 0 ? (
        <div className='rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted'>
          No accepted deals yet. Offer negotiations remain in Chats.
        </div>
      ) : (
        (data ?? []).map((deal) => {
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
        })
      )}
    </div>
  );
}
