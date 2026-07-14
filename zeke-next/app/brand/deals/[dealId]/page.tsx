import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type { DealStatus } from "@/lib/domain/deal-status";
import { BrandDealDetailView } from "@/components/deals/BrandDealDetailView";

export default async function BrandDealDetailPage({
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
    .select("*, creator:profiles!deals_influencer_id_fkey(display_name)")
    .eq("id", dealId)
    .single();
  if (!deal || deal.brand_id !== session.id) notFound();

  const [eventsRes, submissionsRes, finalLinkRes, paymentRes, agreementRes] = await Promise.all([
    supabase
      .from("deal_messages")
      .select("msg_type,content,created_at")
      .eq("deal_id", dealId)
      .in("msg_type", ["event", "event_gold"])
      .order("created_at", { ascending: true }),
    supabase.from("submissions").select("*").eq("deal_id", dealId).order("submitted_at", { ascending: false }),
    supabase.from("final_links").select("url,submitted_at").eq("deal_id", dealId).maybeSingle(),
    supabase.from("payments").select("id,amount,status").eq("deal_id", dealId).maybeSingle(),
    supabase.from("agreements").select("id,generated_at").eq("deal_id", dealId).maybeSingle(),
  ]);

  let agreement = null;
  if (agreementRes.data) {
    const { data: inf } = await supabase
      .from("influencer_profiles")
      .select("shield_active")
      .eq("id", deal.influencer_id ?? "")
      .maybeSingle();
    agreement = {
      id: agreementRes.data.id,
      generatedAt: agreementRes.data.generated_at,
      creatorIsShield: !!inf?.shield_active,
    };
  }

  return (
    <BrandDealDetailView
      dealId={dealId}
      creatorName={(deal.creator as { display_name?: string } | null)?.display_name ?? "Creator"}
      title={deal.title}
      platform={deal.platform}
      amount={deal.amount ?? 0}
      status={deal.status as DealStatus}
      deliverables={deal.deliverables}
      deadline={deal.deadline}
      cancelRequestedBy={deal.cancel_requested_by}
      viewerId={session.id}
      events={eventsRes.data ?? []}
      submissions={submissionsRes.data ?? []}
      finalLink={finalLinkRes.data ?? null}
      payment={paymentRes.data ?? null}
      agreement={agreement}
    />
  );
}
