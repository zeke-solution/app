import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ShieldRequestCard, type ShieldRequestRow } from "@/components/admin/ShieldRequestCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function AdminShieldPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const status = ["pending", "activated", "rejected"].includes(params.status ?? "") ? params.status! : "all";

  let query = supabase
    .from("shield_requests")
    .select("id,influencer_id,amount,status,requested_at,activated_at,expires_at,note,profiles!shield_requests_influencer_id_fkey(display_name,location)")
    .order("requested_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;

  const requests: ShieldRequestRow[] = (data ?? []).map((r) => {
    const p = r.profiles as unknown as { display_name?: string; location?: string } | null;
    return {
      id: r.id,
      influencer_id: r.influencer_id,
      amount: r.amount,
      status: r.status,
      requested_at: r.requested_at,
      activated_at: r.activated_at,
      expires_at: r.expires_at,
      note: r.note,
      creatorName: p?.display_name ?? "Creator",
      location: p?.location ?? "",
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Membership queue"
        title="Shield requests"
        description="Review the complete membership request history and act on pending offline-payment confirmations."
        actions={
          <>
            <Link href="/admin/shield/cases" className="rounded-lg border border-purple/25 bg-purple/[0.06] px-3 py-2 text-sm font-semibold text-purple">Shield cases</Link>
            <Link href="/admin/legal-pool" className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-sm font-semibold text-gold">Legal pool</Link>
          </>
        }
      />
      <nav aria-label="Shield request status" className="mb-5 flex flex-wrap gap-2 rounded-xl bg-card p-2">
        {[
          ["all", "All"],
          ["pending", "Pending"],
          ["activated", "Activated"],
          ["rejected", "Rejected"],
        ].map(([key, label]) => (
          <Link key={key} href={`/admin/shield?status=${key}`} className={`rounded-lg px-3 py-2 text-sm font-semibold ${status === key ? "bg-accent text-white" : "text-muted hover:bg-dark hover:text-light"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center text-muted">
          No {status === "all" ? "Shield" : status} requests.
        </div>
      ) : (
        requests.map((r) => <ShieldRequestCard key={r.id} request={r} />)
      )}
    </div>
  );
}
