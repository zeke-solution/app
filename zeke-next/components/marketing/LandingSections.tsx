import Link from "next/link";
import {
  AgreementIcon,
  CampaignIcon,
  ChatIcon,
  DealsIcon,
  DiscoverIcon,
  ProfileIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/layout/icons";
import { buttonClassName } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";

const PROBLEMS = [
  { icon: DealsIcon, title: "Late payments", text: "Work delivered. Payment delayed - or never clearly confirmed." },
  { icon: CampaignIcon, title: "Content reused", text: "A post becomes an ad without an agreed usage window." },
  { icon: AgreementIcon, title: "Contract gaps", text: "Important terms stay scattered across chats and voice notes." },
  { icon: ChatIcon, title: "Terms change", text: "Deliverables move after the creator has already started." },
  { icon: ShieldIcon, title: "No clear recourse", text: "Neither side knows what happens when a deal goes wrong." },
  { icon: UsersIcon, title: "Trust breaks", text: "Good creators and good brands both lose time and confidence." },
];

const STEPS = [
  { icon: ProfileIcon, title: "Join & verify", text: "Create your profile and tell Zeke who you are." },
  { icon: DiscoverIcon, title: "Discover", text: "Brands find creators or creators receive structured offers." },
  { icon: ShieldIcon, title: "Verify the fit", text: "Profiles, requirements, budgets, and timelines stay visible." },
  { icon: ChatIcon, title: "Agree together", text: "Chat, negotiate, and lock the campaign terms in one place." },
  { icon: CampaignIcon, title: "Create & review", text: "Submit work, receive feedback, and publish the final link." },
  { icon: DealsIcon, title: "Close the deal", text: "Track payment, confirm completion, and preserve the record." },
];

const DIFFERENTIATORS = [
  { icon: DealsIcon, title: "No deal commission", text: "Zeke does not take a percentage from creator earnings." },
  { icon: DiscoverIcon, title: "Two-way discovery", text: "Brands find creators - and creators choose which offers fit." },
  { icon: ShieldIcon, title: "Verified network", text: "Better context before either side commits to a campaign." },
  { icon: AgreementIcon, title: "Full transparency", text: "Every offer, approval, link, and payment lives together." },
  { icon: CampaignIcon, title: "Monitored workflow", text: "A clear status trail keeps the next step visible to both sides." },
  { icon: UsersIcon, title: "Human support", text: "Shield gives creators a team in their corner when needed." },
];

const REAL_PROBLEMS = [
  "A post is reused in ads without an agreed permission window.",
  "Payment promised in 30 days drifts without a visible update.",
  "Deliverables change after the creator has already started.",
  "A deal is cancelled after meaningful work has been completed.",
  "Exclusivity language blocks future work without clear boundaries.",
];

const BRAND_PROMISE = [
  "Business identity and profile verification",
  "Clear campaign brief, budget, and delivery history",
  "Structured offers before creators begin work",
  "One transparent review and approval record",
  "Problem accounts can be investigated and removed",
];

const FAQS = [
  ["Do creators and brands have to pay?", "No. Both sides can join and use the core marketplace free. Zeke Shield is an optional creator upgrade."],
  ["What does Zeke Shield include?", "Shield adds a PDF agreement, verified status, priority discovery, assisted follow-ups and table talks. If a creator chooses legal action, they directly hire and pay an independent provider while Zeke coordinates authorised records."],
  ["How does the deal workflow help?", "Offers, terms, content reviews, final links, payments, and disputes are kept in one structured campaign record."],
  ["Can creators reject or negotiate an offer?", "Yes. A creator can decline or negotiate before accepting. The deal terms are not locked until both sides agree."],
  ["How are brands verified?", "Zeke records business profile information and keeps campaign activity visible so creators can assess the opportunity before accepting."],
  ["Is Zeke only for Kerala?", "Kerala is the launch market. The product is being built deeply here before expanding across India and the GCC."],
];

const FREE_FEATURES = [
  "Create a creator or brand profile",
  "Discover creators and campaigns",
  "Send and receive structured offers",
  "Chat, negotiate, submit, and review",
  "Track deal and payment progress",
];

const SHIELD_FEATURES = [
  "Everything in the free marketplace",
  "PDF agreement on every eligible deal",
  "Professional follow-ups and table talks",
  "Creator-controlled legal-provider access",
  "Authorised case and lawyer coordination",
  "Verified Shield profile badge",
  "Priority creator discovery",
  "Monthly performance report",
];

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-purple">{eyebrow}</div>
      <h2 className="mt-3 text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-dark sm:text-[40px]">{title}</h2>
      <p className="mx-auto mt-3 max-w-[680px] text-sm leading-6 text-[#5b5874] sm:text-base">{body}</p>
    </div>
  );
}

