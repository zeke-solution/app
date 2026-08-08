import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { AgreementIcon } from "@/components/layout/icons";
import { Badge } from "@/components/ui/Badge";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";

export default async function CreatorAgreementsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();
  const isShield = isShieldMembershipActive(session.inf);

  const { data } = await supabase
    .from("agreements")
    .select(
      "id, generated_at, deals!inner(id,title,amount,deliverables,platform,deadline,influencer_id,brand:profiles!deals_brand_id_fkey(display_name))"
    )
    .eq("deals.influencer_id", session.id);

  const agreements = data ?? [];

  return (
    <div>
      <h2 className="text-xl font-black text-white">Agreements</h2>
      <p className="mb-5 mt-1 text-xs text-muted">Auto-generated when both sides agree on terms</p>

      {agreements.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">
          No agreements yet.
        </div>
      ) : (
        agreements.map((a) => {
          const deal = a.deals as unknown as {
            id: string;
            title: string | null;
            amount: number | null;
            deliverables: string | null;
            platform: string | null;
            brand: { display_name?: string } | null;
          };
          const brandName = deal.brand?.display_name ?? "Brand";
          return (
            <div key={a.id} className="mb-3 rounded-2xl border border-zgreen/25 bg-card p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] border border-zgreen/25 bg-zgreen/10">
                    <AgreementIcon width={18} height={18} stroke="#059669" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {brandName} × {session.profile.display_name}
                    </div>
                    <div className="text-xs text-muted">
                      {deal.title} · {fmtDate(a.generated_at)}
                    </div>
                  </div>
                </div>
                <Badge variant="green">Active</Badge>
              </div>
              <div className="mt-2.5 rounded-xl bg-dark px-3.5 py-2.5 text-xs leading-relaxed text-muted">
                <div>
                  <span className="font-semibold text-light">Title:</span> {deal.title}
                </div>
                <div>
                  <span className="font-semibold text-light">Platform:</span> {deal.platform || "-"}
                </div>
                <div>
                  <span className="font-semibold text-light">Value:</span> ₹{fmtNum(deal.amount)}
                </div>
                {deal.deliverables && (
                  <div>
                    <span className="font-semibold text-light">Deliverables:</span> {deal.deliverables}
                  </div>
                )}
              </div>
              <div className="mt-2.5 border-t border-border pt-2.5">
                {isShield ? (
                  <a
                    href={`/api/agreements/${a.id}/pdf`}
                    className="block w-full rounded-lg border border-border py-2 text-center text-xs font-bold text-light"
                  >
                    &#11015; Download PDF
                  </a>
                ) : (
                  <div className="text-center text-[11px] text-muted">
                    🛡 PDF available to Shield members only.
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="mt-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-3.5 text-xs leading-relaxed text-muted">
        <span className="font-bold text-gold">How agreements work -</span> Generated the moment
        both sides accept deal terms. Terms are locked immediately.
      </div>
    </div>
  );
}
