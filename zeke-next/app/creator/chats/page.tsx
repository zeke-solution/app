import Link from "next/link";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { DealStatusBadge } from "@/components/deals/DealStatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function CreatorChatsPage() {
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select("id,title,status,brand:profiles!deals_brand_id_fkey(display_name)")
    .eq("influencer_id", session.id)
    .not("status", "eq", "cancelled")
    .order("updated_at", { ascending: false });

  const chats = data ?? [];

  return (
    <div>
      <PageHeader
        title="Chats"
        description="Campaign conversations and negotiation records."
        actions={<span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted">{chats.length} conversations</span>}
      />
      {chats.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted">
          No chats yet.
        </div>
      ) : (
        chats.map((d) => {
          const brandName = (d.brand as { display_name?: string } | null)?.display_name ?? "Brand";
          return (
            <Link
              key={d.id}
              href={`/creator/chats/${d.id}`}
              className="mb-2 flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/30"
            >
              <div className="flex h-9.5 w-9.5 flex-shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-[11px] font-semibold text-accent">
                {brandName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-light">{brandName}</div>
                <div className="truncate text-xs text-muted">{d.title}</div>
              </div>
              <DealStatusBadge status={d.status as DealStatus} viewer="creator" />
            </Link>
          );
        })
      )}
    </div>
  );
}
