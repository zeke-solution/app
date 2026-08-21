import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum, socialUrl } from "@/lib/domain/format";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { Card } from "@/components/ui/Card";
import { InfluencerProfileForm } from "@/components/profile/InfluencerProfileForm";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { ShareProfileLink } from "@/components/profile/ShareProfileLink";
import { ShieldUpsellCard } from "@/components/profile/ShieldUpsellCard";
import { isShieldMembershipActive } from "@/lib/domain/shield-membership";
import { ShieldTick } from "@/components/ui/ShieldTick";
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
    <div className="space-y-5">
      <PageHeader title="My profile" />

      {/* Identity header, laid out the way a social profile reads: avatar on the
          left, identity and audience numbers to its right, so the follower
          counts sit beside the person instead of in a separate card below. */}
      <Card className="overflow-visible">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex-shrink-0">
            <AvatarUpload userId={session.id} avatarUrl={session.profile.avatar_url} initials={initials} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="min-w-0 truncate text-xl font-semibold text-light">
                {session.profile.display_name}
              </h1>
              <ShieldTick shieldActive={isShield} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {[inf?.handle ? `@${inf.handle}` : null, session.profile.location].filter(Boolean).join(" · ")}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <PlatformStat
                label="Instagram"
                value={inf?.ig_followers}
                href={socialUrl("https://instagram.com/", inf?.handle)}
              />
              {inf?.yt_enabled && (
                <PlatformStat
                  label="YouTube"
                  value={inf?.yt_followers}
                  href={socialUrl("https://youtube.com/@", inf?.yt_handle)}
                />
              )}
              {inf?.x_enabled && (
                <PlatformStat
                  label="Twitter / X"
                  value={inf?.x_followers}
                  href={socialUrl("https://x.com/", inf?.x_handle)}
                />
              )}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border bg-navy px-2.5 py-0.5 text-xs font-semibold text-muted">
                {inf?.niche || "General"}
              </span>
              {/* Shield membership is already marked by the tick beside the name,
                  so only the absence of it needs saying here. */}
              {!isShield && (
                <span className="rounded-full border border-border bg-navy px-2.5 py-0.5 text-xs font-semibold text-muted">
                  Free Creator
                </span>
              )}
            </div>

            {inf?.handle && (
              <div className="mt-3.5">
                <ShareProfileLink handle={inf.handle} />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Below the identity header the page splits: the editing task on the
          left where it gets the wider column, reference and account on the
          right. Same grid idiom as the overview page, so the two dashboards
          share one rhythm. */}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="min-w-0 space-y-5">
          {/* Profile form */}
          <InfluencerProfileForm inf={inf} />
        </div>

        <div className="min-w-0 space-y-5">
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

          {/* Shield upsell */}
          {!isShield && <ShieldUpsellCard initialStatus={shieldStatus} />}

          {/* Account */}
          <Card>
            <div className="mb-2 text-sm font-semibold text-light">Account</div>
            <SignOutButton fullWidth />
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlatformStat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | null | undefined;
  /** The creator's profile on that network. Null when no handle is saved yet. */
  href?: string | null;
}) {
  // Count above label, reading as one unit, the way a social profile presents
  // audience size. No box: these sit inside the identity card now.
  const body = (
    <>
      <span className="text-base font-semibold text-light">{value ? fmtNum(value) : "--"}</span>
      <span className="text-xs text-muted">{label}</span>
    </>
  );

  if (!href) return <div className="flex flex-col">{body}</div>;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="-mx-2 flex flex-col rounded-lg px-2 py-0.5 transition-colors hover:bg-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {body}
    </a>
  );
}
