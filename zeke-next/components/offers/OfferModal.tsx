'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOffer } from '@/actions/offers';
import { Button } from '@/components/ui/Button';

export function OfferModal({
  influencerId,
  creatorName,
  onClose,
}: {
  influencerId: string;
  creatorName: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [amount, setAmount] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setError('');
    setPending(true);
    const result = await sendOffer({
      influencerId,
      title,
      platform,
      amount: Number(amount),
      deliverables,
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
      className='fixed inset-0 z-50 flex h-[100dvh] items-stretch justify-center bg-black/65 p-0 sm:items-center sm:p-5'
      onClick={onClose}
    >
      <div
        className='h-full w-full overflow-y-auto rounded-none border-0 bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-[420px] sm:rounded-2xl sm:border sm:p-6'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='mb-1 text-base font-bold text-light'>
          Send direct campaign
        </div>
        <div className='mb-4 text-xs text-muted'>To {creatorName}</div>
        <div className='flex flex-col gap-3'>
          <label>
            <span className='mb-1 block text-xs font-bold text-light'>
              Campaign title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='Eid collection Reel'
              className='w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none'
            />
          </label>
          <label>
            <span className='mb-1 block text-xs font-bold text-light'>
              Platform and format
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
              Creator fee
            </span>
            <input
              type='number'
              min='1'
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder='Amount in ₹'
              className='w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none'
            />
          </label>
          <label>
            <span className='mb-1 block text-xs font-bold text-light'>
              Deliverables
            </span>
            <textarea
              value={deliverables}
              onChange={(event) => setDeliverables(event.target.value)}
              placeholder='1 Reel, 3 story frames, and 1 revision round'
              rows={3}
              className='w-full resize-y rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none'
            />
          </label>
        </div>
        {error && (
          <div className='mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3.5 py-2 text-xs font-semibold text-danger'>
            {error}
          </div>
        )}
        <div className='mt-4 flex gap-2.5'>
          <Button className='flex-1' disabled={pending} onClick={handleSubmit}>
            {pending ? 'Sending...' : 'Send campaign'}
          </Button>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
