import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { brandDealNeedsAttention, brandDealNextStep } from "@/lib/domain/brand-workflow";
import { PageHeader } from "@/components/layout/PageHeader";
import { DealStatusBadge } from "@/components/deals/DealStatusBadge";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { buttonClassName } from "@/components/ui/Button";

type PartnershipView = "attention" | "negotiating" | "active" | "completed" | "all";

interface PartnershipRow {
  id: string;
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

const VIEWS: { key: PartnershipView; label: string }[] = [
  { key: "attention", label: "Needs attention" },
  { key: "negotiating", label: "Negotiating" },
  { key: "active", label: "Active" },
  { key: "completed", label: "History" },
  { key: "all", label: "All" },
];

export default async function BrandPartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSessionProfile();
  if (!session) return null;
  const requestedView = (await searchParams).view;
  const view = VIEWS.some((item) => item.key === requestedView)
    ? (requestedView as PartnershipView)
    : "attention";
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select(
      "id,title,platform,amount,status,updated_at,cancel_requested_by,creator:profiles!deals_influencer_id_fkey(display_name,avatar_url)",
    )
    .eq("brand_id", session.id)
    .order("updated_at", { ascending: false });

  const partnerships = (data ?? []) as unknown as PartnershipRow[];
  const counts = Object.fromEntries(
    VIEWS.map((item) => [
      item.key,
      partnerships.filter((partnership) => matchesView(partnership, item.key, session.id)).length,
    ]),
  ) as Record<PartnershipView, number>;
  const visible = partnerships.filter((partnership) =>
    matchesView(partnership, view, session.id),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Brand workspace"
        title="Partnerships"
        description="Negotiations, delivery, approvals, and payments in one place."
        actions={
          <Link href="/brand/discover" className={buttonClassName({ size: "sm" })}>
            Find creators
          </Link>
        }
      />

      <nav aria-label="Partnership filters" className="mb-5 flex flex-wrap gap-2">
        {VIEWS.map((item) => {
          const active = item.key === view;
          return (
            <Link
              key={item.key}
              href={`/brand/partnerships?view=${item.key}`}
              aria-current={active ? "page" : undefined}
              className={
                "flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors " +
                (active ? "bg-accent text-white" : "bg-card text-muted hover:text-light")
              }
            >
              {item.label}
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[11px] " +
                  (active ? "bg-white/15 text-white" : "bg-dark text-muted")
                }
              >
                {counts[item.key]}
              </span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <EmptyPartnerships view={view} hasPartnerships={partnerships.length > 0} />
      ) : (
        <div className="space-y-2.5">
          {visible.map((partnership) => (
            <PartnershipCard key={partnership.id} partnership={partnership} brandId={session.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function matchesView(partnership: PartnershipRow, view: PartnershipView, brandId: string) {
  if (view === "all") return true;
  if (view === "attention") return needsAttention(partnership, brandId);
  if (view === "negotiating") return partnership.status === "negotiating";
  if (view === "completed") {
    return partnership.status === "completed" || partnership.status === "cancelled";
  }
  return !["negotiating", "completed", "cancelled"].includes(partnership.status);
}

function needsAttention(partnership: PartnershipRow, brandId: string) {
  return brandDealNeedsAttention(partnership, brandId);
}

function PartnershipCard({ partnership, brandId }: { partnership: PartnershipRow; brandId: string }) {
  const creatorName = partnership.creator?.display_name ?? "Creator";
  const action = brandDealNextStep(partnership, brandId);

  return (
    <article className="rounded-2xl bg-card p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ProfileAvatar
            name={creatorName}
            avatarUrl={partnership.creator?.avatar_url}
            className="h-11 w-11 rounded-xl bg-accent/10 text-xs text-accent"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-black text-light">{creatorName}</h2>
              <DealStatusBadge status={partnership.status} viewer="brand" />
            </div>
            <p className="mt-1 truncate text-sm text-muted">
              {partnership.title}{partnership.platform ? ` · ${partnership.platform}` : ""}
            </p>
            <p className="mt-2 text-xs font-semibold text-light">{action.detail}</p>
            <p className="mt-1 text-[11px] text-muted">
              Updated {fmtDate(partnership.updated_at)} · {dealStatusLabel(partnership.status, "brand")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div className="text-sm font-black text-gold">&#8377;{fmtNum(partnership.amount)}</div>
          <Link
            href={action.href}
            className={buttonClassName({
              variant: needsAttention(partnership, brandId) ? "primary" : "outline",
              size: "sm",
            })}
          >
            {action.label}
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyPartnerships({ view, hasPartnerships }: { view: PartnershipView; hasPartnerships: boolean }) {
  if (view === "attention" && hasPartnerships) {
    return (
      <div className="rounded-2xl bg-zgreen/[0.08] p-8 text-center sm:p-10">
        <div className="text-sm font-black text-zgreen">You are caught up</div>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Nothing needs a response right now. Active partnerships remain available in the Active view.
        </p>
        <Link
          href="/brand/partnerships?view=active"
          className={buttonClassName({ variant: "outline", size: "sm", className: "mt-4" })}
        >
          View active work
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-8 text-center sm:p-12">
      <div className="text-sm font-black text-light">No partnerships here yet</div>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        Find a creator and send an active campaign brief to begin.
      </p>
      <Link href="/brand/discover" className={buttonClassName({ size: "sm", className: "mt-4" })}>
        Find creators
      </Link>
    </div>
  );
}
