import { createClient } from "@/lib/supabase/server";
import { DealsTable, type AdminDealRow } from "@/components/admin/DealsTable";

export default async function AdminDealsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select("id,title,platform,amount,status,brand:profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name)")
    .order("created_at", { ascending: false });

  const deals: AdminDealRow[] = (data ?? []).map((d) => ({
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-white">All Deals</h2>
        <div className="text-xs text-muted">{deals.length} total</div>
      </div>
      <DealsTable deals={deals} />
    </div>
  );
}
