'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { editOffer } from '@/actions/offers';
import { CAMPAIGN_PLATFORM_OPTIONS } from '@/lib/domain/constants';
import { fmtNum } from '@/lib/domain/format';
import { Button } from '@/components/ui/Button';

interface EditableOffer {
  dealId: string;
  title: string;
  platform: string;
  amount: number;
  deliverables: string;
  deadline: string;
}

export function NegotiationOfferControl({ offer }: { offer: EditableOffer }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className='mb-3 flex flex-shrink-0 items-center gap-3 rounded-xl bg-gold/[0.07] px-3.5 py-2.5'>
        <div className='min-w-0 flex-1'>
          <div className='text-xs font-black text-gold'>Offer under negotiation</div>
          <div className='mt-0.5 truncate text-[11px] text-muted'>
            {offer.platform} · &#8377;{fmtNum(offer.amount)} · Terms can be updated until accepted
          </div>
        </div>
        <Button variant='gold' size='sm' onClick={() => setOpen(true)}>
          Edit offer
        </Button>
      </div>
      {open && <EditOfferModal offer={offer} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditOfferModal({ offer, onClose }: { offer: EditableOffer; onClose: () => void }) {
  const [form, setForm] = useState(offer);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setPending(true);
    setError('');
    const result = await editOffer(form);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div
      className='fixed inset-0 z-50 flex h-[100dvh] items-stretch justify-center bg-black/65 p-0 sm:items-center sm:p-5'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-labelledby='edit-offer-title'
    >
      <div
        className='h-full w-full overflow-y-auto bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:h-auto sm:max-h-[92vh] sm:max-w-[480px] sm:rounded-2xl sm:p-6'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-3'>
          <div>
            <h2 id='edit-offer-title' className='text-base font-black text-light'>Edit offer</h2>
            <p className='mt-1 text-xs leading-5 text-muted'>The creator will be notified about the updated terms.</p>
          </div>
          <button
            type='button'
            aria-label='Close edit offer'
            onClick={onClose}
            className='flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-muted'
          >
            &times;
          </button>
        </div>

        <div className='mt-5 grid gap-3'>
          <OfferField label='Campaign title'>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className={fieldClass}
            />
          </OfferField>
          <div className='grid gap-3 sm:grid-cols-2'>
            <OfferField label='Platform and format'>
              <select
                value={form.platform}
                onChange={(event) => setForm({ ...form, platform: event.target.value })}
                className={fieldClass}
              >
                {!CAMPAIGN_PLATFORM_OPTIONS.includes(form.platform as (typeof CAMPAIGN_PLATFORM_OPTIONS)[number]) && (
                  <option value={form.platform}>{form.platform}</option>
                )}
                {CAMPAIGN_PLATFORM_OPTIONS.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
            </OfferField>
            <OfferField label='Creator fee'>
              <div className='relative'>
                <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted'>&#8377;</span>
                <input
                  type='number'
                  min='1'
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                  className={fieldClass + ' pl-8'}
                />
              </div>
            </OfferField>
          </div>
          <OfferField label='Deliverables'>
            <textarea
              rows={5}
              value={form.deliverables}
              onChange={(event) => setForm({ ...form, deliverables: event.target.value })}
              className={fieldClass + ' resize-y'}
            />
          </OfferField>
          <OfferField label='Delivery deadline'>
            <input
              type='date'
              value={form.deadline}
              onChange={(event) => setForm({ ...form, deadline: event.target.value })}
              className={fieldClass}
            />
          </OfferField>
        </div>

        {error && (
          <div className='mt-3 rounded-xl bg-danger/10 px-3.5 py-2.5 text-xs font-semibold text-danger'>
            {error}
          </div>
        )}
        <div className='mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end'>
          <Button variant='outline' onClick={onClose}>Cancel</Button>
          <Button disabled={pending} onClick={handleSave}>
            {pending ? 'Saving...' : 'Save and notify'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OfferField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className='mb-1.5 block text-xs font-bold text-light'>{label}</span>
      {children}
    </label>
  );
}

const fieldClass = 'w-full rounded-xl border border-border bg-dark px-3.5 py-2.5 text-[13px] text-light outline-none focus:border-accent';
