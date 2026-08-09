import { createClient } from "@/lib/supabase/server";
import { DisputeCard, type DisputeRow } from "@/components/admin/DisputeCard";

export default async function AdminDisputesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("disputes")
    .select("id,deal_id,reason,created_at,deals(id,profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name)),raiser:profiles!disputes_raised_by_fkey(display_name),shield_cases(id,status)")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const disputes: DisputeRow[] = (data ?? []).map((row) => {
    const d = row as unknown as {
      id: string;
      deal_id: string;
      reason: string;
      created_at: string | null;
      deals: { id: string; profiles?: { display_name?: string }; creator?: { display_name?: string } } | null;
      raiser: { display_name?: string } | null;
      shield_cases: Array<{ id: string; status: string }> | { id: string; status: string } | null;
    };
    const shieldCase = Array.isArray(d.shield_cases) ? d.shield_cases[0] : d.shield_cases;
    return {
      id: d.id,
      dealId: d.deals?.id ?? d.deal_id,
      reason: d.reason,
      createdAt: d.created_at,
      brandName: d.deals?.profiles?.display_name ?? "Brand",
      creatorName: d.deals?.creator?.display_name ?? "Creator",
      raiserName: d.raiser?.display_name ?? "User",
      shieldCaseId: shieldCase?.id ?? null,
      shieldCaseStatus: shieldCase?.status ?? null,
    };
  });

  return (
    <div>
      <h2 className="text-xl font-black text-white">Disputes</h2>
      <p className="mb-5 mt-1 text-sm text-muted">Standard disputes stay in general resolution. Shield-protected disputes also receive a dedicated coordination case.</p>
      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">No open disputes.</div>
      ) : (
        disputes.map((dispute) => <DisputeCard key={dispute.id} dispute={dispute} />)
      )}
    </div>
  );
}
