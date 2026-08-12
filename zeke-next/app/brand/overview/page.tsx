import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { brandDealNeedsAttention, brandDealNextStep } from "@/lib/domain/brand-workflow";
import { fmtDate, fmtDateShort, fmtNum } from "@/lib/domain/format";
import { StatCard, StatGrid } from "@/components/ui/StatCard";
import { buttonClassName } from "@/components/ui/Button";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { DealStatusBadge } from "@/components/deals/DealStatusBadge";
import { CampaignIcon, DealsIcon, DisputeIcon } from "@/components/layout/icons";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";

interface OverviewDeal {
  id: string;
  campaign_id: string | null;
  title: string;
  platform: string | null;
  amount: number | null;
  status: DealStatus;
  updated_at: string | null;
  cancel_requested_by: string | null;
  creator: {
    display_name?: string;
    avatar_url?: string | null;
  } | null;
}

interface OverviewCampaign {
  id: string;
  title: string;
  platform: string | null;
  budget: number | null;
  deadline: string | null;
}

export default async function BrandOverviewPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const [campaignsResult, dealsResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id,title,platform,budget,deadline")
      .eq("brand_id", session.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("deals")
      .select(
        "id,campaign_id,title,platform,amount,status,updated_at,cancel_requested_by,creator:profiles!deals_influencer_id_fkey(display_name,avatar_url)",
      )
      .eq("brand_id", session.id)
      .order("updated_at", { ascending: false }),
  ]);

  const campaigns = (campaignsResult.data ?? []) as OverviewCampaign[];
  const deals = (dealsResult.data ?? []) as unknown as OverviewDeal[];
  const attention = deals.filter((deal) => brandDealNeedsAttention(deal, session.id));
  const activePartnerships = deals.filter(
    (deal) => !["negotiating", "completed", "cancelled"].includes(deal.status),
  );
  const totalSpent = deals
    .filter((deal) => deal.status === "completed")
    .reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Brand workspace"
        title={`Welcome back, ${session.profile.display_name}`}
        description="See what needs attention, then move campaigns forward from one place."
        actions={
          <>
            <Link href="/brand/campaigns?new=1" className={buttonClassName({ size: "sm" })}>
              New campaign
            </Link>
            <Link
              href="/brand/discover"
              className={buttonClassName({ variant: "outline", size: "sm" })}
            >
              Find creators
            </Link>
          </>
        }
      />

      <section className="mb-6">
        <SectionHeader
          title="Needs attention"
          description="The next decisions that are waiting on you"
          action={
            <Link href="/brand/partnerships" className="font-semibold text-accent">
              View workspace &#8594;
            </Link>
          }
        />
        {attention.length === 0 ? (
          <div className="rounded-2xl bg-zgreen/[0.08] p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="text-sm font-black text-zgreen">You are caught up</div>
              <p className="mt-1 text-sm text-muted">No creator response, review, payment, or dispute needs action.</p>
            </div>
            <Link
              href="/brand/partnerships?view=active"
              className="mt-3 inline-flex text-sm font-bold text-accent sm:mt-0"
            >
              View active work &#8594;
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {attention.slice(0, 5).map((deal) => (
              <AttentionItem key={deal.id} deal={deal} brandId={session.id} />
            ))}
          </div>
        )}
      </section>

      <StatGrid>
        <StatCard
          icon={<DisputeIcon width={18} height={18} />}
          iconColor="#BE123C"
          valueColor={attention.length ? "#BE123C" : "#047857"}
          value={attention.length}
          label="Needs Attention"
        />
        <StatCard
          icon={<CampaignIcon width={18} height={18} />}
          iconColor="#4338CA"
          valueColor="#4338CA"
          value={campaigns.length}
          label="Active Campaigns"
        />
        <StatCard
          icon={<DealsIcon width={18} height={18} />}
          iconColor="#047857"
          valueColor="#047857"
          value={activePartnerships.length}
          label="Active Partnerships"
        />
        <StatCard
          icon={<span className="text-base font-black">&#8377;</span>}
          iconColor="#92400E"
          value={`₹${fmtNum(totalSpent)}`}
          label="Total Spent"
        />
      </StatGrid>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <section className="min-w-0">
          <SectionHeader
            title="Active campaigns"
            description="Published briefs currently available to send"
            action={
              <Link href="/brand/campaigns" className="font-semibold text-accent">
                Manage &#8594;
              </Link>
            }
          />
          {campaigns.length === 0 ? (
            <CompactEmpty
              title="No active campaigns"
              text="Create a complete brief before inviting creators."
              href="/brand/campaigns?new=1"
              action="Create campaign"
            />
          ) : (
            <div className="space-y-2.5">
              {campaigns.slice(0, 3).map((campaign) => (
                <CampaignSummary
                  key={campaign.id}
                  campaign={campaign}
                  recipientCount={deals.filter((deal) => deal.campaign_id === campaign.id).length}
                />
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          <SectionHeader
            title="Recent partnerships"
            description="Latest activity across every creator relationship"
            action={
              <Link href="/brand/partnerships?view=all" className="font-semibold text-accent">
                View all &#8594;
              </Link>
            }
          />
          {deals.length === 0 ? (
            <CompactEmpty
              title="No partnerships yet"
              text="Choose a creator and send an active campaign."
              href="/brand/discover"
              action="Find creators"
            />
          ) : (
            <div className="space-y-2.5">
              {deals.slice(0, 4).map((deal) => (
                <RecentPartnership key={deal.id} deal={deal} brandId={session.id} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AttentionItem({ deal, brandId }: { deal: OverviewDeal; brandId: string }) {
  const creatorName = deal.creator?.display_name ?? "Creator";
  const next = brandDealNextStep(deal, brandId);
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center">
      <ProfileAvatar
        name={creatorName}
        avatarUrl={deal.creator?.avatar_url}
        className="h-10 w-10 rounded-xl bg-accent/10 text-[11px] text-accent"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-black text-light">{creatorName}</h3>
          <DealStatusBadge status={deal.status} viewer="brand" />
        </div>
        <p className="mt-1 truncate text-xs text-muted">{deal.title}</p>
        <p className="mt-1 text-xs font-semibold text-light">{next.detail}</p>
      </div>
      <Link href={next.href} className="min-h-10 self-start rounded-xl px-3 py-2 text-sm font-bold text-accent hover:bg-accent/[0.06] sm:self-auto">
        {next.label} &#8594;
      </Link>
    </article>
  );
}

function CampaignSummary({ campaign, recipientCount }: { campaign: OverviewCampaign; recipientCount: number }) {
  return (
    <article className="rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-light">{campaign.title}</h3>
          <p className="mt-1 text-xs text-muted">
            {campaign.platform ?? "Platform not set"}
            {campaign.deadline ? ` · Due ${fmtDateShort(campaign.deadline)}` : ""}
          </p>
          <p className="mt-2 text-xs font-semibold text-light">
            {recipientCount} {recipientCount === 1 ? "creator invited" : "creators invited"}
          </p>
        </div>
        <div className="flex-shrink-0 text-sm font-black text-gold">&#8377;{fmtNum(campaign.budget)}</div>
      </div>
    </article>
  );
}

function RecentPartnership({ deal, brandId }: { deal: OverviewDeal; brandId: string }) {
  const creatorName = deal.creator?.display_name ?? "Creator";
  const next = brandDealNextStep(deal, brandId);
  return (
    <Link href={next.href} className="flex min-w-0 items-center gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-navy">
      <ProfileAvatar
        name={creatorName}
        avatarUrl={deal.creator?.avatar_url}
        className="h-10 w-10 rounded-xl bg-accent/10 text-[11px] text-accent"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black text-light">{creatorName}</div>
        <div className="mt-0.5 truncate text-xs text-muted">{deal.title} · Updated {fmtDate(deal.updated_at)}</div>
      </div>
      <DealStatusBadge status={deal.status} viewer="brand" />
    </Link>
  );
}

function CompactEmpty({ title, text, href, action }: { title: string; text: string; href: string; action: string }) {
  return (
    <div className="rounded-2xl bg-card p-6 text-center">
      <div className="text-sm font-black text-light">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
      <Link href={href} className="mt-3 inline-flex min-h-10 items-center text-sm font-bold text-accent">
        {action} &#8594;
      </Link>
    </div>
  );
}
