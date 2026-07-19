"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Brand posts a campaign",
    desc: "Any verified brand can post a campaign with their requirements, budget and timeline. Free, always.",
  },
  {
    num: "02",
    title: "Creator gets the offer",
    desc: "Creators receive structured offers directly on Zeke. No DMs, no chasing. Just a clean offer waiting for your response.",
  },
  {
    num: "03",
    title: "Chat, negotiate, close",
    desc: "Both sides chat freely on the platform. Agree on terms, deliverables and payment until the deal is done.",
  },
  {
    num: "04",
    title: "Shield users get Zeke's backup",
    desc: "Zeke Shield members get a legally binding PDF agreement on every deal. If anything goes wrong, the Zeke team steps in.",
  },
];

const SHIELD_PERKS = [
  "PDF legal agreement on every deal - only available to Shield members",
  "If a brand disputes your content after delivery, Zeke takes your side first",
  "Our team works with both parties to reach a fair resolution",
  "Verified gold badge on your profile - brands trust Shield creators more",
  "Your profile appears first in brand searches",
  "Monthly PDF report: profile views, offers received, conversion rate",
  "Annual Zeke legal certificate in your name as a verified creator",
];

const COMPARE_ROWS: [string, boolean, boolean][] = [
  ["Create profile and get discovered", true, true],
  ["Receive brand offers", true, true],
  ["Chat, negotiate and close deals", true, true],
  ["Earnings tracker", true, true],
  ["PDF legal agreement", false, true],
  ["Zeke backs you in disputes", false, true],
  ["Verified gold badge", false, true],
  ["Priority in brand searches", false, true],
  ["Monthly performance report", false, true],
  ["Annual Zeke legal certificate", false, true],
];

const FAQ_ITEMS = [
  {
    id: "pay",
    q: "Do you have to pay at all?",
    a: "No. Both creators and brands join completely free. Zeke Shield is an optional upgrade for creators who want legal backing if a deal goes wrong.",
  },
  {
    id: "protect",
    q: "What exactly does Zeke Shield protect me from?",
    a: "If a brand does not pay, rejects your content unfairly, or ghosts you after delivery - the Zeke team steps in and works to resolve it on your behalf.",
  },
  {
    id: "nodispute",
    q: "What happens if I have a dispute without Shield?",
    a: "You still have the Zeke platform as your record. However Zeke will not actively intervene without Shield.",
  },
  {
    id: "pdf",
    q: "How does the PDF agreement work?",
    a: "Once a Shield member and a brand agree on a deal, Zeke auto-generates a PDF contract with all deal details. Both sides sign it digitally on the platform.",
  },
  {
    id: "kerala",
    q: "Is Zeke only for Kerala creators?",
    a: "We are starting with Kerala first. We want to build something deep and trusted here before expanding to the rest of India and the GCC.",
  },
  {
    id: "dms",
    q: "How is Zeke different from Instagram DMs?",
    a: "Instagram DMs have no structure, no paper trail and no recourse. Zeke gives you a structured offer system, negotiation chat, and for Shield members a signed PDF agreement.",
  },
];

