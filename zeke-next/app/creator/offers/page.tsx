import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { OfferActions } from "@/components/offers/OfferActions";
import { OffersIcon } from "@/components/layout/icons";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function CreatorOffersPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select("id,title,platform,amount,updated_at,brand:profiles!deals_brand_id_fkey(display_name)")
    .eq("influencer_id", session.id)
    .eq("status", "negotiating")
    .order("created_at", { ascending: false });

  const offers = data ?? [];

  return (
    <div>
      <PageHeader
        title="Offers"
        description="Review new campaign invitations and decide what moves into negotiation."
        actions={<span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted">{offers.length} open</span>}
      />
      {offers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-12 text-center text-muted">
          <OffersIcon width={32} height={32} className="opacity-40" />
          <span>No new offers right now.</span>
        </div>
      ) : (
        offers.map((d) => {
          const brandName = (d.brand as { display_name?: string } | null)?.display_name ?? "Brand";
          return (
            <div key={d.id} className="mb-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-[11px] font-semibold text-accent">
                    {brandName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-light">{brandName}</div>
                    <div className="text-xs text-muted">
                      {d.title} {d.platform ? `· ${d.platform}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-sm font-semibold text-gold">₹{fmtNum(d.amount)}</div>
              </div>
              <OfferActions dealId={d.id} seenUpdatedAt={d.updated_at ?? ""} />
            </div>
          );
        })
      )}
    </div>
  );
}
