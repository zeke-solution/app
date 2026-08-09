import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import { ChatThread } from "@/components/chat/ChatThread";
import { BackIcon } from "@/components/layout/icons";

export default async function BrandChatPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const session = await getSessionProfile();
  if (!session) return null;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("title,amount,status,brand_id,creator_chat_closed_at,creator:profiles!deals_influencer_id_fkey(display_name)")
    .eq("id", dealId)
    .single();
  if (!deal || deal.brand_id !== session.id) notFound();

  const { data: messages } = await supabase
    .from("deal_messages")
    .select("id,sender_id,msg_type,content,created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  const creatorName = (deal.creator as { display_name?: string } | null)?.display_name ?? "Creator";
  const creatorClosedChat = deal.status === "completed" && Boolean(deal.creator_chat_closed_at);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <Link href="/brand/chats" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border border-border bg-white/5 text-light"><BackIcon /></Link>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-[11px] font-black text-accent">
          {creatorName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-light">{creatorName}</div>
          <div className="text-[11px] text-muted">{deal.title} - &#8377;{fmtNum(deal.amount)}</div>
        </div>
        {deal.status === "negotiating" ? (
          <span className="flex-shrink-0 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gold">Negotiation only</span>
        ) : (
          <Link href={`/brand/deals/${dealId}`} className="flex-shrink-0 text-[11px] font-semibold text-muted">View accepted deal</Link>
        )}
      </div>
      <ChatThread
        dealId={dealId}
        currentUserId={session.id}
        counterpartLabel={creatorName}
        initialMessages={messages ?? []}
        canSend={!creatorClosedChat}
        blockedMessage="The creator closed messaging after this deal was completed. The conversation remains available as a record."
      />
    </div>
  );
}
