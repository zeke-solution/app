import Link from 'next/link';
import {
  DEAL_STATUS_META,
  type DealStatus,
  type Viewer,
} from '@/lib/domain/deal-status';
import { fmtNum } from '@/lib/domain/format';
import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

export function DealCard({
  href,
  counterpartName,
  counterpartAvatarUrl,
  title,
  platform,
  amount,
  status,
  viewer = 'creator',
}: {
  href: string;
  counterpartName: string;
  counterpartAvatarUrl?: string | null;
  title: string | null;
  platform: string | null;
  amount: number | null;
  status: DealStatus;
  viewer?: Viewer;
}) {
  const meta = DEAL_STATUS_META[status];

  return (
    <Link
      href={href}
      transitionTypes={['dashboard-forward']}
      className='mb-3 block rounded-2xl border p-4 transition-colors hover:border-accent/30 sm:p-5'
      style={{ borderColor: meta.border, background: meta.bg }}
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-center gap-2.5'>
          <ProfileAvatar
            name={counterpartName}
            avatarUrl={counterpartAvatarUrl}
            className='h-10 w-10 rounded-xl border border-accent/20 bg-accent/10 text-[11px] text-accent'
          />
          <div className='min-w-0'>
            <div className='truncate text-sm font-bold text-light'>
              {counterpartName}
            </div>
            <div className='text-xs text-muted'>
              {title} {platform ? '- ' + platform : ''}
            </div>
          </div>
        </div>
        <div className='grid w-full grid-cols-2 gap-2 border-t border-border/60 pt-3 sm:w-auto sm:min-w-[150px] sm:border-0 sm:pt-0 sm:text-right'>
          <div>
            <div className='text-[10px] font-bold uppercase tracking-wide text-muted'>Fee</div>
            <div className='mt-0.5 text-sm font-black' style={{ color: meta.color }}>
              &#8377;{fmtNum(amount)}
            </div>
          </div>
          <div>
            <div className='text-[10px] font-bold uppercase tracking-wide text-muted'>Status</div>
            <div className='mt-1'>
              <DealStatusBadge status={status} viewer={viewer} />
            </div>
          </div>
        </div>
      </div>
      <div className='mt-2 text-right text-xs font-semibold text-accent'>
        View deal &#8594;
      </div>
    </Link>
  );
}
