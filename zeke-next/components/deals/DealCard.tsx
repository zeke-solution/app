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
      className='mb-2 block rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-accent/35 hover:bg-navy'
    >
      <div className='flex flex-col gap-3 sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_9rem_1.5rem] sm:items-center sm:gap-4'>
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
            <div className='truncate text-sm text-muted'>
              {title} {platform ? '- ' + platform : ''}
            </div>
          </div>
        </div>
        <div>
          <div className='text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only'>Fee</div>
          <div className='mt-0.5 text-sm font-bold text-light sm:mt-0' style={{ color: meta.color }}>
            &#8377;{fmtNum(amount)}
          </div>
        </div>
        <div>
          <div className='text-xs font-semibold uppercase tracking-wide text-muted sm:sr-only'>Status</div>
          <div className='mt-1 sm:mt-0'>
            <DealStatusBadge status={status} viewer={viewer} />
          </div>
        </div>
        <div className='hidden text-right text-lg text-muted sm:block' aria-hidden>
          &#8250;
        </div>
      </div>
    </Link>
  );
}

export function DealListHeader() {
  return (
    <div className='mb-2 hidden grid-cols-[minmax(0,1fr)_7rem_9rem_1.5rem] gap-4 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:grid'>
      <div>Campaign</div>
      <div>Fee</div>
      <div>Status</div>
      <div />
    </div>
  );
}
