import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { fmtNum } from '@/lib/domain/format';
import { ChatThread } from '@/components/chat/ChatThread';
import { CreatorChatControl } from '@/components/chat/CreatorChatControl';
import { BackIcon } from '@/components/layout/icons';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

export default async function CreatorChatPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from('deals')
    .select(
      'title,amount,status,influencer_id,creator_chat_closed_at,brand:profiles!deals_brand_id_fkey(display_name,avatar_url)',
    )
    .eq('id', dealId)
    .single();
  if (!deal || deal.influencer_id !== session.id) notFound();

  const { data: messages } = await supabase
    .from('deal_messages')
    .select('id,sender_id,msg_type,content,created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true });

  const brand = deal.brand as {
    display_name?: string;
    avatar_url?: string | null;
  } | null;
  const brandName = brand?.display_name ?? 'Brand';

  return (
    <div className='flex h-[calc(100dvh-160px)] min-h-0 flex-col md:h-[calc(100dvh-112px)]'>
      <div className='mb-4 flex flex-shrink-0 items-center gap-3 border-b border-border pb-4'>
        <Link
          href='/creator/chats'
          className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white/5 text-light'
        >
          <BackIcon />
        </Link>
        <ProfileAvatar
          name={brandName}
          avatarUrl={brand?.avatar_url}
          className='h-9 w-9 rounded-xl border border-accent/20 bg-accent/10 text-[11px] text-accent'
        />
        <div className='min-w-0 flex-1'>
          <div className='text-sm font-bold text-light'>{brandName}</div>
          <div className='text-[11px] text-muted'>
            {deal.title} - &#8377;{fmtNum(deal.amount)}
          </div>
        </div>
        {deal.status === 'negotiating' ? (
          <Link
            href='/creator/offers'
            className='flex-shrink-0 text-[11px] font-semibold text-gold'
          >
            Offer inbox
          </Link>
        ) : (
          <Link
            href={'/creator/deals/' + dealId}
            className='flex-shrink-0 text-[11px] font-semibold text-muted'
          >
            View deal
          </Link>
        )}
      </div>
      {deal.status === 'completed' && (
        <CreatorChatControl
          dealId={dealId}
          initiallyClosed={Boolean(deal.creator_chat_closed_at)}
        />
      )}
      <ChatThread
        dealId={dealId}
        currentUserId={session.id}
        counterpartLabel={brandName}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
