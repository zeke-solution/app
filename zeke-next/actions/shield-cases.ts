"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionForRole } from "@/lib/auth/roles";
import type { ActionResult } from "@/actions/auth";
import {
  legalProviderSchema,
  shieldCasePathSchema,
  shieldCaseStatusSchema,
  shieldDocumentCategorySchema,
  shieldUpdateKindSchema,
  type LegalProviderInput,
} from "@/lib/validation/shield-case.schema";

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function caseError(code: string | null, fallback: string): string {
  const messages: Record<string, string> = {
    not_authenticated: "Please sign in again.",
    not_your_case: "This Shield case is not available to your account.",
    case_not_found: "Shield case not found.",
    case_closed: "This Shield case is already closed.",
    shield_inactive: "An active Shield membership is required.",
    invalid_path: "Choose assisted follow-up or independent legal help.",
    contact_consent_required: "Zeke needs your permission before contacting the brand.",
    legal_acknowledgements_required: "Please accept the legal-cost and independent-provider acknowledgements.",
    share_consent_required: "Please consent before Zeke shares case records with a legal provider.",
    provider_unavailable: "That legal provider is not currently available.",
    provider_required: "Choose a legal provider first.",
    note_required: "Add a case note.",
    note_too_long: "The note is too long.",
    admin_only: "Admin access is required.",
    invalid_status: "Choose a valid case status.",
    engagement_not_confirmed: "The creator must first confirm a direct engagement with the legal provider.",
    legal_coordination_not_authorised: "Legal coordination requires confirmed engagement and current sharing consent.",
    outcome_required: "Add the recorded outcome before closing or resolving the case.",
  };
  return (code && messages[code]) || fallback;
}

function refreshCase(caseId: string) {
  revalidatePath("/creator/shield");
  revalidatePath(`/creator/shield/cases/${caseId}`);
  revalidatePath("/admin/shield/cases");
  revalidatePath(`/admin/shield/cases/${caseId}`);
  revalidatePath("/admin/overview");
}

export async function chooseShieldCasePath(
  caseId: string,
  path: "follow_up" | "legal",
  acknowledgements: {
    contactBrandConsent: boolean;
    legalCostAcknowledged: boolean;
    independentAdviceAcknowledged: boolean;
  }
): Promise<ActionResult> {
  if (!zUuid(caseId) || !shieldCasePathSchema.safeParse(path).success) {
    return { ok: false, error: "Invalid Shield case choice." };
  }

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("choose_shield_case_path", {
    p_case_id: caseId,
    p_path: path,
    p_contact_brand_consent: acknowledgements.contactBrandConsent,
    p_legal_cost_acknowledged: acknowledgements.legalCostAcknowledged,
    p_independent_advice_acknowledged: acknowledgements.independentAdviceAcknowledged,
  });
  if (error) return { ok: false, error: "Could not save your Shield case choice." };
  if (code) return { ok: false, error: caseError(code, "Could not save your Shield case choice.") };

  refreshCase(caseId);
  return { ok: true };
}

export async function selectShieldLegalProvider(
  caseId: string,
  providerId: string,
  acknowledgements: {
    shareConsent: boolean;
    legalCostAcknowledged: boolean;
    independentAdviceAcknowledged: boolean;
  }
): Promise<ActionResult> {
  if (!zUuid(caseId) || !zUuid(providerId)) return { ok: false, error: "Invalid provider selection." };

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("select_shield_legal_provider", {
    p_case_id: caseId,
    p_provider_id: providerId,
    p_share_consent: acknowledgements.shareConsent,
    p_legal_cost_acknowledged: acknowledgements.legalCostAcknowledged,
    p_independent_advice_acknowledged: acknowledgements.independentAdviceAcknowledged,
  });
  if (error) return { ok: false, error: "Could not save the legal provider." };
  if (code) return { ok: false, error: caseError(code, "Could not save the legal provider.") };

  refreshCase(caseId);
  return { ok: true };
}

export async function confirmShieldLegalEngagement(caseId: string): Promise<ActionResult> {
  if (!zUuid(caseId)) return { ok: false, error: "Invalid Shield case." };
  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("confirm_shield_legal_engagement", {
    p_case_id: caseId,
  });
  if (error) return { ok: false, error: "Could not confirm the legal engagement." };
  if (code) return { ok: false, error: caseError(code, "Could not confirm the legal engagement.") };
  refreshCase(caseId);
  return { ok: true };
}

export async function addShieldCaseUpdate(
  caseId: string,
  body: string,
  kind: "follow_up" | "settlement_talk" | "legal_coordination" | "note" = "note",
  audience: "creator_and_admin" | "admin_only" = "creator_and_admin"
): Promise<ActionResult> {
  const safeKind = shieldUpdateKindSchema.safeParse(kind);
  if (!zUuid(caseId) || !safeKind.success) return { ok: false, error: "Invalid case update." };
  const note = body.trim();
  if (!note) return { ok: false, error: "Add a case note." };
  if (note.length > 4000) return { ok: false, error: "The note is too long." };

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("add_shield_case_update", {
    p_case_id: caseId,
    p_body: note,
    p_kind: safeKind.data,
    p_audience: audience,
  });
  if (error) return { ok: false, error: "Could not add the case update." };
  if (code) return { ok: false, error: caseError(code, "Could not add the case update.") };
  refreshCase(caseId);
  return { ok: true };
}

