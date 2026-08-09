import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { ChatThread } from "@/components/chat/ChatThread";
import { BackIcon } from "@/components/layout/icons";

export default async function CreatorChatPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("title,amount,status,influencer_id,brand:profiles!deals_brand_id_fkey(display_name)")
    .eq("id", dealId)
    .single();
  if (!deal || deal.influencer_id !== session.id) notFound();

  const { data: messages } = await supabase
    .from("deal_messages")
    .select("id,sender_id,msg_type,content,created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  const brandName = (deal.brand as { display_name?: string } | null)?.display_name ?? "Brand";

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/creator/chats"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white/5 text-light"
        >
          <BackIcon />
        </Link>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-[11px] font-black text-accent">
          {brandName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white">{brandName}</div>
          <div className="text-[11px] text-muted">
            {deal.title} - &#8377;{fmtNum(deal.amount)}
          </div>
        </div>
        {deal.status === "negotiating" ? (
          <Link href="/creator/offers" className="flex-shrink-0 text-[11px] font-semibold text-gold">
            Offer Inbox
          </Link>
        ) : (
          <Link href={`/creator/deals/${dealId}`} className="flex-shrink-0 text-[11px] font-semibold text-muted">
            View accepted deal
          </Link>
        )}
      </div>
      <ChatThread dealId={dealId} currentUserId={session.id} counterpartLabel={brandName} initialMessages={messages ?? []} />
    </div>
  );
}
