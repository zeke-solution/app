"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getSessionForRole } from "@/lib/auth/roles";
import { STORAGE_BUCKETS } from "@/lib/domain/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminRemovalKind =
  | "user"
  | "campaign"
  | "deal"
  | "dispute"
  | "shield_request"
  | "shield_case"
  | "legal_provider";

export type AdminRemovalResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type StorageRef = { bucket: string; path: string };
type AdminClient = ReturnType<typeof createAdminClient>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_KINDS = new Set<AdminRemovalKind>([
  "user",
  "campaign",
  "deal",
  "dispute",
  "shield_request",
  "shield_case",
  "legal_provider",
]);

export async function removeAdminEntity(input: {
  kind: AdminRemovalKind;
  entityId: string;
  confirmation: string;
}): Promise<AdminRemovalResult> {
  const session = await getSessionForRole("admin");
  if (!session) return { ok: false, error: "Admin access is required." };
  if (!VALID_KINDS.has(input.kind) || !UUID_PATTERN.test(input.entityId)) {
    return { ok: false, error: "Invalid removal target." };
  }
  if (input.confirmation.trim() !== "REMOVE") {
    return { ok: false, error: "Type REMOVE exactly to confirm." };
  }

  try {
    const admin = createAdminClient();
    const outcome = await removeEntity(admin, input.kind, input.entityId);

    const { error: auditError } = await admin.from("admin_removal_audit").insert({
      actor_id: session.id,
      entity_type: input.kind,
      entity_id: input.entityId,
      entity_label: outcome.label,
      details: outcome.details,
    });
    if (auditError) {
      console.error("[admin-removal] audit insert failed after removal", {
        kind: input.kind,
        entityId: input.entityId,
        code: auditError.code,
        message: auditError.message,
      });
    }

    refreshAdminSurfaces();
    return {
      ok: true,
      message: auditError
        ? `${outcome.label} was removed. The audit entry needs technical review.`
        : `${outcome.label} was permanently removed.`,
    };
  } catch (error) {
    console.error("[admin-removal] removal failed", {
      kind: input.kind,
      entityId: input.entityId,
      message: error instanceof Error ? error.message : String(error),
    });
    return {
      ok: false,
      error: "Could not remove this record safely. No retry was attempted; check its linked records and try again.",
    };
  }
}

async function removeEntity(admin: AdminClient, kind: AdminRemovalKind, entityId: string) {
  if (kind === "user") return removeUser(admin, entityId);
  if (kind === "campaign") return removeCampaign(admin, entityId);
  if (kind === "deal") return removeDeal(admin, entityId);
  if (kind === "dispute") return removeDispute(admin, entityId);
  if (kind === "shield_request") return removeShieldRequest(admin, entityId);
  if (kind === "shield_case") return removeShieldCase(admin, entityId);
  return removeLegalProvider(admin, entityId);
}

async function removeUser(admin: AdminClient, userId: string) {
  const profileResult = await admin
    .from("profiles")
    .select("display_name,role,avatar_url")
    .eq("id", userId)
    .single();
  assertResult(profileResult.error, "load account");
  const profile = profileResult.data;
  if (!profile) throw new Error("Account not found");
  if (profile.role === "admin") throw new Error("Administrator accounts cannot be removed here");

  const dealsResult = await admin
    .from("deals")
    .select("id")
    .or(`brand_id.eq.${userId},influencer_id.eq.${userId}`);
  assertResult(dealsResult.error, "load account deals");
  const dealIds = (dealsResult.data ?? []).map((row) => row.id);
  const dealOutcome = await deleteDeals(admin, dealIds);

  const campaignsResult = await admin.from("campaigns").select("id").eq("brand_id", userId);
  assertResult(campaignsResult.error, "load account campaigns");
  const campaignIds = (campaignsResult.data ?? []).map((row) => row.id);
  if (campaignIds.length) {
    const campaignDelete = await admin.from("campaigns").delete().in("id", campaignIds);
    assertResult(campaignDelete.error, "delete account campaigns");
  }

  const requestDelete = await admin.from("shield_requests").delete().eq("influencer_id", userId);
  assertResult(requestDelete.error, "delete Shield requests");
  const providerUpdate = await admin
    .from("legal_providers")
    .update({ created_by: null })
    .eq("created_by", userId);
  assertResult(providerUpdate.error, "detach provider records");

  const avatarRefs = await listAvatarRefs(admin, userId, profile.avatar_url);
  const storageWarnings = await cleanupStorage(admin, [...dealOutcome.storageRefs, ...avatarRefs]);

  const authDelete = await admin.auth.admin.deleteUser(userId, false);
  if (authDelete.error) throw new Error(`delete Auth account: ${authDelete.error.message}`);

  return {
    label: profile.display_name || "User account",
    details: {
      role: profile.role,
      deals_removed: dealIds.length,
      campaigns_removed: campaignIds.length,
      storage_cleanup_warnings: storageWarnings,
    },
  };
}

