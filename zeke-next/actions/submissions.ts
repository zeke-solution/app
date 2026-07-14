"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications";
import {
  submissionFileMetaSchema,
  submissionRecordSchema,
  type SubmissionFileMetaInput,
} from "@/lib/validation/submission.schema";
import { STORAGE_BUCKETS } from "@/lib/domain/constants";

type UploadTargetResult =
  | { ok: true; path: string; bucket: string }
  | { ok: false; error: string };

// Validates the file metadata server-side (real security boundary) and
// returns a deterministic storage path for the client to upload to directly
// via the browser Supabase client — see plan section 6.2 for why we don't
// proxy the file bytes through this action (200MB videos would blow past
// Server Action body limits).
export async function createSubmissionUploadTarget(
  input: SubmissionFileMetaInput
): Promise<UploadTargetResult> {
  const parsed = submissionFileMetaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("influencer_id,status")
    .eq("id", v.dealId)
    .single();
  if (!deal || deal.influencer_id !== userRes.user.id) {
    return { ok: false, error: "Not your deal." };
  }
  if (!deal.status || !["active", "submitted"].includes(deal.status)) {
    return { ok: false, error: "This deal is not accepting submissions." };
  }

  const sanitized = v.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userRes.user.id}/${v.dealId}/${Date.now()}_${sanitized}`;
  return { ok: true, path, bucket: STORAGE_BUCKETS.submissions };
}

type CreateRecordResult = { ok: true } | { ok: false; error: string };

// Port of creator.js's submitFile() (post-upload half — the upload itself
// happens client-side against the path from createSubmissionUploadTarget).
export async function createSubmissionRecord(
  dealId: string,
  fileUrl: string,
  fileName: string,
  fileSizeMb: number
): Promise<CreateRecordResult> {
  const parsed = submissionRecordSchema.safeParse({
    dealId,
    filePath: fileUrl,
    fileName,
    fileSizeMb,
  });
  if (!parsed.success) return { ok: false, error: "Invalid submission details." };

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("influencer_id,brand_id,title,status")
    .eq("id", dealId)
    .single();
  if (!deal || deal.influencer_id !== userRes.user.id) return { ok: false, error: "Not your deal." };
  if (!deal.status || !["active", "submitted"].includes(deal.status)) {
    return { ok: false, error: "This deal is not accepting submissions." };
  }
  const expectedPrefix = `${userRes.user.id}/${dealId}/`;
  if (!fileUrl.startsWith(expectedPrefix)) {
    return { ok: false, error: "Submission file does not belong to this deal." };
  }

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("deal_id", dealId);
  const round = (count ?? 0) + 1;

  const { error } = await supabase.from("submissions").insert({
    deal_id: dealId,
    round,
    file_url: fileUrl,
    file_name: fileName,
    file_size_mb: fileSizeMb,
    status: "pending",
  });
  if (error) return { ok: false, error: "Could not record submission." };

  if (deal.status === "active") {
    const { error: statusError } = await supabase
      .from("deals")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", dealId)
      .eq("status", "active");
    if (statusError) return { ok: false, error: "Submission saved, but deal status could not be updated." };
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userRes.user.id).single();
  const name = profile?.display_name ?? "Creator";

  await supabase.from("deal_messages").insert({
    deal_id: dealId,
    sender_id: userRes.user.id,
    msg_type: "event",
    content: `✓ File submitted by ${name} · Awaiting brand review`,
  });
  if (deal.brand_id) {
    await createNotification(supabase, {
      userId: deal.brand_id,
      title: `New submission from ${name}`,
      body: `${deal.title} — review pending`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidatePath(`/creator/deals/${dealId}`);
  revalidatePath(`/brand/deals/${dealId}`);
  return { ok: true };
}

// Port of brand.js's reviewSubmission().
export async function reviewSubmission(
  submissionId: string,
  dealId: string,
  decision: "approved" | "rejected",
  note?: string
): Promise<CreateRecordResult> {
  if (decision === "rejected" && !note?.trim()) {
    return { ok: false, error: "Reason for requesting changes is required." };
  }

  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id,title,status")
    .eq("id", dealId)
    .single();
  if (!deal || deal.brand_id !== userRes.user.id) return { ok: false, error: "Not your deal." };
  if (deal.status !== "submitted") return { ok: false, error: "This deal is not awaiting review." };

  const { data: submission } = await supabase
    .from("submissions")
    .select("id,deal_id,status")
    .eq("id", submissionId)
    .eq("deal_id", dealId)
    .single();
  if (!submission) return { ok: false, error: "Submission does not belong to this deal." };
  if (submission.status !== "pending") return { ok: false, error: "Submission was already reviewed." };

  const { error } = await supabase
    .from("submissions")
    .update({ status: decision, review_note: note?.trim() || null, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId)
    .eq("deal_id", dealId)
    .eq("status", "pending");
  if (error) return { ok: false, error: "Could not review submission." };

  if (decision === "approved") {
    await supabase.from("deals").update({ status: "approved" }).eq("id", dealId);
  }

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userRes.user.id).single();
  const name = profile?.display_name ?? "Brand";
  const msg =
    decision === "approved"
      ? `✓ Content approved by ${name}`
      : `⟳ Changes requested by ${name}${note ? `: ${note.trim()}` : ""}`;
  await supabase.from("deal_messages").insert({ deal_id: dealId, sender_id: userRes.user.id, msg_type: "event", content: msg });

  if (deal.influencer_id) {
    await createNotification(supabase, {
      userId: deal.influencer_id,
      title: decision === "approved" ? "Content approved" : "Changes requested",
      body:
        decision === "approved"
          ? `${deal.title} — you can now submit the live link.`
          : `${deal.title} — ${note?.trim() || "Brand requested changes."}`,
      type: "deal",
      relatedDealId: dealId,
    });
  }

  revalidatePath(`/brand/deals/${dealId}`);
  revalidatePath(`/creator/deals/${dealId}`);
  return { ok: true };
}

export async function createSubmissionDownloadUrl(
  submissionId: string,
  dealId: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) return { ok: false, error: "Not authenticated." };

  const { data: deal } = await supabase
    .from("deals")
    .select("brand_id,influencer_id")
    .eq("id", dealId)
    .single();
  if (!deal || ![deal.brand_id, deal.influencer_id].includes(userRes.user.id)) {
    return { ok: false, error: "Not your deal." };
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("file_url")
    .eq("id", submissionId)
    .eq("deal_id", dealId)
    .single();
  if (!submission?.file_url) return { ok: false, error: "Submission file not found." };

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.submissions)
    .createSignedUrl(submission.file_url, 300);
  if (error || !data.signedUrl) return { ok: false, error: "Could not open submission file." };
  return { ok: true, url: data.signedUrl };
}
