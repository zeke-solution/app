import { createClient } from "@/lib/supabase/server";
import { DisputeCard, type DisputeRow } from "@/components/admin/DisputeCard";

export default async function AdminDisputesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("disputes")
    .select(
      "id,deal_id,reason,created_at,deals(id,profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name)),raiser:profiles!disputes_raised_by_fkey(display_name)"
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const disputes: DisputeRow[] = (data ?? []).map((d) => {
    const deal = d.deals as unknown as { id: string; profiles?: { display_name?: string }; creator?: { display_name?: string } } | null;
    return {
      id: d.id,
      dealId: deal?.id ?? d.deal_id,
      reason: d.reason,
      createdAt: d.created_at,
      brandName: deal?.profiles?.display_name ?? "Brand",
      creatorName: deal?.creator?.display_name ?? "Creator",
      raiserName: (d.raiser as unknown as { display_name?: string } | null)?.display_name ?? "User",
    };
  });

  return (
    <div>
      <h2 className="text-xl font-black text-white">Disputes</h2>
      <p className="mb-5 mt-1 text-sm text-muted">Active disputes between creators and brands</p>
      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">No open disputes.</div>
      ) : (
        disputes.map((d) => <DisputeCard key={d.id} dispute={d} />)
      )}
    </div>
  );
}
