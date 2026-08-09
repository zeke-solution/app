'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCampaign, closeCampaign } from '@/actions/campaigns';
import {
  CampaignCard,
  type CampaignRow,
} from '@/components/campaigns/CampaignCard';
import { CampaignSendModal } from '@/components/offers/CampaignSendModal';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClassName } from '@/components/ui/Button';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import {
  CAMPAIGN_PLATFORM_OPTIONS,
  NICHE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  USAGE_RIGHTS_OPTIONS,
} from '@/lib/domain/constants';
import { dealStatusLabel, type DealStatus } from '@/lib/domain/deal-status';
import { fmtDateShort, fmtNum } from '@/lib/domain/format';
import { createCampaignSchema } from '@/lib/validation/campaign.schema';

export interface CampaignDeliveryRow {
  id: string;
  campaign_id: string | null;
  title: string;
  platform: string | null;
  amount: number | null;
  status: string;
  created_at: string | null;
  creator: {
    display_name?: string;
    avatar_url?: string | null;
  } | null;
}

interface CampaignFormState {
  title: string;
  niche: string;
  platform: string;
  objective: string;
  deliverables: string;
  creatorRequirements: string;
  description: string;
  budget: string;
  deadline: string;
  usageRights: string;
  exclusivity: boolean;
  paymentTerms: string;
}

const EMPTY_FORM: CampaignFormState = {
  title: '',
  niche: '',
  platform: '',
  objective: '',
  deliverables: '',
  creatorRequirements: '',
  description: '',
  budget: '',
  deadline: '',
  usageRights: '',
  exclusivity: false,
  paymentTerms: '',
};

