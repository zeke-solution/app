import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DisputeCard, type DisputeRow } from "@/components/admin/DisputeCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminDisputesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const status = params.status === "open" || params.status === "resolved" ? params.status : "all";

  let query = supabase
    .from("disputes")
    .select("id,deal_id,reason,status,resolution,created_at,resolved_at,previous_deal_status,deals(id,profiles!deals_brand_id_fkey(display_name),creator:profiles!deals_influencer_id_fkey(display_name)),raiser:profiles!disputes_raised_by_fkey(display_name),shield_cases(id,status)")
    .order("created_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;

  const disputes: DisputeRow[] = (data ?? []).map((row) => {
    const d = row as unknown as {
      id: string;
      deal_id: string;
      reason: string;
      status: string | null;
      resolution: string | null;
      created_at: string | null;
      resolved_at: string | null;
      previous_deal_status: string | null;
      deals: { id: string; profiles?: { display_name?: string }; creator?: { display_name?: string } } | null;
      raiser: { display_name?: string } | null;
      shield_cases: Array<{ id: string; status: string }> | { id: string; status: string } | null;
    };
    const shieldCase = Array.isArray(d.shield_cases) ? d.shield_cases[0] : d.shield_cases;
    return {
      id: d.id,
      dealId: d.deals?.id ?? d.deal_id,
      reason: d.reason,
      status: d.status ?? "open",
      resolution: d.resolution,
      createdAt: d.created_at,
      resolvedAt: d.resolved_at,
      previousDealStatus: d.previous_deal_status,
      brandName: d.deals?.profiles?.display_name ?? "Brand",
      creatorName: d.deals?.creator?.display_name ?? "Creator",
      raiserName: d.raiser?.display_name ?? "User",
      shieldCaseId: shieldCase?.id ?? null,
      shieldCaseStatus: shieldCase?.status ?? null,
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Resolution queue"
        title="Disputes"
        description="Standard disputes stay here; Shield-protected disputes also receive a dedicated coordination case."
        actions={<span className="rounded-md bg-card px-3 py-1.5 text-sm font-semibold text-muted">{disputes.length} records</span>}
      />
      <nav aria-label="Dispute status" className="mb-5 flex flex-wrap gap-2 rounded-xl bg-card p-2">
        {[["all", "All"], ["open", "Open"], ["resolved", "Resolved"]].map(([key, label]) => <Link key={key} href={`/admin/disputes?status=${key}`} className={`rounded-lg px-3 py-2 text-sm font-semibold ${status === key ? "bg-accent text-white" : "text-muted hover:bg-dark hover:text-light"}`}>{label}</Link>)}
      </nav>
      {disputes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">No {status === "all" ? "dispute" : status} records.</div>
      ) : (
        disputes.map((dispute) => <DisputeCard key={dispute.id} dispute={dispute} />)
      )}
    </div>
  );
}
