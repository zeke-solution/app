import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtNum } from "@/lib/domain/format";
import { getPublicCreatorProfile } from "@/lib/public-creator-profile";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default async function PublicCreatorPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!/^[a-zA-Z0-9._]{2,30}$/.test(handle)) notFound();
  const creator = await getPublicCreatorProfile(handle);
  if (!creator) notFound();

  const initials = creator.display_name.slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen bg-dark px-4 py-8 text-light">
      <div className="mx-auto max-w-2xl">
        <Link href="/" aria-label="Zeke website home" className="inline-flex"><BrandLogo className="w-[94px]" preload /></Link>
        <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <div className="h-24 bg-gradient-to-r from-accent/70 via-purple/60 to-cyan/45" />
          <div className="px-5 pb-6 md:px-8">
            <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-navy bg-cover bg-center text-xl font-black text-accent" style={creator.avatar_url ? { backgroundImage: `url(${creator.avatar_url})` } : undefined}>
              {!creator.avatar_url && initials}
            </div>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">{creator.display_name}</h1>
                <p className="mt-1 text-sm text-muted">@{creator.handle}{creator.location ? ` - ${creator.location}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {creator.verified && <span className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 text-xs font-bold text-cyan">Verified</span>}
                {creator.shield_active && <span className="rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-xs font-bold text-purple">Shield</span>}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Instagram" value={fmtNum(creator.ig_followers)} />
              {creator.yt_enabled && <Stat label="YouTube" value={fmtNum(creator.yt_followers)} />}
              {creator.x_enabled && <Stat label="X" value={fmtNum(creator.x_followers)} />}
              <Stat label="Completed" value={String(creator.completed_deals)} />
            </div>
            <div className="mt-6 rounded-2xl border border-border bg-dark p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Creator category</div>
              <div className="mt-1 text-sm font-bold text-white">{creator.niche || "Creator"}</div>
              {creator.rating ? <div className="mt-2 text-xs text-gold">{creator.rating.toFixed(1)} rating</div> : null}
            </div>
            <Link href="/register?role=brand" className="brand-button-primary mt-6 block rounded-xl border px-4 py-3 text-center text-sm font-bold text-white">Work with {creator.display_name} on Zeke</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-navy p-3 text-center"><div className="text-base font-black text-white">{value}</div><div className="mt-0.5 text-[11px] text-muted">{label}</div></div>;
}