export async function adminUpdateShieldCase(
  caseId: string,
  status: string,
  note: string,
  outcome?: string
): Promise<ActionResult> {
  const safeStatus = shieldCaseStatusSchema.safeParse(status);
  if (!zUuid(caseId) || !safeStatus.success) return { ok: false, error: "Invalid case status." };

  const supabase = await createClient();
  const { data: code, error } = await supabase.rpc("admin_update_shield_case", {
    p_case_id: caseId,
    p_status: safeStatus.data,
    p_note: note.trim(),
    p_outcome: outcome?.trim() || null,
  });
  if (error) return { ok: false, error: "Could not update the Shield case." };
  if (code) return { ok: false, error: caseError(code, "Could not update the Shield case.") };
  refreshCase(caseId);
  return { ok: true };
}

export async function saveLegalProvider(input: LegalProviderInput): Promise<ActionResult> {
  const session = await getSessionForRole("admin");
  if (!session) return { ok: false, error: "Admin access is required." };
  const parsed = legalProviderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the legal-provider details." };
  }

  const value = parsed.data;
  const row = {
    display_name: value.displayName,
    provider_type: value.providerType,
    firm_scale: value.firmScale,
    city: value.city || null,
    state: value.state || null,
    languages: value.languages,
    matter_types: value.matterTypes,
    profile_summary: value.profileSummary || null,
    fee_note: value.feeNote || null,
    contact_email: value.contactEmail || null,
    contact_phone: value.contactPhone || null,
    website: value.website || null,
    enrollment_reference: value.enrollmentReference || null,
    verified_at: value.verified ? new Date().toISOString() : null,
    active: value.active,
    created_by: session.id,
  };

  const supabase = await createClient();
  const result = value.id
    ? await supabase.from("legal_providers").update(row).eq("id", value.id)
    : await supabase.from("legal_providers").insert(row);
  if (result.error) return { ok: false, error: "Could not save the legal provider." };

  revalidatePath("/admin/legal-pool");
  revalidatePath("/creator/shield");
  return { ok: true };
}

export async function setLegalProviderActive(providerId: string, active: boolean): Promise<ActionResult> {
  const session = await getSessionForRole("admin");
  if (!session) return { ok: false, error: "Admin access is required." };
  if (!zUuid(providerId)) return { ok: false, error: "Invalid legal provider." };
  const supabase = await createClient();
  const { error } = await supabase.from("legal_providers").update({ active }).eq("id", providerId);
  if (error) return { ok: false, error: "Could not update the legal provider." };
  revalidatePath("/admin/legal-pool");
  revalidatePath("/creator/shield");
  return { ok: true };
}

export async function uploadShieldCaseDocument(formData: FormData): Promise<ActionResult> {
  const caseId = String(formData.get("caseId") ?? "");
  const categoryResult = shieldDocumentCategorySchema.safeParse(formData.get("category"));
  const file = formData.get("file");
  const shareWithProvider = formData.get("shareWithProvider") === "true";
  if (!zUuid(caseId) || !categoryResult.success || !(file instanceof File)) {
    return { ok: false, error: "Choose a valid file and document category." };
  }
  if (!file.size || file.size > MAX_EVIDENCE_BYTES) {
    return { ok: false, error: "Evidence files must be between 1 byte and 10 MB." };
  }
  if (!ALLOWED_EVIDENCE_TYPES.has(file.type)) {
    return { ok: false, error: "Use PDF, Word, text, JPG, PNG or WebP files." };
  }

  const supabase = await createClient();
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { ok: false, error: "Please sign in again." };

  const { data: shieldCase } = await supabase
    .from("shield_cases")
    .select("creator_id,status,selected_provider_id,share_with_provider_consent")
    .eq("id", caseId)
    .single();
  if (!shieldCase) return { ok: false, error: "Shield case not found." };
  if (shareWithProvider && (!shieldCase.selected_provider_id || !shieldCase.share_with_provider_consent)) {
    return { ok: false, error: "Select a provider and give sharing consent before marking evidence for sharing." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "evidence";
  const storagePath = `${caseId}/${user.id}/${Date.now()}_${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("shield-case-files")
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { ok: false, error: "Could not securely upload the evidence file." };

  const { error: recordError } = await supabase.from("shield_case_documents").insert({
    case_id: caseId,
    uploaded_by: user.id,
    category: categoryResult.data,
    file_name: file.name.slice(0, 255),
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    shared_with_provider: shareWithProvider,
  });
  if (recordError) {
    await supabase.storage.from("shield-case-files").remove([storagePath]);
    return { ok: false, error: "Could not attach the evidence record." };
  }

  await supabase.rpc("add_shield_case_update", {
    p_case_id: caseId,
    p_body: `Evidence added: ${file.name.slice(0, 180)}`,
    p_kind: "note",
    p_audience: "creator_and_admin",
  });
  refreshCase(caseId);
  return { ok: true };
}

function zUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
