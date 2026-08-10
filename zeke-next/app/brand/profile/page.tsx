import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { DEAL_STATUS_META, dealStatusLabel, type DealStatus } from "@/lib/domain/deal-status";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function BrandProfilePage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const [campaignsRes, dealsRes] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("brand_id", session.id),
    supabase
      .from("deals")
      .select("id,title,amount,status,creator:profiles!deals_influencer_id_fkey(display_name)")
      .eq("brand_id", session.id)
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const allDealsRes = await supabase.from("deals").select("amount,status").eq("brand_id", session.id);
  const allDeals = allDealsRes.data ?? [];
  const completed = allDeals.filter((d) => d.status === "completed");
  const totalSpent = completed.reduce((s, d) => s + (d.amount ?? 0), 0);

  const name = session.profile.display_name;
  const initials = name.slice(0, 2).toUpperCase();
  const typeLabel = (session.brand?.brand_type ?? "business").replace(/^./, (c) => c.toUpperCase());

  return (
    <div>
      <PageHeader
        title="Brand profile"
        description="Manage the identity and account details creators see on Zeke."
      />

      <Card>
        <div className="mb-5 flex items-center gap-4">
          <div className="brand-avatar flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 text-base font-black">
            {initials}
          </div>
          <div>
            <div className="text-lg font-black text-light">{name}</div>
            <div className="text-[13px] text-muted">{session.profile.location}</div>
            <span className="mt-1.5 inline-block rounded-full border border-border bg-white/[0.03] px-2.5 py-0.5 text-[11px] font-bold text-muted">
              {typeLabel}
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <ProfileStat value={campaignsRes.count ?? 0} label="Campaigns" />
          <ProfileStat value={completed.length} label="Deals Done" />
          <ProfileStat value={`₹${fmtNum(totalSpent)}`} label="Total Spent" />
          <ProfileStat value="--" label="Avg Rating" color="#92400E" />
        </div>

        <div className="rounded-xl border border-border bg-dark p-3">
          <div className="mb-2.5 text-xs font-bold text-light">Recent Deal History</div>
          {(dealsRes.data ?? []).length === 0 ? (
            <div className="text-xs text-muted">No deals yet.</div>
          ) : (
            (dealsRes.data ?? []).map((d) => {
              const creatorName = (d.creator as { display_name?: string } | null)?.display_name ?? "Creator";
              const meta = DEAL_STATUS_META[d.status as DealStatus];
              return (
                <div key={d.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <div>
                    <div className="text-xs font-semibold text-light">{creatorName}</div>
                    <div className="text-[11px] text-muted">{d.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold" style={{ color: meta.color }}>₹{fmtNum(d.amount)}</div>
                    <div className="text-[10px] text-muted">{dealStatusLabel(d.status as DealStatus, "brand")}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <div className="mb-2 text-sm font-black text-light">Account</div>
        <p className="mb-3 text-xs text-muted">
          Sign out safely on this device.
        </p>
        <SignOutButton fullWidth />
      </Card>
    </div>
  );
}

function ProfileStat({ value, label, color }: { value: React.ReactNode; label: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-dark p-3 text-center">
      <div className="text-base font-black" style={{ color: color ?? "var(--color-light)" }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-muted">{label}</div>
    </div>
  );
}
