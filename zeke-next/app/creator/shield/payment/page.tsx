import Link from 'next/link';
import { requireRole } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { isShieldMembershipActive } from '@/lib/domain/shield-membership';
import { SHIELD_MONTHLY_PRICE_INR } from '@/lib/domain/constants';
import { ShieldPaymentRequestButton } from '@/components/shield/ShieldPaymentRequestButton';
import { ShieldIcon } from '@/components/layout/icons';
import { buttonClassName } from '@/components/ui/Button';

function securePaymentUrl() {
  const raw = process.env.ZEKE_SHIELD_PAYMENT_URL?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export default async function ShieldPaymentPage() {
  const session = await requireRole('influencer');
  const supabase = await createClient();
  const isShield = isShieldMembershipActive(session.inf);
  const { data: pendingRequest } = isShield
    ? { data: null }
    : await supabase
        .from('shield_requests')
        .select('id')
        .eq('influencer_id', session.id)
        .eq('status', 'pending')
        .maybeSingle();
  const paymentUrl = securePaymentUrl();

  return (
    <div className='mx-auto max-w-2xl'>
      <Link
        href='/creator/shield'
        className='text-xs font-semibold text-muted hover:text-accent'
      >
        Back to Zeke Shield
      </Link>

      <div className='mt-4 overflow-hidden rounded-3xl border border-gold/25 bg-card'>
        <div className='bg-gradient-to-br from-gold/[0.14] via-transparent to-accent/[0.08] p-5 sm:p-7'>
          <div className='flex items-start gap-3'>
            <span className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold'>
              <ShieldIcon width={23} height={23} />
            </span>
            <div className='min-w-0'>
              <div className='text-[11px] font-semibold uppercase tracking-[0.16em] text-gold'>
                Zeke Shield
              </div>
              <h1 className='mt-1 text-xl font-semibold text-light'>
                One month of creator-controlled support
              </h1>
            </div>
          </div>

          <div className='mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5'>
            <div>
              <div className='text-3xl font-semibold text-light'>
                &#8377;{SHIELD_MONTHLY_PRICE_INR}
              </div>
              <div className='mt-1 text-xs text-muted'>
                One month - no automatic renewal
              </div>
            </div>
            <span className='rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1 text-xs font-bold text-gold'>
              Creator plan
            </span>
          </div>

          <ul className='mt-5 space-y-2 text-sm leading-6 text-muted'>
            <li>Professional follow-ups and documented table talks</li>
            <li>Creator decides whether and when to seek legal help</li>
            <li>Access to independent legal-provider profiles</li>
            <li>No lawyer, court, filing or recovery costs included</li>
          </ul>
        </div>

        <div className='border-t border-border p-5 sm:p-7'>
          {isShield ? (
            <div className='rounded-xl border border-zgreen/25 bg-zgreen/[0.08] p-4'>
              <div className='text-sm font-semibold text-zgreen'>Shield is already active</div>
              <Link
                href='/creator/shield'
                className={buttonClassName({ variant: 'outline', size: 'sm', className: 'mt-3' })}
              >
                Open Shield dashboard
              </Link>
            </div>
          ) : (
            <>
              {paymentUrl ? (
                <div className='space-y-3'>
                  <a
                    href={paymentUrl}
                    target='_blank'
                    rel='noreferrer'
                    className={buttonClassName({ variant: 'gold', fullWidth: true })}
                  >
                    Continue to secure payment
                  </a>
                  <p className='text-center text-xs leading-5 text-muted'>
                    Payment opens with the connected provider. Zeke does not collect or store card details on this page.
                  </p>
                </div>
              ) : (
                <div className='mb-4 rounded-xl border border-border bg-dark p-4 text-xs leading-5 text-muted'>
                  Online checkout is not connected yet. Request verified payment instructions below. Never share a card PIN or OTP with anyone.
                </div>
              )}

              <div className={paymentUrl ? 'mt-5' : ''}>
                <ShieldPaymentRequestButton
                  initiallyPending={Boolean(pendingRequest)}
                  paymentConnected={Boolean(paymentUrl)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <p className='mt-4 text-center text-xs leading-5 text-muted'>
        Activation happens only after payment verification. Shield is support and coordination, not legal representation or a payment-recovery guarantee.
      </p>
    </div>
  );
}
