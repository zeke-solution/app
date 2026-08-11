import Link from "next/link";
import { ShieldCoverage } from "@/components/shield/ShieldCoverage";
import { ShieldIcon } from "@/components/layout/icons";
import { buttonClassName } from "@/components/ui/Button";
import { SHIELD_MONTHLY_PRICE_INR } from "@/lib/domain/constants";

const STEPS = [
  ["1", "Open a dispute", "Your deal, messages, agreement, deliverables and payment history all stay connected to one case."],
  ["2", "Choose table talks", "Authorise Zeke to follow up with the brand. You decide how long this continues."],
  ["3", "Track every conversation", "Follow-ups, replies, settlement proposals and your instructions are recorded on the Shield timeline."],
  ["4", "Decide whether to escalate", "Legal action never starts automatically. You can keep talking, or explore independent legal help."],
  ["5", "Choose and hire directly", "Review factual provider profiles, contact your choice and agree scope and fees with them directly."],
  ["6", "Let Zeke coordinate", "After engagement and consent, Zeke organises authorised records and communication with your provider."],
];

export default function ShieldPage() {
  return (
    <main className="bg-white text-dark">
      <section className="relative overflow-hidden bg-dark px-5 py-20 text-white sm:px-6 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.25),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(217,119,6,0.16),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-[1080px] gap-10 lg:grid-cols-[1fr_0.65fr] lg:items-center">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-gold">Zeke Shield</div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              From unpaid deal to a clear next step - without losing control.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              Zeke handles professional follow-ups and table talks. If you decide to seek legal help, you choose and hire an independent provider while Zeke coordinates the authorised case record.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register?role=influencer" className={buttonClassName({ variant: "gold" })}>Join as a creator</Link>
              <Link href="/terms#shield" className={buttonClassName({ variant: "outline" })}>Read Shield terms</Link>
            </div>
          </div>
          <div className="rounded-[28px] border border-gold/30 bg-gold/[0.07] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold"><ShieldIcon width={29} height={29} /></span>
            <div className="mt-5 text-sm font-bold text-gold">Monthly Shield membership</div>
            <div className="mt-2 text-4xl font-black">₹{SHIELD_MONTHLY_PRICE_INR}<span className="text-sm font-medium text-muted"> / month</span></div>
            <div className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-muted">
              This price covers Zeke&apos;s Shield support and coordination. It does not include lawyer fees, court fees, filing charges or a guaranteed recovery.
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1080px]">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-purple">Creator-controlled process</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">How a Shield case works</h2>
            <p className="mt-3 text-sm leading-6 text-[#65617d]">Start with conversation. Move legally only when you decide.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(([number, title, text]) => (
              <article key={number} className="rounded-2xl border border-[#dedcf1] bg-[#faf9ff] p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple text-xs font-black text-white">{number}</span>
                <h3 className="mt-4 text-sm font-extrabold">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#65617d]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f4fc] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1080px] rounded-[28px] bg-dark p-6 text-white sm:p-10">
          <div className="mb-6 max-w-2xl">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gold">Plain-language scope</div>
            <h2 className="mt-2 text-2xl font-black">Know exactly what you are paying for.</h2>
          </div>
          <ShieldCoverage />
        </div>
      </section>

      <section className="px-5 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight">Support first. Legal action only by your choice.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#65617d]">
            Zeke is a case coordinator - not a law firm, legal representative, debt-recovery guarantee or provider-ranking service.
          </p>
          <Link href="/register?role=influencer" className={buttonClassName({ className: "mt-6" })}>Create a creator account</Link>
        </div>
      </section>
    </main>
  );
}