async function removeCampaign(admin: AdminClient, campaignId: string) {
  const campaignResult = await admin
    .from("campaigns")
    .select("title")
    .eq("id", campaignId)
    .single();
  assertResult(campaignResult.error, "load campaign");
  if (!campaignResult.data) throw new Error("Campaign not found");

  const dealsResult = await admin.from("deals").select("id").eq("campaign_id", campaignId);
  assertResult(dealsResult.error, "load campaign deals");
  const dealIds = (dealsResult.data ?? []).map((row) => row.id);
  const dealOutcome = await deleteDeals(admin, dealIds);

  const campaignDelete = await admin.from("campaigns").delete().eq("id", campaignId);
  assertResult(campaignDelete.error, "delete campaign");
  const storageWarnings = await cleanupStorage(admin, dealOutcome.storageRefs);

  return {
    label: campaignResult.data.title || "Campaign",
    details: { deals_removed: dealIds.length, storage_cleanup_warnings: storageWarnings },
  };
}

async function removeDeal(admin: AdminClient, dealId: string) {
  const dealResult = await admin.from("deals").select("title").eq("id", dealId).single();
  assertResult(dealResult.error, "load deal");
  if (!dealResult.data) throw new Error("Deal not found");
  const outcome = await deleteDeals(admin, [dealId]);
  const storageWarnings = await cleanupStorage(admin, outcome.storageRefs);
  return {
    label: dealResult.data.title || "Deal",
    details: { storage_cleanup_warnings: storageWarnings },
  };
}

async function removeDispute(admin: AdminClient, disputeId: string) {
  const disputeResult = await admin
    .from("disputes")
    .select("reason,deal_id,previous_deal_status")
    .eq("id", disputeId)
    .single();
  assertResult(disputeResult.error, "load dispute");
  const dispute = disputeResult.data;
  if (!dispute) throw new Error("Dispute not found");

  const casesResult = await admin.from("shield_cases").select("id").eq("dispute_id", disputeId);
  assertResult(casesResult.error, "load linked Shield cases");
  const caseIds = (casesResult.data ?? []).map((row) => row.id);
  const storageRefs = await deleteShieldCases(admin, caseIds);

  const disputeDelete = await admin.from("disputes").delete().eq("id", disputeId);
  assertResult(disputeDelete.error, "delete dispute");
  if (dispute.deal_id) {
    const dealUpdate = await admin
      .from("deals")
      .update({ status: dispute.previous_deal_status ?? "negotiating" })
      .eq("id", dispute.deal_id)
      .eq("status", "disputed");
    assertResult(dealUpdate.error, "restore deal status");
  }
  const storageWarnings = await cleanupStorage(admin, storageRefs);

  return {
    label: `Dispute: ${dispute.reason.slice(0, 80)}`,
    details: { shield_cases_removed: caseIds.length, storage_cleanup_warnings: storageWarnings },
  };
}

async function removeShieldRequest(admin: AdminClient, requestId: string) {
  const requestResult = await admin
    .from("shield_requests")
    .select("id")
    .eq("id", requestId)
    .single();
  assertResult(requestResult.error, "load Shield request");
  if (!requestResult.data) throw new Error("Shield request not found");
  const requestDelete = await admin.from("shield_requests").delete().eq("id", requestId);
  assertResult(requestDelete.error, "delete Shield request");
  return { label: "Shield request", details: {} };
}

async function removeShieldCase(admin: AdminClient, caseId: string) {
  const caseResult = await admin.from("shield_cases").select("id").eq("id", caseId).single();
  assertResult(caseResult.error, "load Shield case");
  if (!caseResult.data) throw new Error("Shield case not found");
  const storageRefs = await deleteShieldCases(admin, [caseId]);
  const storageWarnings = await cleanupStorage(admin, storageRefs);
  return { label: "Shield case", details: { storage_cleanup_warnings: storageWarnings } };
}

async function removeLegalProvider(admin: AdminClient, providerId: string) {
  const providerResult = await admin
    .from("legal_providers")
    .select("display_name")
    .eq("id", providerId)
    .single();
  assertResult(providerResult.error, "load legal provider");
  if (!providerResult.data) throw new Error("Legal provider not found");
  const providerDelete = await admin.from("legal_providers").delete().eq("id", providerId);
  assertResult(providerDelete.error, "delete legal provider");
  return { label: providerResult.data.display_name, details: {} };
}

