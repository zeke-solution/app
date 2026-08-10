import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import type { DealStatus } from '@/lib/domain/deal-status';
import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function BrandChatsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from('deals')
    .select(
      'id,title,status,creator:profiles!deals_influencer_id_fkey(display_name,avatar_url)',
    )
    .eq('brand_id', session.id)
    .not('status', 'eq', 'cancelled')
    .order('updated_at', { ascending: false });

  return (
    <div>
      <PageHeader
        title='Chats'
        description='Campaign conversations and creator negotiations.'
        actions={<span className='rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted'>{(data ?? []).length} conversations</span>}
      />
      {(data ?? []).length === 0 ? (
        <div className='rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted'>
          No active chats yet.
        </div>
      ) : (
        (data ?? []).map((deal) => {
          const creator = deal.creator as {
            display_name?: string;
            avatar_url?: string | null;
          } | null;
          const creatorName = creator?.display_name ?? 'Creator';
          return (
            <Link
              key={deal.id}
              href={'/brand/chats/' + deal.id}
              className='mb-2 flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-accent/30 sm:p-5'
            >
              <ProfileAvatar
                name={creatorName}
                avatarUrl={creator?.avatar_url}
                className='h-10 w-10 rounded-xl border border-accent/20 bg-accent/10 text-[11px] text-accent'
              />
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-bold text-light'>{creatorName}</div>
                <div className='truncate text-xs text-muted'>{deal.title}</div>
              </div>
              <DealStatusBadge
                status={deal.status as DealStatus}
                viewer='brand'
              />
            </Link>
          );
        })
      )}
    </div>
  );
}
