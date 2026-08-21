import Link from "next/link";

const INCLUDED = [
  "A structured record of the dispute and supporting evidence",
  "Professional follow-ups and table talks handled by Zeke",
  "You decide how long talks continue and whether to escalate",
  "Access to factual profiles of independent legal providers",
  "Case-document and communication coordination after you hire a provider",
];

const NOT_INCLUDED = [
  "A guarantee that a brand will pay or that a case will succeed",
  "Lawyer fees, court fees, filing charges or other legal costs",
  "Legal advice or representation by Zeke",
  "Automatic legal action without your informed decision",
  "A Zeke commission, referral share or percentage of any recovery",
];

export function ShieldCoverage({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "space-y-3" : "space-y-5"}>
      <div className="grid gap-3 md:grid-cols-2">
        <CoverageList title="What Shield includes" items={INCLUDED} tone="green" />
        <CoverageList title="What Shield does not pay for" items={NOT_INCLUDED} tone="neutral" />
      </div>
      <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-xs leading-5 text-light">
        <strong className="text-gold">You stay in control.</strong> Legal providers are independent.
        You choose and engage them directly, agree their fees directly, and can withdraw document-sharing consent
        for future coordination by contacting Zeke. Zeke does not rank providers or promise an outcome. Read the{" "}
        <Link href="/terms#shield" className="font-semibold text-gold underline underline-offset-2">
          Shield terms
        </Link>
        .
      </div>
    </section>
  );
}

function CoverageList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "neutral";
}) {
  const positive = tone === "green";
  return (
    <div className={`rounded-2xl border p-4 ${positive ? "border-zgreen/25 bg-zgreen/[0.05]" : "border-border bg-card"}`}>
      <h3 className={`text-sm font-semibold ${positive ? "text-zgreen" : "text-light"}`}>{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs leading-5 text-muted">
            <span className={`mt-0.5 font-semibold ${positive ? "text-zgreen" : "text-light"}`}>
              {positive ? "✓" : "-"}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
