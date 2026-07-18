import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { DealsTable, type AdminDealRow } from "@/components/admin/DealsTable";
import { UsersIcon, ShieldIcon, DisputeIcon } from "@/components/layout/icons";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [usersRes, dealsRes, shieldRes, disputesRes, shieldPendingRes, recentDealsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("id", { count: "exact", head: true }).not("status", "in", '("completed","cancelled")'),
    supabase.from("influencer_profiles").select("id", { count: "exact", head: true }).eq("shield_active", true),
    supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("shield_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("deals")
      .select("id,title,platform,amount,status,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name)")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const recentDeals: AdminDealRow[] = (recentDealsRes.data ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    platform: d.platform,
    amount: d.amount,
    status: d.status,
    brandName: (d.brand as unknown as { display_name?: string } | null)?.display_name ?? "Brand",
    creatorName: (d.creator as unknown as { display_name?: string } | null)?.display_name ?? "Creator",
  }));

  return (
    <div>
      <h1 className="text-2xl font-black text-white">Admin Overview</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Platform health at a glance</p>

      <StatGrid>
        <StatCard icon={<UsersIcon width={16} height={16} />} iconColor="#6366F1" value={usersRes.count ?? 0} label="Total Users" />
        <StatCard
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          iconColor="#059669"
          value={dealsRes.count ?? 0}
          label="Active Deals"
        />
        <StatCard icon={<ShieldIcon width={16} height={16} />} iconColor="#D97706" value={shieldRes.count ?? 0} label="Shield Members" />
        <StatCard icon={<DisputeIcon width={16} height={16} />} iconColor="#F43F5E" value={disputesRes.count ?? 0} label="Open Disputes" />
      </StatGrid>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/admin/shield" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-gold/20 bg-gold/10">
            <ShieldIcon width={18} height={18} stroke="#D97706" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">{shieldPendingRes.count ?? 0} Pending</div>
            <div className="text-[11px] text-muted">Shield Requests</div>
          </div>
        </Link>
        <Link href="/admin/disputes" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-zgreen/20 bg-zgreen/10">
            <DisputeIcon width={18} height={18} stroke="#059669" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-white">{disputesRes.count ?? 0} Open</div>
            <div className="text-[11px] text-muted">Disputes</div>
          </div>
        </Link>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-white">Recent Deals</div>
        <Link href="/admin/deals" className="text-xs text-accent">View all</Link>
      </div>
      <DealsTable deals={recentDeals} />
    </div>
  );
}
