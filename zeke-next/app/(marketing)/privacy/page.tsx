import Link from "next/link";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "Read how Zeke collects, uses, protects, and retains personal information across creator accounts, brand accounts, deals, and Shield support.",
  path: "/privacy",
});
import { Accordion } from "@/components/marketing/Accordion";

const SECTIONS = [
  { id: "who", q: "1. Who we are", a: "Zeke is a creator-brand deal platform and Shield case coordinator. Contact: privacy@zeke.global" },
  { id: "data", q: "2. What data we collect", a: "We collect account and profile details, campaign and deal records, messages, agreements, payment status, Shield membership records, dispute descriptions, creator decisions and consents, case timeline entries, legal-provider selections, evidence files, and basic security and usage information." },
  { id: "shield-data", q: "3. Shield case and evidence data", a: "Shield case data may include contracts, invoices, brand communications, content records, payment evidence and legal documents you choose to upload. Case files are private to the creator and authorised Zeke administrators unless the creator expressly marks records for sharing with a directly engaged legal provider." },
  { id: "use", q: "4. How we use data", a: "We use data to operate accounts and deals, generate agreements, keep an audit trail, handle authorised brand follow-ups and table talks, maintain the factual provider pool, coordinate records after direct legal engagement, protect the service, communicate case updates and comply with legal obligations." },
  { id: "share", q: "5. Who we share data with", a: "We do not sell personal data. Deal information is shared between the relevant creator and brand. Shield case records may be shared with an independent legal provider only under the creator's recorded instruction or when lawfully required. Service providers receive only the access needed to operate Zeke under appropriate safeguards." },
  { id: "provider-role", q: "6. Independent legal providers", a: "Legal providers are independent from Zeke. When a creator contacts or hires one, that provider's own privacy and professional-confidentiality duties also apply. Zeke records the provider choice and sharing consent but does not receive a referral commission." },
  { id: "control", q: "7. Your choices and consent", a: "Shield creators choose whether Zeke may contact a brand, whether to explore legal help, which provider to contact, and which records may be coordinated. You can ask Zeke to stop future optional sharing. This does not require deletion of records that must be retained for an active case, security, audit or legal purpose." },
  { id: "rights", q: "8. Access, correction and deletion", a: "You may request access to, correction of, or deletion of eligible personal data and may raise a privacy grievance by contacting privacy@zeke.global. We will explain when a record cannot be deleted because it is needed for a live deal, dispute, legal obligation, fraud prevention or the rights of another person." },
  { id: "retention", q: "9. Retention", a: "We keep account and deal records only as long as needed for the service, dispute history, security, audit and legal requirements. Shield case files receive additional review because premature deletion could harm the creator's own claim or another party's lawful rights." },
  { id: "security", q: "10. Security", a: "Data is transmitted over HTTPS. Passwords are handled by our authentication provider and are not stored by Zeke in plain text. Shield evidence uses private storage and access controls; no online service can promise absolute security." },
  { id: "cookies", q: "11. Cookies", a: "We use essential cookies needed for authentication, security and core platform operation. We do not use advertising cookies to track you across unrelated sites." },
  { id: "contact", q: "12. Privacy contact", a: "For privacy questions, consent withdrawal or a data-rights request, contact privacy@zeke.global." },
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
        <h1 className="mb-4 text-[26px] font-black leading-tight tracking-tight text-white sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mb-7 text-[13px] text-muted">Last updated: August 2026</p>
        <div className="mb-7 rounded-xl border border-accent/15 bg-accent/[0.06] px-5 py-4 text-sm leading-relaxed text-light">
          Zeke is committed to protecting your privacy. We do not sell your data - ever.
        </div>

        <Accordion items={SECTIONS.map((s) => ({ id: s.id, header: s.q, body: s.a }))} />
      </div>
    </div>
  );
}
