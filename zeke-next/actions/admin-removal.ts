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
  | { ok: true; message: string; status: "complete" | "needs_review" }
  | { ok: false; error: string };

type StoredStorageRef = { bucket: string; value: string };
type StorageRef = { bucket: string; path: string };
type AdminClient = ReturnType<typeof createAdminClient>;
type RemovalPayload = {
  job_id: string;
  entity_type: AdminRemovalKind;
  entity_id: string;
  entity_label: string;
  details: Record<string, unknown>;
  storage_refs: StoredStorageRef[];
};

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

  const admin = createAdminClient();
  const jobId = await findOrCreateRemovalJob(admin, session.id, input.kind, input.entityId);
  if (!jobId) {
    return { ok: false, error: "Could not create a safe removal operation. Nothing was removed." };
  }
  return executeRemovalJob(admin, jobId, session.id);
}

export async function retryAdminRemovalJob(jobId: string): Promise<AdminRemovalResult> {
  const session = await getSessionForRole("admin");
  if (!session) return { ok: false, error: "Admin access is required." };
  if (!UUID_PATTERN.test(jobId)) return { ok: false, error: "Invalid removal operation." };

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("admin_removal_jobs")
    .select("id,status")
    .eq("id", jobId)
    .maybeSingle();
  if (error || !job) return { ok: false, error: "Removal operation not found." };
  if (job.status === "complete") {
    return { ok: true, message: "This removal is already complete.", status: "complete" };
  }
  return executeRemovalJob(admin, job.id, session.id);
}

async function findOrCreateRemovalJob(
  admin: AdminClient,
  actorId: string,
  kind: AdminRemovalKind,
  entityId: string,
) {
  const existing = await admin
    .from("admin_removal_jobs")
    .select("id")
    .eq("entity_type", kind)
    .eq("entity_id", entityId)
    .neq("status", "complete")
    .maybeSingle();
  if (existing.data?.id) return existing.data.id;
  if (existing.error) {
    logRemovalError("load active job", kind, entityId, existing.error);
    return null;
  }

  const created = await admin
    .from("admin_removal_jobs")
    .insert({
      actor_id: actorId,
      entity_type: kind,
      entity_id: entityId,
      entity_label: kind.replaceAll("_", " "),
    })
    .select("id")
    .single();
  if (!created.error && created.data) return created.data.id;

  // A second admin may have created the same active operation concurrently.
  if (created.error?.code === "23505") {
    const raced = await admin
      .from("admin_removal_jobs")
      .select("id")
      .eq("entity_type", kind)
      .eq("entity_id", entityId)
      .neq("status", "complete")
      .maybeSingle();
    if (raced.data?.id) return raced.data.id;
  }
  logRemovalError("create job", kind, entityId, created.error);
  return null;
}

async function executeRemovalJob(
  admin: AdminClient,
  jobId: string,
  actorId: string,
): Promise<AdminRemovalResult> {
  let payload: RemovalPayload | null = null;
  try {
    const prepared = await admin.rpc("admin_prepare_removal", {
      p_job_id: jobId,
      p_actor_id: actorId,
    });
    if (prepared.error) throw new Error(`prepare database removal: ${prepared.error.message}`);
    payload = parseRemovalPayload(prepared.data);

    const refs = payload.storage_refs.flatMap((ref) => storageRef(ref.bucket, ref.value));
    if (payload.entity_type === "user") {
      refs.push(...(await listAvatarFolderRefs(admin, payload.entity_id)));
      await deleteAuthUserIfPresent(admin, payload.entity_id);
    }

    const storageWarnings = await cleanupStorage(admin, refs);
    if (storageWarnings.length > 0) {
      await markJobNeedsReview(admin, jobId, "Stored-file cleanup is incomplete.");
      refreshAdminSurfaces();
      return {
        ok: true,
        status: "needs_review",
        message: `${payload.entity_label} records were removed, but file cleanup needs review. Retry it from the Removal log.`,
      };
    }

    const completed = await admin.rpc("admin_complete_removal", {
      p_job_id: jobId,
      p_actor_id: actorId,
      p_storage_warnings: [],
    });
    if (completed.error) throw new Error(`complete removal audit: ${completed.error.message}`);

    refreshAdminSurfaces();
    return {
      ok: true,
      status: "complete",
      message: `${payload.entity_label} was permanently removed and audited.`,
    };
  } catch (error) {
    const databaseComplete = payload !== null || (await isDatabaseRemovalComplete(admin, jobId));
    await markJobNeedsReview(
      admin,
      jobId,
      databaseComplete ? "Final cleanup needs review." : "Database removal did not complete.",
    );
    logRemovalError(
      "execute job",
      payload?.entity_type ?? "unknown",
      payload?.entity_id ?? jobId,
      error,
    );
    refreshAdminSurfaces();
    return databaseComplete
      ? {
          ok: true,
          status: "needs_review",
          message: "Core records were removed, but final cleanup needs review. Retry it from the Removal log.",
        }
      : {
          ok: false,
          error: "Removal did not complete. The attempt was recorded and no partial database deletion was committed.",
        };
  }
}

