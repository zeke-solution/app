import Link from "next/link";
import { AgreementIcon, DealsIcon, ShieldIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/Button";

const BENEFITS = [
  { icon: DealsIcon, title: "Payment clarity", detail: "Every milestone tracked" },
  { icon: AgreementIcon, title: "Structured terms", detail: "One deal, one record" },
  { icon: ShieldIcon, title: "Zeke Shield", detail: "Backup when needed" },
];

const TRUST = [
  ["1,200+", "Kerala creators"],
  ["340+", "Verified brands"],
  ["₹3.2Cr+", "Deals closed"],
  ["98%", "Disputes resolved"],
];

const BARS = [38, 52, 46, 68, 59, 82, 76];

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
            close campaigns—with every decision recorded from first offer to final payment.
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
            <Link href="/register?role=influencer" className="w-full sm:w-auto">
              <Button size="lg" fullWidth className="sm:w-auto">
                Creators: Join Zeke
              </Button>
            </Link>
            <Link href="/register?role=brand" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" fullWidth className="sm:w-auto">
                Brands: Get verified
              </Button>
            </Link>
          </div>
          <Link href="#how-it-works" className="mt-4 inline-flex text-xs font-semibold text-light transition-colors hover:text-cyan">
            See how every deal moves →
          </Link>
        </div>

        <div className="relative mx-auto min-h-[440px] w-full max-w-[520px] sm:min-h-[500px]">
          <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-accent/25 via-purple/20 to-pink/20 blur-[58px]" aria-hidden />
          <div className="brand-panel absolute inset-x-3 top-5 overflow-hidden rounded-[28px] border border-purple/35 p-5 shadow-[0_28px_90px_rgba(8,4,24,0.55)] sm:inset-x-7 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="brand-avatar flex h-11 w-11 items-center justify-center rounded-2xl border text-xs font-black">AC</div>
                <div>
                  <div className="text-sm font-bold text-white">Aura Campaign</div>
                  <div className="mt-0.5 text-[11px] text-muted">Instagram Reel · Active deal</div>
                </div>
              </div>
              <span className="rounded-full border border-zgreen/30 bg-zgreen/10 px-2.5 py-1 text-[10px] font-bold text-zgreen">ON TRACK</span>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Campaign reach</div>
                <div className="mt-1 text-3xl font-black text-white">125K</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Engagement</div>
                <div className="mt-1 text-3xl font-black text-cyan">7.2%</div>
              </div>
            </div>

            <div className="mt-6 flex h-32 items-end gap-2 rounded-2xl border border-white/[0.06] bg-dark/55 px-4 pb-4 pt-5">
              {BARS.map((height, index) => (
                <span
                  key={height + index}
                  className="flex-1 rounded-t-md bg-gradient-to-t from-accent via-purple to-pink shadow-[0_0_16px_rgba(168,85,247,0.24)]"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[["250K", "Impressions"], ["3.2K", "Link clicks"], ["₹45K", "Deal value"]].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-purple/15 bg-white/[0.035] p-3 text-center">
                  <div className="text-sm font-black text-white">{value}</div>
                  <div className="mt-1 text-[9px] text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-0 top-0 flex items-center gap-2 rounded-2xl border border-zgreen/25 bg-navy/95 px-3 py-2.5 shadow-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zgreen/15 text-zgreen"><DealsIcon width={16} height={16} /></span>
            <span><strong className="block text-[11px] text-white">Payment tracked</strong><span className="text-[9px] text-muted">Milestone confirmed</span></span>
          </div>
          <div className="absolute bottom-6 left-0 flex items-center gap-2 rounded-2xl border border-cyan/25 bg-navy/95 px-3 py-2.5 shadow-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan/15 text-cyan"><ShieldIcon width={16} height={16} /></span>
            <span><strong className="block text-[11px] text-white">Deal protected</strong><span className="text-[9px] text-muted">Recorded by Zeke</span></span>
          </div>
          <div className="absolute bottom-20 right-0 hidden items-center gap-2 rounded-2xl border border-pink/25 bg-navy/95 px-3 py-2.5 shadow-xl sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink/15 text-pink"><AgreementIcon width={16} height={16} /></span>
            <span><strong className="block text-[11px] text-white">Usage rights clear</strong><span className="text-[9px] text-muted">Terms in one place</span></span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 grid max-w-[1040px] grid-cols-2 overflow-hidden rounded-2xl border border-purple/20 bg-white/[0.035] sm:grid-cols-4">
        {TRUST.map(([value, label], index) => (
          <div key={label} className={`px-4 py-4 text-center ${index % 2 ? "border-l border-white/[0.06]" : ""} sm:border-l sm:first:border-l-0`}>
            <div className="text-lg font-black text-white">{value}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-muted">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
