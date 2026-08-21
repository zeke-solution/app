'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchCreators } from '@/actions/creators';
import { sendCampaignOffers } from '@/actions/offers';
import { Button } from '@/components/ui/Button';
import { ShieldTick } from '@/components/ui/ShieldTick';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { NICHE_OPTIONS } from '@/lib/domain/constants';
import { fmtNum } from '@/lib/domain/format';
import type { CreatorRow } from '@/components/creators/CreatorCard';

interface CampaignLite {
  id: string;
  title: string;
  niche: string | null;
  platform: string | null;
  budget: number | null;
}

export function CampaignSendModal({
  campaign,
  onClose,
}: {
  campaign: CampaignLite;
  onClose: () => void;
}) {
  const [platform, setPlatform] = useState(campaign.platform ?? '');
  const [niche, setNiche] = useState(campaign.niche ?? '');
  const [query, setQuery] = useState('');
  const [shieldOnly, setShieldOnly] = useState(false);
  const [creators, setCreators] = useState<CreatorRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void searchCreators({ query, niche, shieldOnly }).then(setCreators);
  }, [query, niche, shieldOnly]);

  const influencerIds = Object.keys(selected).filter((id) => selected[id]);

  async function handleSend() {
    if (!influencerIds.length) {
      setError('Pick at least one creator.');
      return;
    }
    if (!platform.trim()) {
      setError('Add a platform before sending this campaign.');
      return;
    }
    setError('');
    setPending(true);
    const result = await sendCampaignOffers({
      campaignId: campaign.id,
      influencerIds,
      platform,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.push('/brand/campaigns');
    router.refresh();
  }

  return (
    <div
      className='fixed inset-0 z-50 flex h-[100dvh] items-stretch justify-center bg-black/65 p-0 sm:items-center sm:p-4'
      onClick={onClose}
    >
      <div
        className='flex h-full min-h-0 w-full flex-col gap-3.5 overflow-y-auto rounded-none border-0 bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-[520px] sm:rounded-2xl sm:border sm:p-5'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex flex-wrap items-center gap-2.5'>
          <div className='min-w-0 flex-1'>
            <div className='text-base font-bold text-light'>
              Send &quot;{campaign.title}&quot;
            </div>
            <div className='text-xs text-muted'>
              Each selected creator receives this brief as a separate offer.
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='text-2xl leading-none text-muted'
            aria-label='Close'
          >
            &times;
          </button>
        </div>

        <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
          <label>
            <span className='mb-1 block text-xs font-bold text-light'>
              Offer platform
            </span>
            <input
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              placeholder='Instagram Reel'
              className='w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none'
            />
          </label>
          <label>
            <span className='mb-1 block text-xs font-bold text-light'>
              Filter niche
            </span>
            <select
              value={niche}
              onChange={(event) => setNiche(event.target.value)}
              className='w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none'
            >
              <option value=''>All niches</option>
              {NICHE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search creators'
            className='min-w-0 flex-1 rounded-xl border border-border bg-dark px-3 py-2 text-[13px] text-light outline-none'
          />
          <label className='flex items-center gap-1.5 text-xs text-muted'>
            <input
              type='checkbox'
              checked={shieldOnly}
              onChange={(event) => setShieldOnly(event.target.checked)}
            />
            Shield only
          </label>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-dark sm:max-h-[42vh]'>
          {creators.length === 0 ? (
            <div className='p-5 text-center text-sm text-muted'>
              No creators match.
            </div>
          ) : (
            creators.map((creator) => {
              const name = creator.profiles?.display_name ?? 'Creator';
              return (
                <label
                  key={creator.id}
                  className='flex items-center gap-2.5 border-b border-border px-3.5 py-2.5 last:border-0'
                >
                  <input
                    type='checkbox'
                    checked={Boolean(selected[creator.id])}
                    onChange={(event) =>
                      setSelected((current) => ({
                        ...current,
                        [creator.id]: event.target.checked,
                      }))
                    }
                    className='h-4 w-4 accent-accent'
                  />
                  <ProfileAvatar
                    name={name}
                    avatarUrl={creator.profiles?.avatar_url}
                    className='h-8 w-8 rounded-full bg-accent/15 text-[11px] text-accent'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5 text-[13px] font-bold text-light'>
                      <span className='truncate'>{name}</span>
                      <ShieldTick
                        shieldActive={creator.shield_active}
                        shieldExpires={creator.shield_expires}
                      />
                    </div>
                    <div className='text-[11px] text-muted'>
                      {[creator.niche, creator.profiles?.location]
                        .filter(Boolean)
                        .join(' - ')}
                    </div>
                  </div>
                  <div className='flex-shrink-0 text-xs text-muted'>
                    {fmtNum(creator.ig_followers)}
                  </div>
                </label>
              );
            })
          )}
        </div>

        {error && (
          <div className='rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2 text-xs font-semibold text-danger'>
            {error}
          </div>
        )}
        <div className='flex flex-col gap-2.5 sm:flex-row sm:items-center'>
          <div className='flex-1 text-xs text-muted'>
            {influencerIds.length} selected - &#8377;{fmtNum(campaign.budget)} each
            - &#8377;{fmtNum((campaign.budget ?? 0) * influencerIds.length)} total
          </div>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={handleSend}>
            {pending ? 'Sending...' : 'Send offers'}
          </Button>
        </div>
      </div>
    </div>
  );
}
