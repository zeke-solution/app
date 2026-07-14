import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import type { DealStatus } from "@/lib/domain/deal-status";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { DealCard } from "@/components/deals/DealCard";
import { OffersIcon, AgreementIcon } from "@/components/layout/icons";

export default async function CreatorOverviewPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();
  const inf = session.inf;

  const [completedRes, pendingRes, recentRes] = await Promise.all([
    supabase.from("deals").select("amount").eq("influencer_id", session.id).eq("status", "completed"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("influencer_id", session.id)
      .eq("status", "negotiating"),
    supabase
      .from("deals")
      .select("id,title,platform,amount,status,brand:profiles!deals_brand_id_fkey(display_name)")
      .eq("influencer_id", session.id)
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  const completedDeals = completedRes.data ?? [];
  const totalEarned = completedDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
  const recentDeal = recentRes.data?.[0];

  return (
    <div>
      <h1 className="text-2xl font-black text-white">Hey, {session.profile.display_name}</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        {[inf?.niche, session.profile.location].filter(Boolean).join(" · ")}
      </p>

      <StatGrid>
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          iconColor="#059669"
          valueColor="#059669"
          value={completedDeals.length}
          label="Deals Done"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          iconColor="#D97706"
          value={`₹${fmtNum(totalEarned)}`}
          label="Earned"
        />
        <StatCard icon={<OffersIcon width={18} height={18} />} iconColor="#D97706" value={pendingRes.count ?? 0} label="New Offers" />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          iconColor="#D97706"
          value={inf?.rating ? `${inf.rating}/5` : "--"}
          label="Rating"
        />
      </StatGrid>

      <Card className="mb-5">
        <h3 className="mb-4 text-sm font-bold text-white">Connected Platforms</h3>
        <div className="flex flex-col gap-3">
          <PlatformRow label="Instagram" chip="IG" chipClass="bg-accent/10 text-accent" value={inf?.ig_followers} />
          {inf?.yt_enabled && (
            <PlatformRow label="YouTube" chip="YT" chipClass="bg-[#f87171]/10 text-[#f87171]" value={inf?.yt_followers} />
          )}
          {inf?.x_enabled && (
            <PlatformRow label="Twitter / X" chip="X" chipClass="bg-[#38bdf8]/10 text-[#38bdf8]" value={inf?.x_followers} />
          )}
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-white">Recent Activity</div>
      </div>
      {recentDeal ? (
        <DealCard
          href={`/creator/deals/${recentDeal.id}`}
          counterpartName={
            (recentDeal.brand as { display_name?: string } | null)?.display_name ?? "Brand"
          }
          title={recentDeal.title}
          platform={recentDeal.platform}
          amount={recentDeal.amount}
          status={recentDeal.status as DealStatus}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          <AgreementIcon width={32} height={32} className="mx-auto mb-3 opacity-40" />
          No deals yet.
        </div>
      )}
    </div>
  );
}

function PlatformRow({
  label,
  chip,
  chipClass,
  value,
}: {
  label: string;
  chip: string;
  chipClass: string;
  value: number | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-light">
        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-extrabold ${chipClass}`}>{chip}</span>
        {label}
      </div>
      <div className="text-sm font-bold text-white">{value ? fmtNum(value) : "--"}</div>
    </div>
  );
}
