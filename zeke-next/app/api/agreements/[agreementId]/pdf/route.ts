import { createClient } from "@/lib/supabase/server";
import { buildAgreementPdf } from "@/lib/pdf/agreement-pdf";

// Plan deviation #4: the legacy app only hid the "Download PDF" button for
// non-Shield creators (loadAgreements()/_loadBrandAgreement()) — any
// authenticated deal party could still call downloadAgreementPDF() from
// devtools regardless of Shield status, because the agreements RLS policy
// (agree_parties) allows either party to read the row. This route
// re-checks shield_active server-side before streaming any bytes.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  const { agreementId } = await params;
  const supabase = await createClient();

  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return new Response(null, { status: 401 });

  const { data: agreement } = await supabase
    .from("agreements")
    .select(
      "id, generated_at, deals(title, amount, deliverables, platform, deadline, payment_terms, usage_rights, influencer_id, brand_id, brand:profiles!deals_brand_id_fkey(display_name), creator:profiles!deals_influencer_id_fkey(display_name))"
    )
    .eq("id", agreementId)
    .single();

  if (!agreement || !agreement.deals) return new Response(null, { status: 404 });
  const deal = agreement.deals as unknown as {
    title: string | null;
    amount: number | null;
    deliverables: string | null;
    platform: string | null;
    deadline: string | null;
    payment_terms: string | null;
    usage_rights: string | null;
    influencer_id: string | null;
    brand_id: string | null;
    brand: { display_name?: string } | null;
    creator: { display_name?: string } | null;
  };

  const uid = userRes.user.id;
  const isParty = deal.influencer_id === uid || deal.brand_id === uid;
  if (!isParty) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", uid).single();
    if (profile?.role !== "admin") return new Response(null, { status: 403 });
  }

  const { data: inf } = await supabase
    .from("influencer_profiles")
    .select("shield_active")
    .eq("id", deal.influencer_id ?? "")
    .maybeSingle();
  if (!inf?.shield_active) {
    return new Response("PDF available only when the creator on this deal is a Shield member.", {
      status: 403,
    });
  }

  const pdfBuffer = buildAgreementPdf({
    brandName: deal.brand?.display_name ?? "Brand",
    creatorName: deal.creator?.display_name ?? "Creator",
    title: deal.title,
    platform: deal.platform,
    amount: deal.amount,
    deliverables: deal.deliverables,
    usageRights: deal.usage_rights,
    paymentTerms: deal.payment_terms,
    deadline: deal.deadline,
    generatedAt: agreement.generated_at,
  });

  const filename = `zeke-agreement-${(deal.title || "deal").replace(/\s+/g, "-").toLowerCase()}.pdf`;
  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
