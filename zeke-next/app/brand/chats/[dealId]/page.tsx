import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { fmtNum } from '@/lib/domain/format';
import { ChatThread } from '@/components/chat/ChatThread';
import { BackIcon } from '@/components/layout/icons';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { NegotiationOfferControl } from '@/components/offers/NegotiationOfferControl';

export default async function BrandChatPage({
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
      'title,platform,amount,deliverables,deadline,status,brand_id,creator_chat_closed_at,creator:profiles!deals_influencer_id_fkey(display_name,avatar_url)',
    )
    .eq('id', dealId)
    .single();
  if (!deal || deal.brand_id !== session.id) notFound();

  const { data: messages } = await supabase
    .from('deal_messages')
    .select('id,sender_id,msg_type,content,created_at')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true });

  const creator = deal.creator as {
    display_name?: string;
    avatar_url?: string | null;
  } | null;
  const creatorName = creator?.display_name ?? 'Creator';
  const creatorClosedChat =
    deal.status === 'completed' && Boolean(deal.creator_chat_closed_at);

  return (
    <div className='flex h-[calc(100dvh-160px)] min-h-0 flex-col md:h-[calc(100dvh-112px)]'>
      <div className='mb-4 flex flex-shrink-0 items-center gap-3 border-b border-border pb-4'>
        <Link
          href='/brand/partnerships'
          className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white/5 text-light'
        >
          <BackIcon />
        </Link>
        <ProfileAvatar
          name={creatorName}
          avatarUrl={creator?.avatar_url}
          className='h-9 w-9 rounded-xl border border-accent/20 bg-accent/10 text-[11px] text-accent'
        />
        <div className='min-w-0 flex-1'>
          <div className='text-sm font-bold text-light'>{creatorName}</div>
          <div className='text-[11px] text-muted'>
            {deal.title} - &#8377;{fmtNum(deal.amount)}
          </div>
        </div>
        {deal.status === 'negotiating' ? (
          <span className='flex-shrink-0 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gold'>
            Negotiation
          </span>
        ) : (
          <Link
            href={'/brand/deals/' + dealId}
            className='flex-shrink-0 text-[11px] font-semibold text-muted'
          >
            View deal
          </Link>
        )}
      </div>
      {deal.status === 'negotiating' && (
        <NegotiationOfferControl
          offer={{
            dealId,
            title: deal.title,
            platform: deal.platform ?? '',
            amount: deal.amount ?? 0,
            deliverables: deal.deliverables ?? '',
            deadline: deal.deadline ?? '',
          }}
        />
      )}
      <ChatThread
        dealId={dealId}
        currentUserId={session.id}
        counterpartLabel={creatorName}
        initialMessages={messages ?? []}
        canSend={!creatorClosedChat}
        blockedMessage='The creator closed messaging after this deal was completed. The conversation remains available as a record.'
      />
    </div>
  );
}
