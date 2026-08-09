import { fmtDateShort, fmtNum } from "@/lib/domain/format";
import { Badge } from "@/components/ui/Badge";

interface CampaignRow {
  id: string;
  title: string;
  niche: string | null;
  budget: number | null;
  deadline: string | null;
  status: string | null;
}

// Port of brand.js's _renderCampaigns() (presentation only — action buttons
// live in CampaignsPageClient since they need interactivity).
export function CampaignCard({ campaign, children }: { campaign: CampaignRow; children?: React.ReactNode }) {
  return (
    <div className="mb-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-light">{campaign.title}</div>
          <div className="text-xs text-muted">
            {campaign.niche} {campaign.deadline ? `· Deadline ${fmtDateShort(campaign.deadline)}` : ""}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-black text-gold">₹{fmtNum(campaign.budget)}</div>
          <div className="mt-1">
            <Badge variant={campaign.status === "active" ? "green" : "muted"}>{campaign.status ?? "active"}</Badge>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
