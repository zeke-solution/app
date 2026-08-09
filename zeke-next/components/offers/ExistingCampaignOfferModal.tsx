'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendCampaignOffers } from '@/actions/offers';
import { Button, buttonClassName } from '@/components/ui/Button';
import { fmtDateShort, fmtNum } from '@/lib/domain/format';

export interface DiscoverCampaign {
  id: string;
  title: string;
  niche: string | null;
  platform: string | null;
  budget: number | null;
  deadline: string | null;
  status: string | null;
}

export function ExistingCampaignOfferModal({
  influencerId,
  creatorName,
  campaigns,
  onClose,
}: {
  influencerId: string;
  creatorName: string;
  campaigns: DiscoverCampaign[];
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id ?? '');
  const [platform, setPlatform] = useState(campaigns[0]?.platform ?? '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [sentTitle, setSentTitle] = useState('');
  const router = useRouter();
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === selectedId,
  );

  async function handleSend() {
    if (!selectedCampaign) {
      setError('Choose a campaign.');
      return;
    }
    if (!platform.trim()) {
      setError('Add a platform before sending this campaign.');
      return;
    }
    setError('');
    setPending(true);
    const result = await sendCampaignOffers({
      campaignId: selectedCampaign.id,
      influencerIds: [influencerId],
      platform,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSentTitle(selectedCampaign.title);
    router.refresh();
  }

  return (
    <div
      className='fixed inset-0 z-50 flex h-[100dvh] items-stretch justify-center bg-black/65 p-0 sm:items-center sm:p-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='campaign-picker-title'
    >
      <div
        className='flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-none border-0 bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-[520px] sm:rounded-2xl sm:border sm:border-border sm:p-5'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <h2 id='campaign-picker-title' className='text-base font-black text-light'>
              {sentTitle ? 'Campaign sent' : 'Choose a campaign'}
            </h2>
            <p className='mt-1 text-xs text-muted'>
              {sentTitle
                ? sentTitle + ' was sent to ' + creatorName + '.'
                : 'Send an existing complete brief to ' + creatorName + '.'}
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border text-2xl leading-none text-muted'
            aria-label='Close'
          >
            &times;
          </button>
        </div>

        {sentTitle ? (
          <div className='mt-6 rounded-2xl border border-zgreen/25 bg-zgreen/[0.07] p-5 text-center'>
            <div className='text-sm font-black text-zgreen'>Offer delivered</div>
            <p className='mt-2 text-xs leading-5 text-muted'>
              The creator can review the brief and negotiate through chat before accepting.
            </p>
            <div className='mt-4 grid gap-2 sm:grid-cols-2'>
              <Button onClick={onClose}>Done</Button>
              <Link
                href='/brand/campaigns'
                className={buttonClassName({ variant: 'outline' })}
              >
                View campaigns
              </Link>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className='mt-6 rounded-2xl border border-border bg-dark p-6 text-center'>
            <div className='text-sm font-black text-light'>No active campaigns yet</div>
            <p className='mt-2 text-xs leading-5 text-muted'>
              Create and publish a complete campaign brief first. Then return to Discover and select it here.
            </p>
            <Link
              href='/brand/campaigns'
              className={buttonClassName({ className: 'mt-4' })}
            >
              Create campaign brief
            </Link>
          </div>
        ) : (
          <>
            <div className='mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto sm:max-h-[48vh]'>
              {campaigns.map((campaign) => {
                const checked = campaign.id === selectedId;
                return (
                  <label
                    key={campaign.id}
                    className={
                      'flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ' +
                      (checked
                        ? 'border-accent bg-accent/[0.08]'
                        : 'border-border bg-dark hover:border-accent/40')
                    }
                  >
                    <input
                      type='radio'
                      name='campaign'
                      value={campaign.id}
                      checked={checked}
                      onChange={() => {
                        setSelectedId(campaign.id);
                        setPlatform(campaign.platform ?? '');
                        setError('');
                      }}
                      className='mt-1 h-4 w-4 flex-shrink-0 accent-accent'
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-bold text-light'>
                        {campaign.title}
                      </span>
                      <span className='mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted'>
                        {campaign.platform && <span>{campaign.platform}</span>}
                        {campaign.niche && <span>{campaign.niche}</span>}
                        {campaign.deadline && (
                          <span>Due {fmtDateShort(campaign.deadline)}</span>
                        )}
                      </span>
                    </span>
                    <span className='flex-shrink-0 text-sm font-black text-gold'>
                      &#8377;{fmtNum(campaign.budget)}
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedCampaign && !selectedCampaign.platform && (
              <label className='mt-3'>
                <span className='mb-1 block text-xs font-bold text-light'>
                  Platform and format
                </span>
                <input
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                  placeholder='Instagram Reel'
                  className='w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none focus:border-accent'
                />
              </label>
            )}

            {error && (
              <div className='mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2 text-xs font-semibold text-danger'>
                {error}
              </div>
            )}

            <div className='mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end'>
              <Button variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={pending || !selectedCampaign} onClick={handleSend}>
                {pending ? 'Sending...' : 'Send selected campaign'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
