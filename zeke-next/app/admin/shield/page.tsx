import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShieldRequestCard, type ShieldRequestRow } from "@/components/admin/ShieldRequestCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminShieldPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("shield_requests")
    .select("id,influencer_id,amount,requested_at,profiles!shield_requests_influencer_id_fkey(display_name,location)")
    .eq("status", "pending")
    .order("requested_at", { ascending: true });

  const requests: ShieldRequestRow[] = (data ?? []).map((r) => {
    const p = r.profiles as unknown as { display_name?: string; location?: string } | null;
    return {
      id: r.id,
      influencer_id: r.influencer_id,
      amount: r.amount,
      requested_at: r.requested_at,
      creatorName: p?.display_name ?? "Creator",
      location: p?.location ?? "",
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Membership queue"
        title="Shield requests"
        description="Confirm an offline payment before activating a creator's Shield membership."
        actions={
          <>
            <Link href="/admin/shield/cases" className="rounded-lg border border-purple/25 bg-purple/[0.06] px-3 py-2 text-sm font-semibold text-purple">Shield cases</Link>
            <Link href="/admin/legal-pool" className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-sm font-semibold text-gold">Legal pool</Link>
          </>
        }
      />
      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center text-muted">
          No pending Shield requests.
        </div>
      ) : (
        requests.map((r) => <ShieldRequestCard key={r.id} request={r} />)
      )}
    </div>
  );
}