async function deleteDeals(admin: AdminClient, rawDealIds: string[]) {
  const dealIds = [...new Set(rawDealIds)];
  if (!dealIds.length) return { storageRefs: [] as StorageRef[] };

  const [submissionsResult, paymentsResult, agreementsResult, disputesResult] = await Promise.all([
    admin.from("submissions").select("file_url").in("deal_id", dealIds),
    admin.from("payments").select("proof_url").in("deal_id", dealIds),
    admin.from("agreements").select("pdf_url").in("deal_id", dealIds),
    admin.from("disputes").select("id").in("deal_id", dealIds),
  ]);
  assertResult(submissionsResult.error, "load submission files");
  assertResult(paymentsResult.error, "load payment files");
  assertResult(agreementsResult.error, "load agreement files");
  assertResult(disputesResult.error, "load deal disputes");

  const disputeIds = (disputesResult.data ?? []).map((row) => row.id);
  let caseStorageRefs: StorageRef[] = [];
  if (disputeIds.length) {
    const casesResult = await admin.from("shield_cases").select("id").in("dispute_id", disputeIds);
    assertResult(casesResult.error, "load deal Shield cases");
    caseStorageRefs = await deleteShieldCases(
      admin,
      (casesResult.data ?? []).map((row) => row.id),
    );
    const disputesDelete = await admin.from("disputes").delete().in("id", disputeIds);
    assertResult(disputesDelete.error, "delete deal disputes");
  }

  const notificationsDelete = await admin
    .from("notifications")
    .delete()
    .in("related_deal_id", dealIds);
  assertResult(notificationsDelete.error, "delete deal notifications");
  const dealsDelete = await admin.from("deals").delete().in("id", dealIds);
  assertResult(dealsDelete.error, "delete deals");

  const storageRefs = [
    ...(submissionsResult.data ?? []).flatMap((row) =>
      storageRef(STORAGE_BUCKETS.submissions, row.file_url),
    ),
    ...(paymentsResult.data ?? []).flatMap((row) =>
      storageRef(STORAGE_BUCKETS.paymentProof, row.proof_url),
    ),
    ...(agreementsResult.data ?? []).flatMap((row) =>
      storageRef(STORAGE_BUCKETS.agreements, row.pdf_url),
    ),
    ...caseStorageRefs,
  ];
  return { storageRefs };
}

async function deleteShieldCases(admin: AdminClient, rawCaseIds: string[]) {
  const caseIds = [...new Set(rawCaseIds)];
  if (!caseIds.length) return [] as StorageRef[];
  const documentsResult = await admin
    .from("shield_case_documents")
    .select("storage_path")
    .in("case_id", caseIds);
  assertResult(documentsResult.error, "load Shield case files");
  const casesDelete = await admin.from("shield_cases").delete().in("id", caseIds);
  assertResult(casesDelete.error, "delete Shield cases");
  return (documentsResult.data ?? []).flatMap((row) =>
    storageRef("shield-case-files", row.storage_path),
  );
}

async function listAvatarRefs(admin: AdminClient, userId: string, avatarUrl: string | null) {
  const refs = storageRef(STORAGE_BUCKETS.avatars, avatarUrl);
  const listResult = await admin.storage.from(STORAGE_BUCKETS.avatars).list(userId, { limit: 100 });
  if (!listResult.error) {
    for (const object of listResult.data ?? []) {
      if (object.name) refs.push({ bucket: STORAGE_BUCKETS.avatars, path: `${userId}/${object.name}` });
    }
  }
  return refs;
}

function storageRef(bucket: string, value: string | null): StorageRef[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (!/^https?:\/\//i.test(trimmed)) {
    return [{ bucket, path: trimmed.replace(/^\/+/, "") }];
  }
  try {
    const segments = new URL(trimmed).pathname.split("/").filter(Boolean);
    const bucketIndex = segments.findIndex((segment) => segment === bucket);
    if (bucketIndex < 0 || bucketIndex === segments.length - 1) return [];
    return [{ bucket, path: decodeURIComponent(segments.slice(bucketIndex + 1).join("/")) }];
  } catch {
    return [];
  }
}

async function cleanupStorage(admin: AdminClient, refs: StorageRef[]) {
  const grouped = new Map<string, Set<string>>();
  for (const ref of refs) {
    if (!grouped.has(ref.bucket)) grouped.set(ref.bucket, new Set());
    grouped.get(ref.bucket)?.add(ref.path);
  }

  const warnings: string[] = [];
  for (const [bucket, paths] of grouped) {
    if (!paths.size) continue;
    const { error } = await admin.storage.from(bucket).remove([...paths]);
    if (error) warnings.push(`${bucket}: ${error.message}`);
  }
  return warnings;
}

function assertResult(error: { message: string } | null, operation: string): asserts error is null {
  if (error) throw new Error(`${operation}: ${error.message}`);
}

function refreshAdminSurfaces() {
  for (const path of [
    "/admin",
    "/admin/overview",
    "/admin/users",
    "/admin/deals",
    "/admin/disputes",
    "/admin/shield",
    "/admin/shield/cases",
    "/admin/legal-pool",
    "/brand/campaigns",
    "/brand/deals",
    "/creator/deals",
    "/creator/shield",
  ]) {
    revalidatePath(path);
  }
  revalidateTag("public-creator-profiles", { expire: 0 });
}
