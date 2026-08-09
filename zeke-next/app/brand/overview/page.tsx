import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CreatorGrid } from "@/components/creators/CreatorGrid";
import type { CreatorRow } from "@/components/creators/CreatorCard";
import { CampaignIcon } from "@/components/layout/icons";

export default async function BrandOverviewPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [activeCampaignsRes, activeDealsRes, completedDealsRes, campaignsPreviewRes, creatorsRes] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("brand_id", session.id).eq("status", "active"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", session.id)
      .not("status", "in", '("completed","cancelled")'),
    supabase.from("deals").select("amount").eq("brand_id", session.id).eq("status", "completed"),
    supabase.from("campaigns").select("*").eq("brand_id", session.id).eq("status", "active").order("created_at", { ascending: false }).limit(2),
    supabase
      .from("influencer_profiles")
      .select("id,niche,ig_followers,rating,shield_active,shield_expires,handle,profiles!influencer_profiles_id_fkey(display_name,location)")
      .eq("shield_active", true)
      .or(`shield_expires.is.null,shield_expires.gte.${today}`)
      .order("ig_followers", { ascending: false })
      .limit(4),
  ]);

  const totalSpent = (completedDealsRes.data ?? []).reduce((s, d) => s + (d.amount ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-black text-light">Welcome, {session.profile.display_name}</h1>
      <p className="mb-5 mt-1 text-sm text-muted">
        {[session.brand?.brand_type, session.profile.location].filter(Boolean).join(" · ")}
      </p>

      <StatGrid>
        <StatCard icon={<CampaignIcon width={18} height={18} />} iconColor="#4338CA" valueColor="#4338CA" value={activeCampaignsRes.count ?? 0} label="Campaigns" />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          iconColor="#047857"
          valueColor="#047857"
          value={activeDealsRes.count ?? 0}
          label="Active Deals"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          iconColor="#92400E"
          value={`₹${fmtNum(totalSpent)}`}
          label="Total Spent"
        />
        <StatCard
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="#92400E" stroke="#92400E" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          iconColor="#92400E"
          value="--"
          label="Avg Creator Rating"
        />
      </StatGrid>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-light">Active Campaigns</div>
        <Link href="/brand/campaigns" className="text-xs text-accent">View all &#8594;</Link>
      </div>
      <div className="mb-5">
        {(campaignsPreviewRes.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted">No campaigns yet.</div>
        ) : (
          (campaignsPreviewRes.data ?? []).map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-light">Recommended Creators</div>
        <Link href="/brand/discover" className="text-xs text-accent">Browse all &#8594;</Link>
      </div>
      <CreatorGrid creators={(creatorsRes.data ?? []) as unknown as CreatorRow[]} />
    </div>
  );
}
