import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { fmtNum } from "@/lib/domain/format";
import type { LegalProviderRow, ShieldCaseStatus } from "@/lib/domain/shield-case";
import { ShieldSharingControl } from "@/components/shield/ShieldSharingControl";
import {
  CreatorShieldCaseWorkspace,
  type CaseDocumentView,
  type CaseUpdateView,
  type CreatorCaseView,
} from "@/components/shield/CreatorShieldCaseWorkspace";

interface RawCase {
  id: string;
  status: ShieldCaseStatus;
  creator_path: "undecided" | "follow_up" | "legal";
  selected_provider_id: string | null;
  share_with_provider_consent: boolean;
  engagement_confirmed_at: string | null;
  outcome: string | null;
  opened_at: string;
  dispute: {
    reason: string;
    deal: {
      title: string;
      amount: number | null;
      brand: { display_name?: string } | null;
    } | null;
  } | null;
}

export default async function CreatorShieldCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const session = await requireRole("influencer");
  const { caseId } = await params;
  const supabase = await createClient();

  const [caseResult, updatesResult, documentsResult, providersResult] = await Promise.all([
    supabase
      .from("shield_cases")
      .select(
        "id,status,creator_path,selected_provider_id,share_with_provider_consent,engagement_confirmed_at,outcome,opened_at,dispute:disputes(reason,deal:deals(title,amount,brand:profiles!deals_brand_id_fkey(display_name)))"
      )
      .eq("id", caseId)
      .eq("creator_id", session.id)
      .single(),
    supabase
      .from("shield_case_updates")
      .select("id,actor_role,kind,body,created_at")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true }),
    supabase
      .from("shield_case_documents")
      .select("id,file_name,category,size_bytes,shared_with_provider,created_at,storage_path")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("legal_providers")
      .select("*")
      .eq("active", true)
      .order("display_name"),
  ]);

  if (!caseResult.data) notFound();
  const raw = caseResult.data as unknown as RawCase;
  const rawDocuments = documentsResult.data ?? [];
  const signedDocuments: CaseDocumentView[] = await Promise.all(
    rawDocuments.map(async (document) => {
      const { data } = await supabase.storage
        .from("shield-case-files")
        .createSignedUrl(document.storage_path, 60 * 20);
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

  const view: CreatorCaseView = {
    id: raw.id,
    status: raw.status,
    creatorPath: raw.creator_path,
    selectedProviderId: raw.selected_provider_id,
    engagementConfirmedAt: raw.engagement_confirmed_at,
    outcome: raw.outcome,
    openedAt: raw.opened_at,
    dealTitle: raw.dispute?.deal?.title ?? "Shield case",
    dealAmount: raw.dispute?.deal?.amount ?? null,
    brandName: raw.dispute?.deal?.brand?.display_name ?? "Brand",
    reason: raw.dispute?.reason ?? "No dispute summary available.",
  };
  const updates: CaseUpdateView[] = (updatesResult.data ?? []).map((update) => ({
    id: update.id,
    actorRole: update.actor_role,
    kind: update.kind,
    body: update.body,
    createdAt: update.created_at,
  }));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/creator/shield" className="text-xs font-semibold text-muted hover:text-white">
          ← Back to Shield
        </Link>
        {view.dealAmount !== null && <span className="text-xs font-bold text-gold">Deal value ₹{fmtNum(view.dealAmount)}</span>}
      </div>
      <ShieldSharingControl caseId={caseId} sharingEnabled={raw.share_with_provider_consent} />
      <div className="mt-4">
        <CreatorShieldCaseWorkspace
          shieldCase={view}
          updates={updates}
          documents={signedDocuments}
          providers={(providersResult.data ?? []) as LegalProviderRow[]}
        />
      </div>
    </div>
  );
}
