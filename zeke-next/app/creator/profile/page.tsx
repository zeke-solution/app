import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { Card } from "@/components/ui/Card";
import { InfluencerProfileForm } from "@/components/profile/InfluencerProfileForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ShareProfileLink } from "@/components/profile/ShareProfileLink";
import { ShieldUpsellCard } from "@/components/profile/ShieldUpsellCard";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <div className="max-w-2xl space-y-5">
      <PageHeader title="My profile" />

      {/* Header card: avatar + identity */}
      <Card className="overflow-visible">
        <div className="flex flex-col items-center text-center">
          <div className="-mt-8">
            <AvatarUpload userId={session.id} avatarUrl={session.profile.avatar_url} initials={initials} />
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-bold text-light">{session.profile.display_name}</h1>
            <p className="mt-1 text-sm text-muted">
              {[inf?.handle ? `@${inf.handle}` : null, session.profile.location].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs font-semibold text-muted">
                {inf?.niche || "General"}
              </span>
              <span className="rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-xs font-semibold text-muted">
                {isShield ? "🛡 Shield Member" : "Free Creator"}
              </span>
            </div>
            {inf?.handle && (
              <div className="mt-3 flex justify-center">
                <ShareProfileLink handle={inf.handle} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Platform stats */}
      <Card>
        <div className="grid grid-cols-3 gap-3">
          <PlatformStat label="Instagram" value={inf?.ig_followers} />
          {inf?.yt_enabled && <PlatformStat label="YouTube" value={inf?.yt_followers} />}
          {inf?.x_enabled && <PlatformStat label="Twitter / X" value={inf?.x_followers} />}
        </div>
      </Card>

      {/* Deal history */}
      <Card>
        <div className="mb-2 text-sm font-semibold text-light">Deal History</div>
        {deals.length === 0 ? (
          <div className="text-sm text-muted">No deals yet.</div>
        ) : (
          <div className="space-y-0">
            {deals.map((d) => {
              const meta = DEAL_STATUS_META[d.status as DealStatus];
              const brandName = (d.brand as { display_name?: string } | null)?.display_name ?? "Brand";
              return (
                <div key={d.id} className="flex items-center justify-between border-t border-border py-2.5 first:border-t-0 first:pt-0 last:border-b-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-light">{brandName}</div>
                    <div className="mt-0.5 truncate text-xs text-muted">{d.title}</div>
                  </div>
                  <div className="ml-3 text-right">
                    <div className="text-sm font-semibold" style={{ color: meta.color }}>
                      ₹{fmtNum(d.amount)}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{dealStatusLabel(d.status as DealStatus)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Profile form */}
      <InfluencerProfileForm inf={inf} />

      {/* Shield upsell */}
      {!isShield && <ShieldUpsellCard initialStatus={shieldStatus} />}

      {/* Account */}
      <Card>
        <div className="mb-2 text-sm font-semibold text-light">Account</div>
        <SignOutButton fullWidth />
      </Card>
    </div>
  );
}

function PlatformStat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-dark p-4 text-center">
      <div className="text-base font-bold text-light">{value ? fmtNum(value) : "--"}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
