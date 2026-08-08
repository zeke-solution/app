import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ShieldCaseStatus } from "@/lib/domain/shield-case";
import {
  AdminShieldCaseWorkspace,
  type AdminCaseView,
} from "@/components/admin/AdminShieldCaseWorkspace";
import type { CaseDocumentView, CaseUpdateView } from "@/components/shield/CreatorShieldCaseWorkspace";

interface RawAdminCase {
  id: string;
  status: ShieldCaseStatus;
  creator_path: "undecided" | "follow_up" | "legal";
  opened_at: string;
  contact_brand_consent: boolean;
  share_with_provider_consent: boolean;
  legal_cost_acknowledged: boolean;
  independent_advice_acknowledged: boolean;
  engagement_confirmed_at: string | null;
  outcome: string | null;
  creator: { display_name?: string } | null;
  provider: { display_name?: string } | null;
  dispute: {
    reason: string;
    deal: {
      title: string;
      brand: { display_name?: string } | null;
    } | null;
  } | null;
}

export default async function AdminShieldCasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const supabase = await createClient();
  const [caseResult, updatesResult, documentsResult] = await Promise.all([
    supabase
      .from("shield_cases")
      .select(
        "id,status,creator_path,opened_at,contact_brand_consent,share_with_provider_consent,legal_cost_acknowledged,independent_advice_acknowledged,engagement_confirmed_at,outcome,creator:profiles!shield_cases_creator_id_fkey(display_name),provider:legal_providers!shield_cases_selected_provider_id_fkey(display_name),dispute:disputes(reason,deal:deals(title,brand:profiles!deals_brand_id_fkey(display_name)))"
      )
      .eq("id", caseId)
      .single(),
    supabase.from("shield_case_updates").select("id,actor_role,kind,body,created_at").eq("case_id", caseId).order("created_at"),
    supabase.from("shield_case_documents").select("id,file_name,category,size_bytes,shared_with_provider,created_at,storage_path").eq("case_id", caseId).order("created_at", { ascending: false }),
  ]);

  if (!caseResult.data) notFound();
  const raw = caseResult.data as unknown as RawAdminCase;
  const documents: CaseDocumentView[] = await Promise.all(
    (documentsResult.data ?? []).map(async (document) => {
      const { data } = await supabase.storage.from("shield-case-files").createSignedUrl(document.storage_path, 60 * 20);
      return {
        id: document.id,
        fileName: document.file_name,
        category: document.category,
        sizeBytes: document.size_bytes,
        sharedWithProvider: document.shared_with_provider,
        createdAt: document.created_at,
        downloadUrl: data?.signedUrl ?? null,
      };
    })
  );
  const updates: CaseUpdateView[] = (updatesResult.data ?? []).map((update) => ({
    id: update.id,
    actorRole: update.actor_role,
    kind: update.kind,
    body: update.body,
    createdAt: update.created_at,
  }));
  const view: AdminCaseView = {
    id: raw.id,
    status: raw.status,
    creatorPath: raw.creator_path,
    creatorName: raw.creator?.display_name ?? "Creator",
    brandName: raw.dispute?.deal?.brand?.display_name ?? "Brand",
    dealTitle: raw.dispute?.deal?.title ?? "Shield case",
    reason: raw.dispute?.reason ?? "No summary available.",
    openedAt: raw.opened_at,
    contactBrandConsent: raw.contact_brand_consent,
    shareConsent: raw.share_with_provider_consent,
    legalCostAcknowledged: raw.legal_cost_acknowledged,
    independentAdviceAcknowledged: raw.independent_advice_acknowledged,
    engagementConfirmedAt: raw.engagement_confirmed_at,
    outcome: raw.outcome,
    providerName: raw.provider?.display_name ?? null,
  };

  return (
    <div>
      <Link href="/admin/shield/cases" className="mb-4 inline-block text-xs font-semibold text-muted hover:text-white">← Back to Shield cases</Link>
      <AdminShieldCaseWorkspace shieldCase={view} updates={updates} documents={documents} />
    </div>
  );
}
