import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { DealCard, DealListHeader } from "@/components/deals/DealCard";
import { PageHeader } from "@/components/layout/PageHeader";

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
      <PageHeader
        title="Deals"
        description="Accepted campaigns, deliverables, approvals, and payment progress."
        actions={<span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted">{deals.length} total</span>}
      />
      {deals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">
          No accepted deals yet. Offer negotiations remain in Chats.
        </div>
      ) : (
        <>
          <DealListHeader />
          {deals.map((d) => (
            <DealCard
              key={d.id}
              href={`/creator/deals/${d.id}`}
              counterpartName={(d.brand as { display_name?: string } | null)?.display_name ?? "Brand"}
              title={d.title}
              platform={d.platform}
              amount={d.amount}
              status={d.status as DealStatus}
            />
          ))}
        </>
      )}
    </div>
  );
}
