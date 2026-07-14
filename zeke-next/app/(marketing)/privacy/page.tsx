import Link from "next/link";
import { Accordion } from "@/components/marketing/Accordion";

const SECTIONS = [
  {
    id: "who",
    q: "1. Who we are",
    a: "Zeke is a creator-brand deal platform. Contact: privacy@zeke.global",
  },
  {
    id: "data",
    q: "2. What data we collect",
    a: "Account data (name, email, password), profile data (niche, location, social handles), deal data (offers, messages, agreements), payment records for Shield subscriptions, and basic usage analytics.",
  },
  {
    id: "use",
    q: "3. How we use your data",
    a: "To operate the platform, match creators with brands, generate PDF agreements, provide Shield dispute resolution, send platform notifications you have opted into, and comply with legal obligations.",
  },
  {
    id: "share",
    q: "4. Who we share data with",
    a: "We do not sell your data. We share only between deal parties (creators and brands), with service providers under strict agreements, and when legally required.",
  },
  {
    id: "rights",
    q: "5. Your rights",
    a: "You have the right to access, correct, delete, and export your data. Contact privacy@zeke.global",
  },
  {
    id: "cookies",
    q: "6. Cookies",
    a: "We use essential cookies only. No advertising cookies. We do not track you across other sites.",
  },
  {
    id: "security",
    q: "7. Security",
    a: "All data is transmitted over HTTPS. Passwords are hashed and never stored in plain text.",
  },
  { id: "contact", q: "8. Contact", a: "privacy@zeke.global" },
];

export default function PrivacyPage() {
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
          Legal
        </div>
        <h2 className="mb-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h2>
        <p className="mb-7 text-[13px] text-muted">Last updated: April 2026</p>
        <div className="mb-7 rounded-xl border border-accent/15 bg-accent/[0.06] px-5 py-4 text-sm leading-relaxed text-light">
          Zeke is committed to protecting your privacy. We do not sell your data - ever.
        </div>

        <Accordion items={SECTIONS.map((s) => ({ id: s.id, header: s.q, body: s.a }))} />
      </div>
    </div>
  );
}
