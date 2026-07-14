import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { DealCard } from "@/components/deals/DealCard";

export default async function BrandDealsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select("id,title,platform,amount,status,creator:profiles!deals_influencer_id_fkey(display_name)")
    .eq("brand_id", session.id)
    .not("status", "eq", "cancelled")
    .order("updated_at", { ascending: false });

  const deals = data ?? [];

  return (
    <div>
      <h2 className="mb-4 text-xl font-black text-white">Deals</h2>
      {deals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">
          No deals yet.
        </div>
      ) : (
        deals.map((d) => (
          <DealCard
            key={d.id}
            href={`/brand/deals/${d.id}`}
            counterpartName={(d.creator as { display_name?: string } | null)?.display_name ?? "Creator"}
            title={d.title}
            platform={d.platform}
            amount={d.amount}
            status={d.status as DealStatus}
            viewer="brand"
          />
        ))
      )}
    </div>
  );
}
