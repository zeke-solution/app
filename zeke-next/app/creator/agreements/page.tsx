import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AgreementPreview } from "@/components/agreements/AgreementPreview";
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
      <p className="mb-5 mt-1 text-xs text-muted">Official campaign records generated after acceptance</p>

      {agreements.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">
          No agreements yet.
        </div>
      ) : (
        agreements.map((agreement) => {
          const deal = agreement.deals as unknown as {
            id: string;
            title: string | null;
            amount: number | null;
            deliverables: string | null;
            platform: string | null;
            brand: { display_name?: string } | null;
          };
          return (
            <div key={agreement.id} className="mb-5 space-y-3">
              <AgreementPreview
                agreementId={agreement.id}
                brandName={deal.brand?.display_name ?? "Brand"}
                creatorName={session.profile.display_name}
                title={deal.title}
                platform={deal.platform}
                amount={deal.amount}
                deliverables={deal.deliverables}
                generatedAt={agreement.generated_at}
              />
              {isShield ? (
                <a
                  href={`/api/agreements/${agreement.id}/pdf`}
                  className="block w-full rounded-lg border border-border py-2.5 text-center text-xs font-bold text-light"
                >
                  &#11015; Download official PDF
                </a>
              ) : (
                <div className="text-center text-[11px] text-muted">PDF available to Shield members only.</div>
              )}
            </div>
          );
        })
      )}

      <div className="mt-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-3.5 text-xs leading-relaxed text-muted">
        <span className="font-bold text-gold">How agreements work -</span> Generated when the creator accepts the offer. The accepted terms are locked immediately.
      </div>
    </div>
  );
}