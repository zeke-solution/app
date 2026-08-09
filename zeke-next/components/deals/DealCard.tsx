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
      className='mb-3 block rounded-2xl border p-4 transition-colors hover:border-accent/30 sm:p-5'
      style={{ borderColor: meta.border, background: meta.bg }}
    >
      <div className='flex items-start justify-between gap-3'>
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
        <div className='flex-shrink-0 text-right'>
          <div className='text-sm font-black' style={{ color: meta.color }}>
            &#8377;{fmtNum(amount)}
          </div>
          <div className='mt-1'>
            <DealStatusBadge status={status} viewer={viewer} />
          </div>
        </div>
      </div>
      <div className='mt-2 text-right text-xs font-semibold text-accent'>
        View deal &#8594;
      </div>
    </Link>
  );
}