function CheckList({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item} className={`flex items-start gap-2.5 text-sm ${dark ? "text-light" : "text-[#3f3b5c]"}`}>
          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple text-[10px] font-black text-white">✓</span>
          <span className="leading-5">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function LandingSections() {
  return (
    <div className="landing-content bg-white text-dark">
      <section id="creators" className="scroll-mt-20 px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeading
            eyebrow="Why structure matters"
            title="Great work should not depend on a lucky DM thread."
            body="Creators and brands both lose when terms, approvals, usage rights, and payments live in different places. Zeke brings the whole deal into one trusted workflow."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {PROBLEMS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-[#dedcf1] bg-[#faf9ff] p-4 text-center transition-transform hover:-translate-y-1 hover:border-purple/35">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-pink/20 bg-pink/[0.07] text-pink">
                  <Icon width={21} height={21} />
                </span>
                <h3 className="mt-3 text-[13px] font-extrabold text-dark">{title}</h3>
                <p className="mt-1.5 text-[11px] leading-[1.55] text-[#65617d]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-6 sm:pb-20">
        <div className="brand-story-card relative mx-auto grid max-w-[1120px] overflow-hidden rounded-[28px] border border-purple/35 bg-dark p-7 text-white shadow-[0_24px_70px_rgba(35,20,80,0.22)] sm:p-10 lg:grid-cols-[0.25fr_1fr_0.55fr] lg:items-center lg:gap-8">
          <div className="mx-auto flex h-28 w-24 items-center justify-center rounded-[28px] border-2 border-purple bg-gradient-to-br from-accent/30 via-purple/25 to-pink/20 shadow-[0_0_42px_rgba(168,85,247,0.25)] lg:mx-0">
            <BrandLogo markOnly className="w-16" />
          </div>
          <div className="mt-6 text-center lg:mt-0 lg:text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.17em] text-cyan">Zeke exists to protect the deal</div>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">Every creator deserves structure - and a clear path when a deal goes wrong.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Zeke keeps the record, handles assisted follow-ups, and lets the creator decide whether and when to seek independent legal help.</p>
          </div>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-5 lg:mt-0">
            <CheckList dark items={["Your work", "Your payment trail", "Your usage terms", "Your deal history"]} />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-[#f5f4fc] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeading eyebrow="How Zeke works" title="Protection at every step." body="A six-step deal flow keeps both sides aligned - from discovery to payment confirmation." />
          <div className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="absolute left-[8%] right-[8%] top-9 hidden h-px bg-gradient-to-r from-accent via-purple to-pink lg:block" aria-hidden />
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="relative rounded-2xl border border-[#dedcf1] bg-white p-4 text-center shadow-[0_10px_30px_rgba(30,20,70,0.05)]">
                <span className="absolute -top-2 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-accent to-purple text-[10px] font-black text-white">{index + 1}</span>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeecff] text-purple"><Icon width={23} height={23} /></span>
                <h3 className="mt-3 text-xs font-extrabold text-dark">{title}</h3>
                <p className="mt-1.5 text-[10px] leading-[1.55] text-[#6a6682]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="shield" className="scroll-mt-20 px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1040px]">
          <SectionHeading eyebrow="Shield or Free" title="Choose the support level that fits." body="The marketplace stays free. Shield adds assisted dispute support and creator-controlled access to independent legal providers." />
          <div className="mt-10 grid overflow-hidden rounded-[28px] border border-[#d7d4eb] shadow-[0_22px_60px_rgba(40,25,85,0.1)] lg:grid-cols-2">
            <article className="brand-shield-card relative bg-dark p-7 text-white sm:p-9">
              <span className="absolute right-6 top-6 rounded-full bg-gradient-to-r from-purple to-pink px-3 py-1 text-[9px] font-black uppercase tracking-wider">Optional upgrade</span>
              <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-purple text-white"><ShieldIcon width={24} height={24} /></span><div><h3 className="text-xl font-extrabold">Zeke Shield</h3><p className="text-xs text-muted">Follow-up, coordination and legal access</p></div></div>
              <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-black">₹1,999</span><span className="pb-1 text-sm text-muted">/ month</span></div>
              <div className="mt-6"><CheckList dark items={SHIELD_FEATURES} /></div>
              <Link href="/register?role=influencer" className={buttonClassName({ fullWidth: true, className: "mt-7" })}>Join with Shield</Link>
              <Link href="/shield" className="mt-3 block text-center text-xs font-semibold text-gold underline underline-offset-4">See exactly how Shield works</Link>
            </article>
            <article className="bg-white p-7 sm:p-9">
              <span className="rounded-full border border-zgreen/25 bg-zgreen/[0.07] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-zgreen">Free forever</span>
              <div className="mt-5 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeecff] text-accent"><UsersIcon width={24} height={24} /></span><div><h3 className="text-xl font-extrabold text-dark">Zeke Free</h3><p className="text-xs text-[#6a6682]">The complete core marketplace</p></div></div>
              <div className="mt-7 text-4xl font-black text-dark">₹0</div>
              <div className="mt-6"><CheckList items={FREE_FEATURES} /></div>
              <Link href="/register" className={buttonClassName({ variant: "outline", fullWidth: true, className: "mt-7 !text-dark" })}>Start free</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f4fc] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeading eyebrow="Built differently" title="What makes Zeke work for both sides." body="The platform is designed around clarity, choice, and a complete record - not another inbox." />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {DIFFERENTIATORS.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-[#dedcf1] bg-white p-4 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent/10 via-purple/10 to-pink/10 text-accent"><Icon width={21} height={21} /></span>
                <h3 className="mt-3 text-xs font-extrabold text-dark">{title}</h3>
                <p className="mt-1.5 text-[10px] leading-[1.55] text-[#6a6682]">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[24px] border border-[#dedcf1] bg-white p-6 sm:p-8">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-pink">Real problems we solve</div>
              <h3 className="mt-3 text-2xl font-extrabold text-dark">We have seen the pattern. Zeke keeps the record.</h3>
              <div className="mt-6"><CheckList items={REAL_PROBLEMS} /></div>
            </article>
            <article id="brands" className="relative scroll-mt-20 overflow-hidden rounded-[24px] border border-purple/25 bg-gradient-to-br from-[#f0eeff] to-white p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple/10 blur-2xl" aria-hidden />
              <div className="relative text-[11px] font-extrabold uppercase tracking-[0.16em] text-accent">Verified brand promise</div>
              <h3 className="relative mt-3 text-2xl font-extrabold text-dark">Know more before the campaign starts.</h3>
              <div className="relative mt-6"><CheckList items={BRAND_PROMISE} /></div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-6">
        <div className="brand-support-card mx-auto grid max-w-[1120px] gap-8 rounded-[28px] border border-purple/30 bg-dark p-7 text-white sm:p-10 lg:grid-cols-[1fr_0.42fr] lg:items-center">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-cyan">Real help when a deal needs it</div>
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">You stay in control. Zeke helps open the right door.</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Creator friendly", "Clear evidence", "No deal commission", "Transparent process"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center text-[11px] font-semibold text-light">{item}</div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <ShieldIcon width={30} height={30} className="text-purple" />
            <p className="mt-3 text-sm leading-6 text-muted">Shield creators can continue table talks as long as they wish. If they choose legal action, they directly engage a provider and Zeke coordinates authorised case records.</p>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 bg-[#f5f4fc] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-[1120px] gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-purple">FAQ</div>
            <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.035em] text-dark">Questions before your first deal?</h2>
            <div className="mt-6 space-y-2.5">
              {FAQS.map(([question, answer]) => (
                <details key={question} className="group rounded-2xl border border-[#dedcf1] bg-white px-4 py-3 open:border-purple/35">
                  <summary className="cursor-pointer list-none pr-5 text-sm font-bold text-dark marker:hidden">{question}<span className="float-right text-purple transition-transform group-open:rotate-45">+</span></summary>
                  <p className="mt-3 text-xs leading-5 text-[#68647f]">{answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-purple">Simple pricing</div>
            <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.035em] text-dark">Start free. Add Shield when you want backup.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <article className="rounded-[24px] border border-[#d8d5eb] bg-white p-6">
                <span className="rounded-full bg-zgreen/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-zgreen">Marketplace</span>
                <h3 className="mt-5 text-lg font-extrabold text-dark">Free</h3>
                <div className="mt-2 text-4xl font-black text-dark">₹0</div>
                <p className="mt-3 text-xs leading-5 text-[#68647f]">For creators and brands ready to discover, structure, and complete campaigns.</p>
                <Link href="/register" className={buttonClassName({ variant: "outline", fullWidth: true, className: "mt-6 !text-dark" })}>Sign up free</Link>
              </article>
              <article className="relative rounded-[24px] border border-purple/50 bg-white p-6 shadow-[0_18px_55px_rgba(99,102,241,0.13)]">
                <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-purple to-pink px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white">Creator upgrade</span>
                <h3 className="mt-8 text-lg font-extrabold text-dark">Shield</h3>
                <div className="mt-2 text-4xl font-black text-dark">₹1,999<span className="text-sm font-semibold text-[#68647f]"> / month</span></div>
                <p className="mt-3 text-xs leading-5 text-[#68647f]">For creators who want agreements, assisted follow-ups, table talks and creator-controlled legal access. Legal costs are separate.</p>
                <Link href="/register?role=influencer" className={buttonClassName({ fullWidth: true, className: "mt-6" })}>Choose Shield</Link>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