function parseRemovalPayload(value: unknown): RemovalPayload {
  if (!value || typeof value !== "object") throw new Error("invalid removal response");
  const row = value as Partial<RemovalPayload>;
  if (
    typeof row.job_id !== "string" ||
    typeof row.entity_id !== "string" ||
    typeof row.entity_label !== "string" ||
    !VALID_KINDS.has(row.entity_type as AdminRemovalKind)
  ) {
    throw new Error("invalid removal response");
  }
  const storageRefs = Array.isArray(row.storage_refs)
    ? row.storage_refs.filter(
        (ref): ref is StoredStorageRef =>
          Boolean(
            ref &&
              typeof ref === "object" &&
              typeof (ref as StoredStorageRef).bucket === "string" &&
              typeof (ref as StoredStorageRef).value === "string",
          ),
      )
    : [];
  return {
    job_id: row.job_id,
    entity_type: row.entity_type as AdminRemovalKind,
    entity_id: row.entity_id,
    entity_label: row.entity_label,
    details: row.details && typeof row.details === "object" ? row.details : {},
    storage_refs: storageRefs,
  };
}

async function deleteAuthUserIfPresent(admin: AdminClient, userId: string) {
  const lookup = await admin.auth.admin.getUserById(userId);
  if (lookup.error) {
    if (isMissingAuthUser(lookup.error)) return;
    throw new Error(`load Auth account: ${lookup.error.message}`);
  }
  if (!lookup.data.user) return;
  const removed = await admin.auth.admin.deleteUser(userId, false);
  if (removed.error && !isMissingAuthUser(removed.error)) {
    throw new Error(`delete Auth account: ${removed.error.message}`);
  }
}

function isMissingAuthUser(error: { message: string; status?: number }) {
  return error.status === 404 || /user not found/i.test(error.message);
}

async function isDatabaseRemovalComplete(admin: AdminClient, jobId: string) {
  const { data } = await admin
    .from("admin_removal_jobs")
    .select("database_completed_at")
    .eq("id", jobId)
    .maybeSingle();
  return Boolean(data?.database_completed_at);
}

async function markJobNeedsReview(admin: AdminClient, jobId: string, message: string) {
  const result = await admin
    .from("admin_removal_jobs")
    .update({ status: "needs_review", last_error: message, updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .neq("status", "complete");
  if (result.error) logRemovalError("mark job for review", "job", jobId, result.error);
}

async function listAvatarFolderRefs(admin: AdminClient, userId: string) {
  const refs: StorageRef[] = [];
  const listResult = await admin.storage.from(STORAGE_BUCKETS.avatars).list(userId, { limit: 100 });
  if (listResult.error) throw new Error(`list avatar files: ${listResult.error.message}`);
  for (const object of listResult.data ?? []) {
    if (object.name) {
      refs.push({ bucket: STORAGE_BUCKETS.avatars, path: `${userId}/${object.name}` });
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

function logRemovalError(operation: string, kind: string, entityId: string, error: unknown) {
  console.error("[admin-removal] operation failed", {
    operation,
    kind,
    entityId,
    message:
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error ?? "unknown error"),
  });
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
    "/admin/removals",
    "/brand/campaigns",
    "/brand/deals",
    "/creator/deals",
    "/creator/shield",
  ]) {
    revalidatePath(path);
  }
  revalidateTag("public-creator-profiles", { expire: 0 });
}
