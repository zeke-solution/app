import Image from "next/image";
import logoWhite from "@/public/images/zeke-logo-white.png";
import { fmtDate, fmtNum } from "@/lib/domain/format";

export function AgreementPreview({
  agreementId,
  brandName,
  creatorName,
  title,
  platform,
  amount,
  deliverables,
  generatedAt,
}: {
  agreementId: string;
  brandName: string;
  creatorName: string;
  title: string | null;
  platform: string | null;
  amount: number | null;
  deliverables: string | null;
  generatedAt: string | null;
}) {
  const reference = `ZK-AG-${agreementId.replace(/-/g, "").slice(0, 10).toUpperCase()}`;

  return (
    <div className={'agreement-document'}>
    <article className="overflow-hidden rounded-2xl border border-white/15 bg-white text-[#1c182a] shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
      <header className="flex items-center justify-between bg-[#0e0a1c] px-5 py-4">
        <Image
          src={logoWhite}
          alt="Zeke"
          sizes="94px"
          className="h-auto w-[94px]"
        />
        <div className="text-right">
          <div className="text-[9px] font-black tracking-[0.12em] text-white">CAMPAIGN AGREEMENT</div>
          <div className="mt-0.5 text-[8px] text-[#c6c0da]">zekesolution.com</div>
        </div>
      </header>
      <div className="h-1 bg-gradient-to-r from-[#6f53f5] via-[#9b4bea] to-[#e039a5]" />

      <div className="p-5">
        <h3 className="text-base font-black">Creator - Brand Campaign Agreement</h3>
        <div className="mt-1 flex flex-wrap justify-between gap-1 text-[9px] text-[#756f87]">
          <span>Document reference: {reference}</span>
          <span>Effective date: {fmtDate(generatedAt)}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-[#e6e1ee] bg-[#f8f7fc] p-3">
          <PreviewStat label="Agreed value" value={`₹${fmtNum(amount)}`} />
          <PreviewStat label="Platform" value={platform || "As agreed"} />
          <PreviewStat label="Record status" value="Accepted" accent />
        </div>

        <PreviewSection title="Parties">
          <div className="grid gap-2 sm:grid-cols-2">
            <PartyCard role="Brand" name={brandName} />
            <PartyCard role="Creator" name={creatorName} />
          </div>
        </PreviewSection>

        <PreviewSection title="Campaign terms">
          <TermRow label="Campaign" value={title || "As agreed"} />
          <TermRow label="Deliverables" value={deliverables || "As recorded in the accepted offer"} shaded />
          <TermRow label="Platform" value={platform || "As agreed"} />
        </PreviewSection>

        <div className="mt-4 rounded-xl border border-[#b9e2d2] bg-[#f5fcf9] p-3">
          <div className="text-[9px] font-black tracking-[0.08em] text-[#059669]">TERMS LOCKED AFTER ACCEPTANCE</div>
          <p className="mt-1 text-[10px] leading-4 text-[#4f4960]">
            Both parties digitally accepted this campaign record through Zeke. The downloadable PDF carries the same reference and full recorded terms.
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-1 border-t border-[#e4dfeb] px-5 py-3 text-[8px] font-semibold text-[#756f87]">
        <span>ZEKE SOLUTION | STRUCTURED CREATOR - BRAND RECORD</span>
        <span>{reference}</span>
      </footer>
    </article>
    </div>
  );
}

function PreviewStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] font-black uppercase tracking-[0.08em] text-[#817a91]">{label}</div>
      <div className={`mt-1 break-words text-[10px] font-black ${accent ? "text-[#059669]" : "text-[#1c182a]"}`}>{value}</div>
    </div>
  );
}

function PartyCard({ role, name }: { role: string; name: string }) {
  return (
    <div className="rounded-xl border border-[#e4dfeb] bg-[#f8f7fc] p-3">
      <div className="text-[8px] font-black uppercase tracking-[0.08em] text-[#817a91]">{role}</div>
      <div className="mt-1 text-[11px] font-black">{name}</div>
      <div className="mt-2 text-[8px] font-black tracking-[0.06em] text-[#059669]">DIGITALLY ACCEPTED</div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <div className="mb-2 border-b border-[#8066ef] pb-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#6f53f5]">{title}</div>
      {children}
    </section>
  );
}

function TermRow({ label, value, shaded = false }: { label: string; value: string; shaded?: boolean }) {
  return (
    <div className={`grid grid-cols-[92px_1fr] gap-2 border-b border-[#ebe7f0] px-2 py-2 text-[10px] leading-4 ${shaded ? "bg-[#f8f7fc]" : ""}`}>
      <span className="text-[8px] font-black uppercase tracking-[0.06em] text-[#817a91]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
