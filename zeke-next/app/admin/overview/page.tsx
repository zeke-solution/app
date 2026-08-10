import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { DealsTable, type AdminDealRow } from "@/components/admin/DealsTable";
import { UsersIcon, ShieldIcon, DisputeIcon } from "@/components/layout/icons";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [usersRes, dealsRes, shieldRes, disputesRes, shieldPendingRes, recentDealsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("deals").select("id", { count: "exact", head: true }).not("status", "in", '("completed","cancelled")'),
    supabase.from("influencer_profiles").select("id", { count: "exact", head: true }).eq("shield_active", true).or(`shield_expires.is.null,shield_expires.gte.${today}`),
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
      <PageHeader
        eyebrow="Operations"
        title="Admin overview"
        description="Platform health, work queues, and recent deal activity."
      />

      <StatGrid>
        <StatCard icon={<UsersIcon width={16} height={16} />} iconColor="#4338CA" value={usersRes.count ?? 0} label="Total Users" />
        <StatCard
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          iconColor="#047857"
          value={dealsRes.count ?? 0}
          label="Active Deals"
        />
        <StatCard icon={<ShieldIcon width={16} height={16} />} iconColor="#92400E" value={shieldRes.count ?? 0} label="Shield Members" />
        <StatCard icon={<DisputeIcon width={16} height={16} />} iconColor="#BE123C" value={disputesRes.count ?? 0} label="Open Disputes" />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <section>
          <SectionHeader title="Needs attention" description="Queues requiring an admin review" />
          <div className="grid gap-3">
            <Link href="/admin/shield" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-gold/20 bg-gold/10">
                <ShieldIcon width={18} height={18} stroke="#92400E" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-light">{shieldPendingRes.count ?? 0} Pending</div>
                <div className="text-[11px] text-muted">Shield Requests</div>
              </div>
            </Link>
            <Link href="/admin/disputes" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-zgreen/20 bg-zgreen/10">
                <DisputeIcon width={18} height={18} stroke="#047857" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-light">{disputesRes.count ?? 0} Open</div>
                <div className="text-[11px] text-muted">Disputes</div>
              </div>
            </Link>
          </div>
        </section>

        <section>
          <SectionHeader
            title="Recent deals"
            description="Latest activity across creator-brand work"
            action={<Link href="/admin/deals" className="font-semibold text-accent">View all</Link>}
          />
          <DealsTable deals={recentDeals} />
        </section>
      </div>
    </div>
  );
}
