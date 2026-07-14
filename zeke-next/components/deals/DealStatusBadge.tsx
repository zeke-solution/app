import { Badge } from "@/components/ui/Badge";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus, type Viewer } from "@/lib/domain/deal-status";

export function DealStatusBadge({ status, viewer = "creator" }: { status: DealStatus; viewer?: Viewer }) {
  const meta = DEAL_STATUS_META[status];
  return <Badge variant={meta.badge}>{dealStatusLabel(status, viewer)}</Badge>;
}
