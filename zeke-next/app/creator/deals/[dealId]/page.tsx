import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { CreatorDealDetailView } from "@/components/deals/CreatorDealDetailView";

export default async function CreatorDealDetailPage({
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
    .select("*, brand:profiles!deals_brand_id_fkey(display_name)")
    .eq("id", dealId)
    .single();

  if (!deal || deal.influencer_id !== session.id) notFound();
  if (deal.status === "negotiating") redirect(`/creator/chats/${dealId}`);

  const [eventsRes, submissionsRes, finalLinkRes, paymentRes] = await Promise.all([
    supabase
      .from("deal_messages")
      .select("msg_type,content,created_at")
      .eq("deal_id", dealId)
      .in("msg_type", ["event", "event_gold"])
      .order("created_at", { ascending: true }),
    supabase.from("submissions").select("*").eq("deal_id", dealId).order("submitted_at", { ascending: false }),
    supabase.from("final_links").select("url,submitted_at").eq("deal_id", dealId).maybeSingle(),
    supabase.from("payments").select("id,amount,status").eq("deal_id", dealId).maybeSingle(),
  ]);

  return (
    <CreatorDealDetailView
      dealId={dealId}
      brandName={(deal.brand as { display_name?: string } | null)?.display_name ?? "Brand"}
      title={deal.title}
      amount={deal.amount}
      status={deal.status as DealStatus}
      deliverables={deal.deliverables}
      cancelRequestedBy={deal.cancel_requested_by}
      cancelReason={deal.cancel_reason}
      viewerId={session.id}
      events={eventsRes.data ?? []}
      submissions={submissionsRes.data ?? []}
      finalLink={finalLinkRes.data ?? null}
      payment={paymentRes.data ?? null}
    />
  );
}
