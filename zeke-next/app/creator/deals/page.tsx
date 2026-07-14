import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { DealCard } from "@/components/deals/DealCard";

export default async function CreatorDealsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select("id,title,platform,amount,status,brand:profiles!deals_brand_id_fkey(display_name)")
    .eq("influencer_id", session.id)
    .not("status", "in", '("negotiating","cancelled")')
    .order("updated_at", { ascending: false });

  const deals = data ?? [];

  return (
    <div>
      <h2 className="mb-4 text-xl font-black text-white">Deals</h2>
      {deals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">
          No active deals yet.
        </div>
      ) : (
        deals.map((d) => (
          <DealCard
            key={d.id}
            href={`/creator/deals/${d.id}`}
            counterpartName={(d.brand as { display_name?: string } | null)?.display_name ?? "Brand"}
            title={d.title}
            platform={d.platform}
            amount={d.amount}
            status={d.status as DealStatus}
          />
        ))
      )}
    </div>
  );
}
