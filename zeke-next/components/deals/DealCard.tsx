import Link from "next/link";
import { DEAL_STATUS_META, type DealStatus, type Viewer } from "@/lib/domain/deal-status";
import { fmtNum } from "@/lib/domain/format";
import { DealStatusBadge } from "@/components/deals/DealStatusBadge";

// Port of creator.js's _dealCard() / brand.js's deal list item markup.
export function DealCard({
  href,
  counterpartName,
  title,
  platform,
  amount,
  status,
  viewer = "creator",
}: {
  href: string;
  counterpartName: string;
  title: string | null;
  platform: string | null;
  amount: number | null;
  status: DealStatus;
  viewer?: Viewer;
}) {
  const meta = DEAL_STATUS_META[status];
  const initials = counterpartName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={href}
      className="mb-3 block rounded-2xl border p-5 transition-colors hover:border-accent/30"
      style={{ borderColor: meta.border, background: meta.bg }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-xl border text-[11px] font-black"
            style={{ color: meta.color, borderColor: `${meta.color}33`, background: `${meta.color}1a` }}
          >
            {initials}
          </div>
          <div>
            <div className="text-sm font-bold text-white">{counterpartName}</div>
            <div className="text-xs text-muted">
              {title} {platform ? `· ${platform}` : ""}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-black" style={{ color: meta.color }}>
            ₹{fmtNum(amount)}
          </div>
          <div className="mt-1">
            <DealStatusBadge status={status} viewer={viewer} />
          </div>
        </div>
      </div>
      <div className="mt-2 text-right text-xs font-semibold text-accent">View deal &#8594;</div>
    </Link>
  );
}
