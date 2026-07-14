import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STATS = [
  { value: "1,200+", label: "Kerala Creators" },
  { value: "340+", label: "Verified Brands" },
  { value: "₹3.2Cr+", label: "Deals Closed" },
  { value: "98%", label: "Disputes Resolved" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-20 text-center sm:pt-20">
      <div
        className="pointer-events-none absolute left-1/2 top-[20%] -z-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-accent/5 blur-[40px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[20%] top-[10%] -z-0 h-[300px] w-[300px] rounded-full bg-[#0F3460]/20 blur-[30px]"
        aria-hidden
      />

      <div className="relative z-10 mb-6 inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
        &#128737; Kerala&apos;s First Legally-Protected Influencer Marketplace
      </div>

      <h1 className="relative z-10 mx-auto mb-5 max-w-[700px] text-[28px] font-black leading-[1.1] tracking-tight text-white sm:text-[52px]">
        Where Creators
        <br />
        Meet <span className="text-accent">Global Brands</span>
      </h1>

      <p className="relative z-10 mx-auto mb-10 max-w-[520px] text-[15px] leading-relaxed text-muted sm:text-[17px]">
        The safest place for creators and brands to meet, deal, and grow - together.
      </p>

      <div className="relative z-10 mb-14 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-4">
        <Link href="/register?role=brand" className="w-full sm:w-auto">
          <Button size="lg" fullWidth className="sm:w-auto">
            I&apos;m a Brand
          </Button>
        </Link>
        <Link href="/register?role=influencer" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" fullWidth className="sm:w-auto">
            I&apos;m a Creator
          </Button>
        </Link>
      </div>

      <div className="relative z-10 mx-auto grid max-w-[700px] grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-6">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <div className="text-[22px] font-black text-white">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
