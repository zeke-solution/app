import Link from "next/link";
import { AgreementIcon, DealsIcon, ShieldIcon } from "@/components/layout/icons";
import { buttonClassName } from "@/components/ui/Button";

const BENEFITS = [
  { icon: DealsIcon, title: "Payment clarity", detail: "Always know what is due" },
  { icon: AgreementIcon, title: "Structured terms", detail: "One deal, one record" },
  { icon: ShieldIcon, title: "Zeke Shield", detail: "Support when it matters" },
];

export function Hero() {
  return (
    <section className="brand-hero relative overflow-hidden bg-dark px-5 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-16 lg:pb-14 lg:pt-20">
      <div className="relative z-10 mx-auto max-w-[1180px]">
        <div className="max-w-[760px]">
          <div className="brand-chip mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:mb-6 sm:px-4 sm:py-2 sm:text-xs">
            <ShieldIcon width={14} height={14} /> Kerala&apos;s protected creator marketplace
          </div>
          <h1 className="max-w-[680px] text-[34px] font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-[58px] lg:text-[64px]">
            Create. Collaborate. Get paid.
            <span className="brand-gradient-text mt-1 block">With protection built in.</span>
          </h1>
          <p className="mt-4 max-w-[620px] text-[14px] leading-6 text-muted sm:mt-6 sm:text-[17px] sm:leading-7">
            Find the right partner, agree the terms, do the work, and get paid. Zeke keeps
            every decision on record, from the first offer to the final payment.
          </p>

          <div className="mt-7 hidden max-w-[650px] gap-3 sm:grid sm:grid-cols-3">
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

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:hidden">
            <Link
              href="/register"
              className={buttonClassName({ size: "md", fullWidth: true })}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className={buttonClassName({ variant: "outline", size: "md", fullWidth: true })}
            >
              Log in
            </Link>
          </div>
          <div className="mt-8 hidden gap-3 sm:flex">
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
            See how a deal works
          </Link>
        </div>

      </div>

    </section>
  );
}
