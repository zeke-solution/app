import { createClient } from "@/lib/supabase/server";
import { DealsTable, type AdminDealRow } from "@/components/admin/DealsTable";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader
        eyebrow="Operations"
        title="All deals"
        description="Review every creator-brand workflow and open the complete deal record."
        actions={<span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted">{deals.length} total</span>}
      />
      <DealsTable deals={deals} />
    </div>
  );
}
