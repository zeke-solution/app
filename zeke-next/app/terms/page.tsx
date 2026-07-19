import Link from "next/link";

const SECTIONS = [
  {
    id: "acceptance",
    q: "1. Acceptance and eligibility",
    a: "By creating an account or using Zeke, you agree to these terms. You must provide accurate information and have the legal capacity to enter campaign agreements. A creator who is not legally able to contract independently must use the guardian process provided by Zeke.",
  },
  {
    id: "platform-role",
    q: "2. Zeke's role",
    a: "Zeke provides a marketplace and structured workflow for creators and brands to discover each other, record offers, agree deliverables, review content, and track deal progress. Zeke is not the employer, agent, or business partner of either party and does not guarantee a campaign, audience result, or payment outcome.",
  },
  {
    id: "accounts",
    q: "3. Accounts and verification",
    a: "You are responsible for your account activity and for keeping your login details secure. Verification helps participants assess each other but is not a guarantee. Do not impersonate another person or business, submit misleading information, or transfer your account without permission.",
  },
  {
    id: "deals",
    q: "4. Offers and campaign agreements",
    a: "Creators may accept, reject, or negotiate an offer before agreement. Once both parties agree, each party is responsible for the recorded deliverables, deadlines, approvals, usage rights, and payment terms. A deal-specific agreement controls that campaign if it conflicts with a general platform description.",
  },
  {
    id: "content",
    q: "5. Content and usage rights",
    a: "Creators keep ownership of their original work except for the rights they expressly grant in an accepted deal. Each user must have permission to upload and use the content, trademarks, music, images, and other material they provide. Brands may use creator content only within the agreed scope and usage period.",
  },
  {
    id: "payments",
    q: "6. Payments, fees, and taxes",
    a: "Payment amounts and due dates are set by the parties in each deal. The core Zeke marketplace is available free, while optional services such as Zeke Shield use the price shown when selected. Each party remains responsible for its own taxes, banking charges, and legally required records.",
  },
  {
    id: "shield",
    q: "7. Zeke Shield and disputes",
    a: "Zeke Shield can add agreement records, verified status, priority features, and support during eligible disputes. Shield support does not guarantee a particular result and is not a substitute for independent legal advice or legal representation. Users must cooperate honestly and provide relevant deal records during a review.",
  },
  {
    id: "conduct",
    q: "8. Acceptable conduct",
    a: "Do not use Zeke for fraud, harassment, unlawful content, rights violations, manipulated engagement, spam, or attempts to bypass platform safeguards. Do not interfere with the service, access another user's account, or misuse private campaign information.",
  },
  {
    id: "enforcement",
    q: "9. Suspension and account closure",
    a: "Zeke may investigate activity and restrict or close accounts that create safety, legal, or integrity risks or repeatedly breach these terms. Users may stop using the service at any time, but existing campaign obligations and records may continue where needed to complete a deal, resolve a dispute, or meet legal requirements.",
  },
  {
    id: "changes",
    q: "10. Changes and contact",
    a: "Zeke may update these terms as the service develops. Material changes will be presented through the platform or another reasonable notice. Questions about these terms can be sent to hello@zeke.global.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-dark pb-20">
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
        <h1 className="mb-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mb-7 text-[13px] text-muted">Last updated: July 2026</p>
        <div className="mb-7 rounded-xl border border-accent/15 bg-accent/[0.06] px-5 py-4 text-sm leading-relaxed text-light">
          These terms set the ground rules for using Zeke and completing creator-brand deals through the platform.
        </div>

        <div className="space-y-2.5">
          {SECTIONS.map((section) => (
            <details
              key={section.id}
              className="group rounded-2xl border border-border bg-card px-5 py-4 open:border-accent/40"
            >
              <summary className="cursor-pointer list-none pr-5 text-sm font-semibold text-white marker:hidden">
                {section.q}
                <span aria-hidden className="float-right text-lg leading-none text-muted transition-transform group-open:rotate-45 group-open:text-accent">+</span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{section.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-sm leading-6 text-muted">
          Questions? Email <a href="mailto:hello@zeke.global" className="font-semibold text-accent hover:text-purple">hello@zeke.global</a> or review our <Link href="/privacy" className="font-semibold text-accent hover:text-purple">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
