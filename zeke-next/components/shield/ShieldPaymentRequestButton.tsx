'use client';

import { useState } from 'react';
import { requestShield } from '@/actions/shield';
import { Button } from '@/components/ui/Button';

export function ShieldPaymentRequestButton({
  initiallyPending,
  paymentConnected,
}: {
  initiallyPending: boolean;
  paymentConnected: boolean;
}) {
  const [pending, setPending] = useState(initiallyPending);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleRequest() {
    setError('');
    setSubmitting(true);
    const result = await requestShield();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPending(true);
  }

  if (pending) {
    return (
      <div className='rounded-xl border border-gold/25 bg-gold/[0.08] px-4 py-3 text-sm font-semibold text-gold'>
        Activation request received. Zeke will verify payment before enabling Shield.
      </div>
    );
  }

  return (
    <div>
      <Button
        variant='gold'
        fullWidth
        disabled={submitting}
        onClick={handleRequest}
      >
        {submitting
          ? 'Submitting...'
          : paymentConnected
            ? 'I completed payment - request activation'
            : 'Request verified payment instructions'}
      </Button>
      {error && (
        <div className='mt-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger'>
          {error}
        </div>
      )}
    </div>
  );
}
