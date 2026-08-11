import Link from "next/link";

const FOUNDERS = [
  {
    initial: "F",
    name: "Fidha",
    role: "Creator Growth & Brand Strategy",
    desc: "Owns the creator side of Zeke: onboarding, relationships, and community growth across India, plus brand positioning and creator outreach.",
    bg: "bg-zgreen/20",
    border: "border-zgreen/30",
    color: "text-zgreen",
  },
  {
    initial: "M",
    name: "Mufeed",
    role: "Platform & Legal Compliance",
    desc: "Leads platform development, resource management, and the legal infrastructure that powers Zeke Shield.",
    bg: "bg-cyan/15",
    border: "border-cyan/30",
    color: "text-cyan",
  },
  {
    initial: "M",
    name: "Musthafa",
    role: "GCC Campaigns & Finance",
    desc: "Leads brand campaigns across the GCC, manages finance, and co-leads platform development alongside Mufeed.",
    bg: "bg-gold/20",
    border: "border-gold/30",
    color: "text-gold",
  },
];

const VALUES = [
  {
    icon: "\u{1F6E1}",
    title: "Creators first",
    desc: "Every decision we make starts with what is best for you.",
  },
  {
    icon: "✉",
    title: "Radical transparency",
    desc: "No hidden fees. No surprise commissions. No fine print.",
  },
  {
    icon: "\u{1F4C5}",
    title: "Structure over chaos",
    desc: "DM negotiations are broken. We give you structure instead.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark pb-20">
      <div className="mx-auto max-w-[820px] px-6 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-muted hover:text-white"
        >
          &#8592; Back
        </Link>
        <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wider text-accent">
          About Zeke
        </div>
        <h1 className="mb-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-4xl">
          Built in Kerala, for <span className="brand-gradient-text">every creator</span>
        </h1>
        <p className="mb-12 max-w-[600px] text-base leading-relaxed text-muted">
          Zeke started with a simple frustration. Creators were doing great work and getting
          burned on deals, because nothing was structured, nothing was protected, and nobody
          had their back.
        </p>

        <section className="mb-9">
          <h3 className="mb-3 border-b border-border pb-2.5 text-base font-bold text-white">
            The problem we are solving
          </h3>
          <p className="text-sm leading-loose text-muted">
            Brand deals in the Kerala creator economy happen over WhatsApp, Instagram DMs, and
            email all at once. There is no paper trail and no structure. Payments get disputed,
            deadlines slip, and creators get ghosted after the content is already live.
          </p>
        </section>

        <div className="my-10 h-px bg-border" />

        <section className="mb-9">
          <h3 className="mb-3 border-b border-border pb-2.5 text-base font-bold text-white">
            The team
          </h3>
          <p className="text-sm leading-loose text-muted">Zeke is built by three equal co-founders.</p>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
            {FOUNDERS.map((f) => (
              <div key={f.name} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-2.5 flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border text-sm font-black ${f.bg} ${f.border} ${f.color}`}
                  >
                    {f.initial}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{f.name}</div>
                    <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                      {f.role}
                    </div>
                  </div>
                </div>
                <div className="text-[13px] leading-relaxed text-muted">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-10 h-px bg-border" />

        <section className="mb-9">
          <h3 className="mb-3 border-b border-border pb-2.5 text-base font-bold text-white">
            What we stand for
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-4.5">
                <div className="mb-2 text-[22px]">{v.icon}</div>
                <div className="mb-1.5 text-[13px] font-bold text-white">{v.title}</div>
                <div className="text-xs leading-relaxed text-muted">{v.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-10 h-px bg-border" />

        <section>
          <h3 className="mb-3 border-b border-border pb-2.5 text-base font-bold text-white">
            Contact
          </h3>
          <p className="text-sm leading-loose text-muted">
            Questions, partnerships, or press:{" "}
            <a
              href="mailto:hello@zeke.global"
              className="font-semibold text-accent transition-colors hover:text-purple"
            >
              hello@zeke.global
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
