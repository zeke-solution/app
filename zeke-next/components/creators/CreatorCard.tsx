import type { ReactNode } from 'react';
import { fmtNum } from '@/lib/domain/format';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { ShieldTick } from '@/components/ui/ShieldTick';

export interface CreatorRow {
  id: string;
  niche: string | null;
  ig_followers: number | null;
  rating: number | null;
  shield_active: boolean | null;
  shield_expires: string | null;
  handle: string | null;
  profiles: {
    display_name?: string;
    location?: string;
    avatar_url?: string | null;
  } | null;
}

export function CreatorCard({
  creator,
  actions,
}: {
  creator: CreatorRow;
  actions?: ReactNode;
}) {
  const name = creator.profiles?.display_name ?? 'Creator';
  const loc = creator.profiles?.location ?? '';

  return (
    <div className='rounded-2xl border border-border bg-card p-4'>
      <div className='flex items-center gap-2.5'>
        <ProfileAvatar
          name={name}
          avatarUrl={creator.profiles?.avatar_url}
          className='h-10 w-10 rounded-full border border-accent/20 bg-accent/10 text-[11px] text-accent'
        />
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5'>
            <div className='truncate text-sm font-bold text-light'>{name}</div>
            <ShieldTick
              shieldActive={creator.shield_active}
              shieldExpires={creator.shield_expires}
            />
          </div>
          <div className='truncate text-xs text-muted'>
            {creator.handle ? '@' + creator.handle : creator.niche || ''}
          </div>
        </div>
        <div className='grid flex-shrink-0 grid-cols-2 gap-3 text-right'>
          <div>
            <div className='text-[9px] font-bold uppercase tracking-wide text-muted'>Followers</div>
            <div className='text-sm font-bold text-light'>
            {fmtNum(creator.ig_followers)}
            </div>
          </div>
          <div>
            <div className='text-[9px] font-bold uppercase tracking-wide text-muted'>Rating</div>
            <div className='text-xs font-bold text-gold'>
              &#9733; {creator.rating || '--'}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-2 text-xs text-muted'>
        {[creator.niche, loc].filter(Boolean).join(' - ')}
      </div>
      {actions}
    </div>
  );
}
