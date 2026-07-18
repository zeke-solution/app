"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  submissionFileMetaSchema,
  submissionRecordSchema,
  type SubmissionFileMetaInput,
} from "@/lib/validation/submission.schema";
import { STORAGE_BUCKETS } from "@/lib/domain/constants";
import { transitionError } from "@/lib/domain/transitions";

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
  const { data: code, error } = await supabase.rpc("submit_content_transaction", {
    p_deal_id: dealId,
    p_file_url: fileUrl,
    p_file_name: fileName,
    p_file_size_mb: fileSizeMb,
  });
  if (error) return { ok: false, error: "Could not record submission." };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          wrong_status: "This deal is not accepting submissions.",
          file_mismatch: "Submission file does not belong to this deal.",
          invalid_input: "Invalid submission details.",
        },
        "Could not record submission."
      ),
    };
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
  const { data: code, error } = await supabase.rpc("review_submission_transaction", {
    p_submission_id: submissionId,
    p_deal_id: dealId,
    p_decision: decision,
    p_note: note?.trim() || null,
  });
  if (error) return { ok: false, error: "Could not review submission." };
  if (code) {
    return {
      ok: false,
      error: transitionError(
        code,
        {
          wrong_status: "This deal is not awaiting review.",
          submission_mismatch: "Submission does not belong to this deal.",
          already_reviewed: "Submission was already reviewed.",
          note_required: "Reason for requesting changes is required.",
        },
        "Could not review submission."
      ),
    };
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
