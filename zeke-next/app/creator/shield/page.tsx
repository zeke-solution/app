import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { SHIELD_MONTHLY_PRICE_INR } from "@/lib/domain/constants";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import { SHIELD_CASE_STATUS, LEGAL_PROVIDER_SCALE } from "@/lib/domain/shield-case";
import { fmtDate } from "@/lib/domain/format";
import { ShieldCoverage } from "@/components/shield/ShieldCoverage";
import { buttonClassName } from "@/components/ui/Button";

interface CaseSummary {
  id: string;
  status: keyof typeof SHIELD_CASE_STATUS;
  opened_at: string;
  updated_at: string;
  dispute: {
    reason?: string;
    deal?: {
      title?: string;
      brand?: { display_name?: string } | null;
    } | null;
  } | null;
}

interface ProviderSummary {
  id: string;
  display_name: string;
  firm_scale: keyof typeof LEGAL_PROVIDER_SCALE;
  city: string | null;
  state: string | null;
  matter_types: string[];
  verified_at: string | null;
}

export default async function CreatorShieldPage() {
  const session = await requireRole("influencer");
  const supabase = await createClient();
  const isShield = isShieldMembershipActive(session.inf);

  const [casesResult, providersResult] = isShield
    ? await Promise.all([
        supabase
          .from("shield_cases")
          .select(
            "id,status,opened_at,updated_at,dispute:disputes(reason,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name)))"
          )
          .eq("creator_id", session.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("legal_providers")
          .select("id,display_name,provider_type,firm_scale,city,state,matter_types,verified_at")
          .eq("active", true)
          .order("display_name")
          .limit(4),
      ])
    : [{ data: [] }, { data: [] }];

  const cases = (casesResult.data ?? []) as unknown as CaseSummary[];
  const providers = (providersResult.data ?? []) as ProviderSummary[];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Zeke Shield</div>
          <h1 className="mt-1 text-xl font-black text-light">Protection you control</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
            Assisted follow-ups, documented table talks, and a clear route to independent legal help if you choose it.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${isShield ? "border-gold/35 bg-gold/10 text-gold" : "border-border text-muted"}`}>
          {isShield ? "Shield active" : `Optional · ₹${SHIELD_MONTHLY_PRICE_INR}/month`}
        </span>
      </div>

      {!isShield && (
        <div className="mb-5 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.10] to-transparent p-5">
          <h2 className="text-base font-extrabold text-light">Activate Shield before you need it</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Shield is a monthly support membership. It covers Zeke&apos;s follow-up and coordination work; it does not pay lawyer or court costs.
          </p>
          <Link
            href="/creator/shield/payment"
            className={buttonClassName({ variant: "gold", className: "mt-4" })}
          >
            Continue to Shield payment
          </Link>
        </div>
      )}

      <ShieldCoverage />

      {isShield && (
        <>
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-light">Your Shield cases</h2>
                <p className="mt-0.5 text-xs text-muted">Every decision, update and document stays in one case record.</p>
              </div>
              <Link href="/creator/deals" className="text-xs font-semibold text-accent hover:text-purple">
                View deals
              </Link>
            </div>
            {cases.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <div className="text-sm font-bold text-light">No Shield cases</div>
                <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-muted">
                  If a campaign problem is opened as a dispute, an eligible Shield case appears here automatically.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {cases.map((item) => {
                  const meta = SHIELD_CASE_STATUS[item.status];
                  return (
                    <Link key={item.id} href={`/creator/shield/cases/${item.id}`} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-gold/35">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-bold text-light">{item.dispute?.deal?.title ?? "Shield case"}</div>
                          <div className="mt-0.5 text-xs text-muted">{item.dispute?.deal?.brand?.display_name ?? "Brand"}</div>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: meta.color, background: `${meta.color}1A` }}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-light">{item.dispute?.reason ?? "Case details available."}</p>
                      <div className="mt-3 text-[10px] text-muted">Updated {fmtDate(item.updated_at)}</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-6">
            <h2 className="text-base font-extrabold text-light">Independent legal-provider pool</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Factual profiles only - no rankings, paid placement or referral commission. You contact and hire a provider directly.
            </p>
            {providers.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-border bg-card p-5 text-sm text-muted">
                Providers will appear here after Zeke completes its verification checks.
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {providers.map((provider) => (
                  <div key={provider.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-light">{provider.display_name}</div>
                      {provider.verified_at && <span className="rounded-full bg-zgreen/10 px-2 py-0.5 text-[9px] font-bold text-zgreen">Verified record</span>}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {LEGAL_PROVIDER_SCALE[provider.firm_scale]} · {[provider.city, provider.state].filter(Boolean).join(", ") || "Location on request"}
                    </div>
                    {provider.matter_types.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {provider.matter_types.slice(0, 4).map((matter) => (
                          <span key={matter} className="rounded-full border border-border px-2 py-0.5 text-[9px] text-muted">{matter}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