function SectionShell({
  chip,
  chipGold,
  title,
  isOpen,
  onToggle,
  children,
}: {
  chip: string;
  chipGold?: boolean;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div
      data-open={isOpen}
      className={`brand-panel relative mb-3 overflow-hidden rounded-[20px] border backdrop-blur-sm transition-colors ${
        isOpen ? "border-accent/25" : "border-white/5 hover:bg-card/75"
      }`}
    >
      <div
        className="flex cursor-pointer items-center justify-between gap-3.5 p-5"
        onClick={onToggle}
      >
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
              chipGold
                ? "border-gold/25 bg-gold/10 text-gold"
                : "brand-chip"
            }`}
          >
            {chip}
          </span>
          <span className="text-base font-extrabold leading-snug text-white">{title}</span>
        </div>
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/[0.03] text-base font-light text-muted transition-transform ${
            isOpen ? "rotate-45 border-accent/30 bg-accent/15 text-white" : ""
          }`}
        >
          +
        </span>
      </div>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export function LandingSections() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (id: string) => setOpenSection((cur) => (cur === id ? null : id));

  return (
    <div className="relative mx-auto max-w-[900px] overflow-hidden px-4 pt-8 sm:px-6">
      <SectionShell
        chip="How It Works"
        title="From first message to signed deal"
        isOpen={openSection === "hiw"}
        onToggle={() => toggle("hiw")}
      >
        <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.num} className="brand-card flex flex-col gap-3 rounded-2xl border p-6">
              <div className="brand-gradient-text text-[28px] font-black">{s.num}</div>
              <div className="text-[15px] font-bold text-white">{s.title}</div>
              <div className="text-[13px] leading-relaxed text-muted">{s.desc}</div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        chip="Zeke Shield"
        chipGold
        title="Everyone deals free. Shield members deal protected."
        isOpen={openSection === "shield"}
        onToggle={() => toggle("shield")}
      >
        <div className="mt-5 grid gap-10 sm:grid-cols-2">
          <div className="flex flex-col gap-2.5">
            <p className="mb-3.5 text-sm font-bold text-white">
              What Shield actually means in practice
            </p>
            {SHIELD_PERKS.map((perk) => (
              <div key={perk} className="flex items-start gap-2.5 text-sm text-light">
                <span className="mt-px flex-shrink-0 text-gold">&#128737;</span>
                <span>{perk}</span>
              </div>
            ))}
            <div className="mt-4 rounded-xl border border-gold/20 bg-gold/[0.06] p-3.5 text-[13px] leading-relaxed text-gold">
              &#128161; <strong>Think about it:</strong> One brand deal can pay for your Shield
              many times over.
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-[20px] border border-gold/30 bg-card p-8">
            <div>&#128737; Zeke Shield</div>
            <div className="flex items-baseline gap-1">
              <span className="text-[44px] font-black text-white">&#8377;1,999</span>
              <span className="text-sm text-muted">&nbsp;/ year</span>
            </div>
            <p className="text-[13px] text-muted">Just &#8377;166 a month</p>
            <Link href="/register?role=influencer">
              <Button variant="gold" fullWidth className="mt-2">
                &#128737; Get Zeke Shield
              </Button>
            </Link>
            <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
              <div className="text-xs text-muted">&#10003; Zeke team in your corner on every dispute</div>
              <div className="text-xs text-muted">&#10003; Gold verified badge on your profile</div>
              <div className="text-xs text-muted">&#10003; Priority placement in brand searches</div>
              <div className="text-xs text-muted">&#128274; Backed by Zeke legal infrastructure</div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        chip="Free vs Shield"
        title="What you get at each tier"
        isOpen={openSection === "compare"}
        onToggle={() => toggle("compare")}
      >
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th />
                <th className="w-[140px] pb-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted">
                  Free Creator
                </th>
                <th className="w-[140px] bg-gold/[0.04] pb-2.5 text-center text-xs font-bold uppercase tracking-wider text-gold">
                  &#128737; Shield
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([feature, free, shield]) => (
                <tr key={feature} className="border-b border-border hover:bg-white/[0.02]">
                  <td className="py-3.5 px-4 text-sm font-medium text-light">{feature}</td>
                  <td className="py-3.5 px-4 text-center text-base text-zgreen">
                    {free ? "✓" : <span className="text-accent">✕</span>}
                  </td>
                  <td className="bg-gold/[0.04] py-3.5 px-4 text-center text-base text-zgreen">
                    {shield ? "✓" : <span className="text-accent">✕</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 text-center">
          <Link href="/register?role=influencer">
            <Button variant="gold">&#128737; Get Zeke Shield - &#8377;1,999/yr</Button>
          </Link>
        </div>
      </SectionShell>

      <SectionShell
        chip="Pricing"
        title="Simple, transparent pricing"
        isOpen={openSection === "pricing"}
        onToggle={() => toggle("pricing")}
      >
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="brand-card flex flex-col gap-3 rounded-[20px] border p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Brand</div>
            <div className="text-[26px] font-black text-white">
              Free <span className="text-[13px] font-normal text-muted">forever</span>
            </div>
            <div className="text-[13px] leading-relaxed text-muted">
              Post campaigns, search creators, send offers and close deals - all free.
            </div>
          </div>
          <div className="brand-card flex flex-col gap-3 rounded-[20px] border p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-muted">Creator</div>
            <div className="text-[26px] font-black text-white">
              Free <span className="text-[13px] font-normal text-muted">forever</span>
            </div>
            <div className="text-[13px] leading-relaxed text-muted">
              Join free, build your profile and start getting real brand offers.
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-[20px] border border-gold/40 bg-card p-6">
            <div className="text-xs font-bold uppercase tracking-wider text-gold">Zeke Shield</div>
            <div className="text-[26px] font-black text-gold">
              &#8377;1,999 <span className="text-[13px] font-normal text-muted">/ year</span>
            </div>
            <div className="text-[13px] leading-relaxed text-muted">
              Legal protection, PDF agreements, priority discovery and Zeke in your corner.
            </div>
            <Link href="/register?role=influencer" className="mt-1">
              <Button variant="gold" size="sm" fullWidth>
                Get Shield
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-zgreen/20 bg-zgreen/[0.06] px-5 py-3.5 text-center text-sm font-semibold text-zgreen">
          &#10003; Do you have to pay at all? No - Zeke is free. Shield is optional.
        </div>
      </SectionShell>

      <section className="brand-panel relative mb-3 rounded-[20px] border border-white/5 p-5 backdrop-blur-sm">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <span className="brand-chip rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="text-base font-extrabold leading-snug text-white">Want to know more?</h2>
        </div>
        <div className="space-y-2.5">
          {FAQ_ITEMS.map((item) => (
            <article key={item.id} className="brand-card rounded-2xl border px-5 py-4">
              <h3 className="text-sm font-semibold text-white">{item.q}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