export function CampaignsPageClient({
  campaigns,
  deliveries,
}: {
  campaigns: CampaignRow[];
  deliveries: CampaignDeliveryRow[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [sendTarget, setSendTarget] = useState<CampaignRow | null>(null);
  const directSends = deliveries.filter((delivery) => !delivery.campaign_id);

  return (
    <div>
      <div className='mb-5 flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-xl font-black text-light'>Campaigns</h1>
          <p className='mt-1 text-xs text-muted'>
            Build complete briefs, send them to creators, and track every offer.
          </p>
        </div>
        <Button size='sm' onClick={() => setShowForm((open) => !open)}>
          {showForm ? 'Close form' : '+ Create campaign'}
        </Button>
      </div>

      {showForm && <CreateCampaignForm onDone={() => setShowForm(false)} />}

      {directSends.length > 0 && (
        <section className='mb-6'>
          <SectionHeading
            title='Direct creator campaigns'
            count={directSends.length}
            description='One-to-one campaigns sent from Discover Creators.'
          />
          <div className='space-y-3'>
            {directSends.map((delivery) => (
              <DirectCampaignCard key={delivery.id} delivery={delivery} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          title='Published campaign briefs'
          count={campaigns.length}
          description='Reusable briefs that can be sent to one or more creators.'
        />
        {campaigns.length === 0 ? (
          <div className='rounded-2xl border border-border bg-card p-8 text-center sm:p-12'>
            <div className='text-sm font-bold text-light'>
              No published campaign briefs yet
            </div>
            <p className='mx-auto mt-2 max-w-md text-xs leading-5 text-muted'>
              Create a complete brief so creators receive the goal, content
              requirements, commercial terms, and deadline before accepting.
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const recipients = deliveries.filter(
              (delivery) => delivery.campaign_id === campaign.id,
            );
            return (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                recipientSummary={recipientSummary(recipients)}
              >
                {campaign.status === 'active' ? (
                  <div className='mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row'>
                    <Button
                      size='sm'
                      className='flex-1'
                      onClick={() => setSendTarget(campaign)}
                    >
                      Send to creators
                    </Button>
                    <CloseCampaignButton campaignId={campaign.id} />
                  </div>
                ) : (
                  <div className='mt-3 border-t border-border pt-3 text-xs text-muted'>
                    This brief is closed and can no longer be sent.
                  </div>
                )}
              </CampaignCard>
            );
          })
        )}
      </section>

      {sendTarget && (
        <CampaignSendModal
          campaign={sendTarget}
          onClose={() => setSendTarget(null)}
        />
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
  count,
}: {
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className='mb-3 flex items-end justify-between gap-3'>
      <div>
        <h2 className='text-sm font-bold text-light'>{title}</h2>
        <p className='mt-0.5 text-xs text-muted'>{description}</p>
      </div>
      <span className='rounded-full border border-border bg-card px-2.5 py-1 text-xs font-bold text-muted'>
        {count}
      </span>
    </div>
  );
}

function DirectCampaignCard({
  delivery,
}: {
  delivery: CampaignDeliveryRow;
}) {
  const creatorName = delivery.creator?.display_name ?? 'Creator';
  const status = delivery.status as DealStatus;
  const href =
    status === 'negotiating'
      ? '/brand/chats/' + delivery.id
      : '/brand/deals/' + delivery.id;

  return (
    <article className='rounded-2xl border border-border bg-card p-4 sm:p-5'>
      <div className='flex items-start gap-3'>
        <ProfileAvatar
          name={creatorName}
          avatarUrl={delivery.creator?.avatar_url}
          className='h-10 w-10 rounded-full border border-accent/20 bg-accent/10 text-[11px] text-accent'
        />
        <div className='min-w-0 flex-1'>
          <div className='text-sm font-bold text-light'>{delivery.title}</div>
          <div className='mt-0.5 text-xs text-muted'>
            Sent to {creatorName}
            {delivery.platform ? ' - ' + delivery.platform : ''}
          </div>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Badge variant={statusBadge(status)}>
              {dealStatusLabel(status, 'brand')}
            </Badge>
            {delivery.created_at && (
              <span className='text-xs text-muted'>
                Sent {fmtDateShort(delivery.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className='flex-shrink-0 text-right'>
          <div className='text-sm font-black text-gold'>
            &#8377;{fmtNum(delivery.amount)}
          </div>
        </div>
      </div>
      <Link
        href={href}
        className={buttonClassName({
          variant: 'outline',
          size: 'sm',
          className: 'mt-3 w-full',
        })}
      >
        {status === 'negotiating' ? 'Open negotiation chat' : 'View campaign'}
      </Link>
    </article>
  );
}

function recipientSummary(recipients: CampaignDeliveryRow[]) {
  if (recipients.length === 0) return 'Not sent to any creators yet';
  const negotiating = recipients.filter(
    (delivery) => delivery.status === 'negotiating',
  ).length;
  const declined = recipients.filter(
    (delivery) => delivery.status === 'cancelled',
  ).length;
  const accepted = recipients.length - negotiating - declined;
  const parts = [
    recipients.length + (recipients.length === 1 ? ' creator' : ' creators'),
    negotiating ? negotiating + ' negotiating' : '',
    accepted ? accepted + ' accepted' : '',
    declined ? declined + ' declined or cancelled' : '',
  ].filter(Boolean);
  return parts.join(' - ');
}

function statusBadge(
  status: DealStatus,
): 'accent' | 'gold' | 'green' | 'muted' | 'danger' {
  if (status === 'negotiating') return 'gold';
  if (status === 'completed') return 'green';
  if (status === 'cancelled') return 'muted';
  if (status === 'disputed') return 'danger';
  return 'accent';
}

function CloseCampaignButton({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    if (!confirm('Close this campaign brief?')) return;
    setPending(true);
    const result = await closeCampaign(campaignId);
    setPending(false);
    if (!result.ok) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Button
      variant='outline'
      size='sm'
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? 'Closing...' : 'Close brief'}
    </Button>
  );
}

function CreateCampaignForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CampaignFormState, string>>
  >({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  function update<K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      ...form,
      budget: Number(form.budget),
    };
    const parsed = createCampaignSchema.safeParse(input);
    if (!parsed.success) {
      const nextErrors: Partial<
        Record<keyof CampaignFormState, string>
      > = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof CampaignFormState | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      });
      setFieldErrors(nextErrors);
      setError('Review the highlighted fields before publishing.');
      return;
    }
    if (form.deadline < today) {
      setFieldErrors({ deadline: 'Choose today or a future date.' });
      setError('Review the highlighted fields before publishing.');
      return;
    }

    setPending(true);
    const result = await createCampaign(parsed.data);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm(EMPTY_FORM);
    onDone();
    router.refresh();
  }

  const basicsReady = Boolean(
    form.title && form.niche && form.platform && form.objective,
  );
  const contentReady = Boolean(form.deliverables);
  const termsReady = Boolean(
    form.budget &&
      form.deadline &&
      form.usageRights &&
      form.paymentTerms,
  );

  return (
    <form
      onSubmit={handleSubmit}
      className='mb-6 rounded-2xl border border-accent/20 bg-card p-4 sm:p-5'
    >
      <div className='mb-5'>
        <div className='text-base font-black text-light'>
          Create a campaign brief
        </div>
        <p className='mt-1 text-xs leading-5 text-muted'>
          These fields become the shared source of truth before a creator
          accepts the campaign.
        </p>
      </div>

      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]'>
        <div className='space-y-5'>
          <FormSection number='1' title='Campaign basics'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <FormField
                label='Campaign title'
                required
                error={fieldErrors.title}
              >
                <input
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder='Eid collection launch'
                  className={fieldClass(fieldErrors.title)}
                />
              </FormField>
              <FormField
                label='Creator niche'
                required
                error={fieldErrors.niche}
              >
                <select
                  value={form.niche}
                  onChange={(event) => update('niche', event.target.value)}
                  className={fieldClass(fieldErrors.niche)}
                >
                  <option value=''>Select niche</option>
                  {NICHE_OPTIONS.map((niche) => (
                    <option key={niche}>{niche}</option>
                  ))}
                </select>
              </FormField>
              <FormField
                label='Content platform'
                required
                error={fieldErrors.platform}
              >
                <select
                  value={form.platform}
                  onChange={(event) => update('platform', event.target.value)}
                  className={fieldClass(fieldErrors.platform)}
                >
                  <option value=''>Select platform</option>
                  {CAMPAIGN_PLATFORM_OPTIONS.map((platform) => (
                    <option key={platform}>{platform}</option>
                  ))}
                </select>
              </FormField>
              <FormField
                label='Campaign goal'
                required
                hint='What result should this campaign create?'
                error={fieldErrors.objective}
                wide
              >
                <textarea
                  value={form.objective}
                  onChange={(event) => update('objective', event.target.value)}
                  placeholder='Build awareness and drive qualified visits to the launch page.'
                  rows={3}
                  className={fieldClass(fieldErrors.objective)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection number='2' title='Content and creator fit'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <FormField
                label='Deliverables'
                required
                hint='Include format, quantity, length, tags, and revisions.'
                error={fieldErrors.deliverables}
                wide
              >
                <textarea
                  value={form.deliverables}
                  onChange={(event) =>
                    update('deliverables', event.target.value)
                  }
                  placeholder={'1 Instagram Reel, 30-45 seconds\n3 story frames with link sticker\n1 revision round'}
                  rows={4}
                  className={fieldClass(fieldErrors.deliverables)}
                />
              </FormField>
              <FormField
                label='Creator requirements'
                hint='Audience, location, language, or content-fit needs.'
                error={fieldErrors.creatorRequirements}
              >
                <textarea
                  value={form.creatorRequirements}
                  onChange={(event) =>
                    update('creatorRequirements', event.target.value)
                  }
                  placeholder='UAE-based fashion creator with primarily GCC audience.'
                  rows={4}
                  className={fieldClass(fieldErrors.creatorRequirements)}
                />
              </FormField>
              <FormField
                label='Creative direction'
                hint='Key message, tone, required points, and restrictions.'
                error={fieldErrors.description}
              >
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    update('description', event.target.value)
                  }
                  placeholder='Keep the tone warm and premium. Show product details clearly.'
                  rows={4}
                  className={fieldClass(fieldErrors.description)}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection number='3' title='Commercial terms'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <FormField
                label='Creator fee'
                required
                hint='Amount offered to each selected creator.'
                error={fieldErrors.budget}
              >
                <div className='relative'>
                  <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted'>
                    &#8377;
                  </span>
                  <input
                    type='number'
                    min='1'
                    value={form.budget}
                    onChange={(event) => update('budget', event.target.value)}
                    placeholder='45000'
                    className={fieldClass(fieldErrors.budget) + ' pl-8'}
                  />
                </div>
              </FormField>
              <FormField
                label='Delivery deadline'
                required
                error={fieldErrors.deadline}
              >
                <input
                  type='date'
                  min={today}
                  value={form.deadline}
                  onChange={(event) => update('deadline', event.target.value)}
                  className={fieldClass(fieldErrors.deadline)}
                />
              </FormField>
              <FormField
                label='Usage rights'
                required
                error={fieldErrors.usageRights}
              >
                <select
                  value={form.usageRights}
                  onChange={(event) =>
                    update('usageRights', event.target.value)
                  }
                  className={fieldClass(fieldErrors.usageRights)}
                >
                  <option value=''>Select usage rights</option>
                  {USAGE_RIGHTS_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </FormField>
              <FormField
                label='Payment timeline'
                required
                error={fieldErrors.paymentTerms}
              >
                <select
                  value={form.paymentTerms}
                  onChange={(event) =>
                    update('paymentTerms', event.target.value)
                  }
                  className={fieldClass(fieldErrors.paymentTerms)}
                >
                  <option value=''>Select payment timeline</option>
                  {PAYMENT_TERMS_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </FormField>
              <label className='flex items-start gap-3 rounded-xl border border-border bg-dark p-3 sm:col-span-2'>
                <input
                  type='checkbox'
                  checked={form.exclusivity}
                  onChange={(event) =>
                    update('exclusivity', event.target.checked)
                  }
                  className='mt-0.5 h-4 w-4 accent-accent'
                />
                <span>
                  <span className='block text-xs font-bold text-light'>
                    Category exclusivity required
                  </span>
                  <span className='mt-0.5 block text-xs leading-5 text-muted'>
                    Confirm the exact category and period with the creator in
                    chat before acceptance.
                  </span>
                </span>
              </label>
            </div>
          </FormSection>
        </div>

        <aside className='h-fit rounded-2xl border border-border bg-dark p-4 lg:sticky lg:top-20'>
          <div className='text-xs font-black uppercase tracking-[0.1em] text-muted'>
            Brief readiness
          </div>
          <div className='mt-3 space-y-2'>
            <ReadinessItem ready={basicsReady} label='Goal and audience' />
            <ReadinessItem ready={contentReady} label='Content deliverables' />
            <ReadinessItem ready={termsReady} label='Commercial terms' />
          </div>
          <p className='mt-3 text-xs leading-5 text-muted'>
            Zeke validates required fields again on the server before
            publishing.
          </p>
        </aside>
      </div>

      {error && (
        <div className='mt-4 rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2.5 text-xs font-semibold text-danger'>
          {error}
        </div>
      )}

      <div className='mt-5 flex flex-col-reverse gap-2.5 border-t border-border pt-4 sm:flex-row sm:justify-end'>
        <Button type='button' variant='outline' onClick={onDone}>
          Cancel
        </Button>
        <Button type='submit' disabled={pending}>
          {pending ? 'Publishing...' : 'Publish campaign brief'}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className='mb-3 flex items-center gap-2'>
        <span className='flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-black text-white'>
          {number}
        </span>
        <h3 className='text-sm font-black text-light'>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FormField({
  label,
  hint,
  error,
  required,
  wide,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? 'sm:col-span-2' : ''}>
      <span className='mb-1.5 block text-xs font-bold text-light'>
        {label}
        {required && <span className='ml-1 text-danger'>*</span>}
      </span>
      {children}
      {error ? (
        <span className='mt-1 block text-xs font-semibold text-danger'>
          {error}
        </span>
      ) : hint ? (
        <span className='mt-1 block text-xs leading-5 text-muted'>{hint}</span>
      ) : null}
    </label>
  );
}

function ReadinessItem({
  ready,
  label,
}: {
  ready: boolean;
  label: string;
}) {
  return (
    <div className='flex items-center gap-2 text-xs'>
      <span
        className={
          'flex h-5 w-5 items-center justify-center rounded-full font-black ' +
          (ready
            ? 'bg-zgreen/15 text-zgreen'
            : 'bg-border text-muted')
        }
      >
        {ready ? '✓' : '·'}
      </span>
      <span className={ready ? 'font-semibold text-light' : 'text-muted'}>
        {label}
      </span>
    </div>
  );
}

function fieldClass(error?: string) {
  return (
    'w-full rounded-xl border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none transition-colors focus:border-accent ' +
    (error ? 'border-danger' : 'border-border')
  );
}
