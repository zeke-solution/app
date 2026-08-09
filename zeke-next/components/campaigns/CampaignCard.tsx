import { fmtDateShort, fmtNum } from '@/lib/domain/format';
import { Badge } from '@/components/ui/Badge';

export interface CampaignRow {
  id: string;
  title: string;
  niche: string | null;
  platform: string | null;
  objective: string | null;
  deliverables: string | null;
  creator_requirements: string | null;
  description: string | null;
  budget: number | null;
  deadline: string | null;
  usage_rights: string | null;
  exclusivity: boolean;
  payment_terms: string | null;
  status: string | null;
}

export function CampaignCard({
  campaign,
  recipientSummary,
  children,
}: {
  campaign: CampaignRow;
  recipientSummary?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className='mb-3 rounded-2xl border border-border bg-card p-4 sm:p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <div className='text-sm font-bold text-light'>{campaign.title}</div>
          <div className='mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted'>
            {campaign.platform && (
              <span className='rounded-full bg-navy px-2 py-0.5'>
                {campaign.platform}
              </span>
            )}
            {campaign.niche && <span>{campaign.niche}</span>}
            {campaign.deadline && (
              <span>- Due {fmtDateShort(campaign.deadline)}</span>
            )}
          </div>
        </div>
        <div className='flex-shrink-0 text-right'>
          <div className='text-sm font-black text-gold'>
            &#8377;{fmtNum(campaign.budget)}
          </div>
          <div className='mt-1'>
            <Badge variant={campaign.status === 'active' ? 'green' : 'muted'}>
              {campaign.status ?? 'active'}
            </Badge>
          </div>
        </div>
      </div>

      {campaign.objective && (
        <p className='mt-3 text-xs leading-5 text-muted'>
          {campaign.objective}
        </p>
      )}

      {recipientSummary && (
        <div className='mt-3 rounded-xl border border-border bg-dark px-3 py-2 text-xs font-semibold text-light'>
          {recipientSummary}
        </div>
      )}

      {(campaign.deliverables ||
        campaign.creator_requirements ||
        campaign.description ||
        campaign.usage_rights ||
        campaign.payment_terms) && (
        <details className='mt-3 rounded-xl border border-border bg-dark px-3 py-2.5'>
          <summary className='cursor-pointer text-xs font-bold text-accent'>
            View full campaign brief
          </summary>
          <div className='mt-3 grid gap-3 text-xs sm:grid-cols-2'>
            <BriefItem label='Deliverables' value={campaign.deliverables} />
            <BriefItem
              label='Creator requirements'
              value={campaign.creator_requirements}
            />
            <BriefItem label='Creative direction' value={campaign.description} />
            <BriefItem label='Usage rights' value={campaign.usage_rights} />
            <BriefItem label='Payment terms' value={campaign.payment_terms} />
            <BriefItem
              label='Exclusivity'
              value={campaign.exclusivity ? 'Required' : 'Not required'}
            />
          </div>
        </details>
      )}

      {children}
    </article>
  );
}

function BriefItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <div className='font-bold text-light'>{label}</div>
      <div className='mt-0.5 whitespace-pre-wrap leading-5 text-muted'>
        {value}
      </div>
    </div>
  );
}
