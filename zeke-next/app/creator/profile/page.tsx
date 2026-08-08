import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { Card } from "@/components/ui/Card";
import { InfluencerProfileForm } from "@/components/profile/InfluencerProfileForm";
import { ShieldUpsellCard } from "@/components/profile/ShieldUpsellCard";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";

export default async function CreatorProfilePage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();
  const inf = session.inf;
  const isShield = isShieldMembershipActive(inf);

  const [dealsRes, pendingShieldRes] = await Promise.all([
    supabase
      .from("deals")
      .select("id,title,amount,status,brand:profiles!deals_brand_id_fkey(display_name)")
      .eq("influencer_id", session.id)
      .order("updated_at", { ascending: false })
      .limit(3),
    isShield
      ? Promise.resolve({ data: null })
      : supabase
          .from("shield_requests")
          .select("id")
          .eq("influencer_id", session.id)
          .eq("status", "pending")
          .maybeSingle(),
  ]);

  const deals = dealsRes.data ?? [];
  const shieldStatus = isShield ? "active" : pendingShieldRes.data ? "pending" : "none";
  const initials = session.profile.display_name.slice(0, 2).toUpperCase();

  return (
    <div>
      <h2 className="text-xl font-black text-white">My Profile</h2>
      <p className="mb-5 mt-1 text-sm text-muted">How brands see you on Zeke</p>

      <Card className="mb-4">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/20 text-base font-black text-accent">
            {initials}
          </div>
          <div>
            <div className="text-lg font-black text-white">{session.profile.display_name}</div>
            <div className="text-[13px] text-muted">
              {[inf?.handle ? `@${inf.handle}` : null, session.profile.location].filter(Boolean).join(" · ")}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-bold text-muted">
                {inf?.niche || "--"}
              </span>
              <span className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-bold text-muted">
                {isShield ? "🛡 Shield Member" : "Free Creator"}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2.5">
          <PlatformStat label="Instagram" value={inf?.ig_followers} />
          {inf?.yt_enabled && <PlatformStat label="YouTube" value={inf?.yt_followers} />}
          {inf?.x_enabled && <PlatformStat label="Twitter / X" value={inf?.x_followers} />}
        </div>

        <div className="mb-4 rounded-xl border border-border bg-dark p-3">
          <div className="mb-2.5 text-xs font-bold text-light">Deal History</div>
          {deals.length === 0 ? (
            <div className="text-xs text-muted">No deals yet.</div>
          ) : (
            deals.map((d) => {
              const meta = DEAL_STATUS_META[d.status as DealStatus];
              const brandName = (d.brand as { display_name?: string } | null)?.display_name ?? "Brand";
              return (
                <div key={d.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <div>
                    <div className="text-xs font-semibold text-white">{brandName}</div>
                    <div className="text-[11px] text-muted">{d.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold" style={{ color: meta.color }}>
                      ₹{fmtNum(d.amount)}
                    </div>
                    <div className="text-[10px] text-muted">{dealStatusLabel(d.status as DealStatus)}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <ShieldUpsellCard initialStatus={shieldStatus} />
      </Card>

      <InfluencerProfileForm inf={inf} />
    </div>
  );
}

function PlatformStat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-dark p-3 text-center">
      <div className="text-base font-black text-white">{value ? fmtNum(value) : "--"}</div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  );
}
