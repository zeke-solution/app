import Link from "next/link";

const FOUNDERS = [
  {
    initial: "S",
    name: "Sadhim",
    role: "Marketing & Brand Strategy",
    desc: "Leads brand positioning, creator outreach strategy, and quality control across everything Zeke puts out.",
    bg: "bg-accent/20",
    border: "border-accent/30",
    color: "text-accent",
  },
  {
    initial: "F",
    name: "Fidha",
    role: "Creator Relations & Growth",
    desc: "Owns the creator side - onboarding, relationships, and scaling the platform's creator community in India.",
    bg: "bg-zgreen/20",
    border: "border-zgreen/30",
    color: "text-zgreen",
  },
  {
    initial: "M",
    name: "Mufeed",
    role: "Platform & Legal Compliance",
    desc: "Leads platform development, resource management, and the legal infrastructure that powers Zeke Shield.",
    bg: "bg-[#0F3460]/40",
    border: "border-[#0F3460]/60",
    color: "text-light",
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
    desc: "Every product decision starts with what is best for the creator.",
  },
  {
    icon: "✉",
    title: "Radical transparency",
    desc: "No hidden fees. No surprise commissions. No fine print.",
  },
  {
    icon: "\u{1F4C5}",
    title: "Structure over chaos",
    desc: "DM negotiations are broken. We replace chaos with structure.",
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
        <h2 className="mb-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-4xl">
          Built in Kerala, for <span className="text-accent">every creator</span>
        </h2>
        <p className="mb-12 max-w-[600px] text-base leading-relaxed text-muted">
          Zeke started with a simple frustration - creators doing great work and getting burned
          on deals because nothing was structured, nothing was protected, and no one had their
          back.
        </p>

        <section className="mb-9">
          <h3 className="mb-3 border-b border-border pb-2.5 text-base font-bold text-white">
            The problem we are solving
          </h3>
          <p className="text-sm leading-loose text-muted">
            Brand deals in the Kerala creator economy happen over WhatsApp, Instagram DMs, and
            email simultaneously. There is no paper trail. No structure. Payment disputes are
            common. Deadlines get missed. Brands ghost creators after content is delivered.
          </p>
        </section>

        <div className="my-10 h-px bg-border" />

        <section className="mb-9">
          <h3 className="mb-3 border-b border-border pb-2.5 text-base font-bold text-white">
            The team
          </h3>
          <p className="text-sm leading-loose text-muted">Zeke is built by four equal co-founders.</p>
          <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
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
          <p className="text-sm leading-loose text-muted">hello@zeke.global</p>
        </section>
      </div>
    </div>
  );
}
