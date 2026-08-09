import Link from "next/link";
import { AgreementIcon, CampaignIcon, DealsIcon, ShieldIcon } from "@/components/layout/icons";
import { buttonClassName } from "@/components/ui/Button";

const BENEFITS = [
  { icon: DealsIcon, title: "Payment clarity", detail: "Every milestone tracked" },
  { icon: AgreementIcon, title: "Structured terms", detail: "One deal, one record" },
  { icon: ShieldIcon, title: "Zeke Shield", detail: "Backup when needed" },
];

const DEAL_STEPS = [
  {
    icon: AgreementIcon,
    title: "Offer agreed",
    detail: "Deliverables and usage rights recorded",
    state: "Complete",
    stateClass: "border-zgreen/25 bg-zgreen/10 text-zgreen",
  },
  {
    icon: CampaignIcon,
    title: "Content approved",
    detail: "Brand approval saved in the deal",
    state: "Complete",
    stateClass: "border-zgreen/25 bg-zgreen/10 text-zgreen",
  },
  {
    icon: DealsIcon,
    title: "Payment tracked",
    detail: "Final milestone awaiting confirmation",
    state: "Current",
    stateClass: "border-cyan/25 bg-cyan/10 text-cyan",
  },
];

export function Hero() {
  return (
    <section className="brand-hero relative overflow-hidden bg-dark px-5 pb-10 pt-14 sm:px-6 sm:pt-20 lg:pb-14">
      <div className="relative z-10 mx-auto grid max-w-[1180px] items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12">
        <div>
          <div className="brand-chip mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold">
            <ShieldIcon width={14} height={14} /> Kerala&apos;s protected creator marketplace
          </div>
          <h1 className="max-w-[680px] text-[38px] font-extrabold leading-[1.08] tracking-[-0.045em] text-white sm:text-[58px] lg:text-[64px]">
            Create. Collaborate. Get paid.
            <span className="brand-gradient-text mt-1 block">With protection built in.</span>
          </h1>
          <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-muted sm:text-[17px]">
            Zeke gives creators and brands one trusted place to discover, agree, deliver, and
            close campaigns - with every decision recorded from first offer to final payment.
          </p>

          <div className="mt-7 grid max-w-[650px] gap-3 sm:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-purple/20 bg-white/[0.035] px-3.5 py-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/25 via-purple/20 to-pink/20 text-cyan">
                  <Icon width={18} height={18} />
                </span>
                <span>
                  <span className="block text-xs font-bold text-white">{title}</span>
                  <span className="mt-0.5 block text-[10px] text-muted">{detail}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register?role=influencer"
              className={buttonClassName({ size: "lg", fullWidth: true, className: "sm:w-auto" })}
            >
              Creators: Join Zeke
            </Link>
            <Link
              href="/register?role=brand"
              className={buttonClassName({ variant: "outline", size: "lg", fullWidth: true, className: "sm:w-auto" })}
            >
              Brands: Get verified
            </Link>
          </div>
          <Link href="#how-it-works" className="mt-4 inline-flex text-xs font-semibold text-light transition-colors hover:text-cyan">
            See how every deal moves →
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-accent/25 via-purple/20 to-pink/20 blur-[58px]" aria-hidden />
          <div className="brand-panel relative overflow-hidden rounded-[28px] border border-purple/35 p-5 shadow-[0_28px_90px_rgba(8,4,24,0.55)] sm:p-6">
            <div className="flex items-center justify-between gap-4 pb-1">
              <div className="flex items-center gap-3">
                <div className="brand-avatar flex h-11 w-11 items-center justify-center rounded-2xl border text-white">
                  <CampaignIcon width={20} height={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Brand Campaign</div>
                  <div className="mt-0.5 text-[11px] text-muted">Instagram Reel - Active deal</div>
                </div>
              </div>
              <span className="rounded-full border border-zgreen/30 bg-zgreen/10 px-2.5 py-1 text-[10px] font-bold text-zgreen">ON TRACK</span>
            </div>

            <div className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Deal progress</div>
            <div className="mt-3 space-y-2.5">
              {DEAL_STEPS.map(({ icon: Icon, title, detail, state, stateClass }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-dark/55 p-3.5">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-purple/20 bg-gradient-to-br from-accent/20 via-purple/15 to-pink/15 text-cyan">
                    <Icon width={18} height={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white">{title}</span>
                    <span className="mt-0.5 block text-[10px] leading-4 text-muted">{detail}</span>
                  </span>
                  <span className={"flex-shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wide " + stateClass}>{state}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-purple/20 bg-white/[0.04] p-4">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">Agreed value</div>
                <div className="mt-1 text-xl font-black text-white">₹45,000</div>
              </div>
              <span className="rounded-full border border-cyan/25 bg-cyan/10 px-3 py-1.5 text-[10px] font-bold text-cyan">Payment trail active</span>
            </div>

            <div className="mt-4 flex items-center gap-3 pt-1">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple">
                <ShieldIcon width={18} height={18} />
              </span>
              <span>
                <strong className="block text-[11px] text-white">Protection status recorded</strong>
                <span className="mt-0.5 block text-[9px] text-muted">The creator controls the next step if a problem arises</span>
              </span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
