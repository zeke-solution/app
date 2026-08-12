import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtNum } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminRemoveButton } from "@/components/admin/AdminRemoveButton";

interface AdminCampaignRow {
  id: string;
  title: string;
  niche: string | null;
  budget: number | null;
  currency: string | null;
  deadline: string | null;
  description: string | null;
  platform: string | null;
  objective: string | null;
  deliverables: string | null;
  creator_requirements: string | null;
  usage_rights: string | null;
  exclusivity: boolean;
  payment_terms: string | null;
  status: string | null;
  created_at: string | null;
  brand: { display_name?: string } | null;
  deals: Array<{ id: string; status: string; amount: number | null }>;
}

export default async function AdminCampaignsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      "id,title,niche,budget,currency,deadline,description,platform,objective,deliverables,creator_requirements,usage_rights,exclusivity,payment_terms,status,created_at,brand:profiles!campaigns_brand_id_fkey(display_name),deals(id,status,amount)",
    )
    .order("created_at", { ascending: false });

  const campaigns = (data ?? []) as unknown as AdminCampaignRow[];

  return (
    <div>
      <PageHeader
        eyebrow="Campaign operations"
        title="Campaigns"
        description="Inspect every campaign brief, its commercial terms, recipient deals, and current lifecycle status."
        actions={
          <span className="rounded-md bg-card px-3 py-1.5 text-sm font-semibold text-muted">
            {campaigns.length} records
          </span>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          Campaign records could not be loaded.
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const activeDeals = campaign.deals.filter(
            (deal) => !["completed", "cancelled"].includes(deal.status),
          ).length;
          const totalValue = campaign.deals.reduce(
            (sum, deal) => sum + (deal.amount ?? 0),
            0,
          );

          return (
            <article
              key={campaign.id}
              className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(43,36,56,0.06),0_6px_18px_rgba(43,36,56,0.035)] sm:p-5"
            >
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-light">{campaign.title}</h2>
                    <Badge variant={campaign.status === "active" ? "green" : "muted"}>
                      {campaign.status ?? "unknown"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {campaign.brand?.display_name ?? "Brand"}
                    {campaign.platform ? ` · ${campaign.platform}` : ""}
                    {campaign.niche ? ` · ${campaign.niche}` : ""}
                  </p>
                </div>
                <AdminRemoveButton
                  kind="campaign"
                  entityId={campaign.id}
                  entityLabel={campaign.title}
                  description="This removes the campaign and every deal, message, submission, payment, dispute, and Shield case linked to it."
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Budget" value={`${campaign.currency ?? "INR"} ${fmtNum(campaign.budget)}`} />
                <Metric label="Invited deals" value={campaign.deals.length} />
                <Metric label="Open workflow" value={activeDeals} />
                <Metric label="Deal value" value={`${campaign.currency ?? "INR"} ${fmtNum(totalValue)}`} />
              </div>

              <details className="mt-4 rounded-xl bg-dark p-3.5">
                <summary className="cursor-pointer text-sm font-semibold text-accent">
                  View complete campaign brief
                </summary>
                <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                  <Detail label="Campaign goal" value={campaign.objective} />
                  <Detail label="Deliverables" value={campaign.deliverables} />
                  <Detail label="Creator requirements" value={campaign.creator_requirements} />
                  <Detail label="Creative direction" value={campaign.description} />
                  <Detail label="Usage rights" value={campaign.usage_rights} />
                  <Detail label="Payment timeline" value={campaign.payment_terms} />
                  <Detail label="Exclusivity" value={campaign.exclusivity ? "Required" : "Not required"} />
                  <Detail label="Deadline" value={campaign.deadline || "Not set"} />
                </div>
                <div className="mt-4 text-xs text-muted">
                  Created {fmtDate(campaign.created_at)} · Campaign ID {campaign.id}
                </div>
              </details>
            </article>
          );
        })}

        {!error && campaigns.length === 0 && (
          <div className="rounded-xl bg-card p-10 text-center text-sm text-muted">
            No campaign records yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-dark px-3 py-2.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-sm font-bold text-light">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-light">
        {value || "Not provided"}
      </p>
    </div>
  );
}
