import { z } from "zod";
import { SUBMISSION_ALLOWED_MIME_TYPES, SUBMISSION_MAX_SIZE_MB } from "@/lib/domain/constants";

// Real server-side file validation (Phase 6 concern, folded in here since
// we're already building the submissions upload flow) — the legacy
// handleFileSelect() in creator.js had none beyond the <input accept="...">
// attribute, which is trivially spoofable. This is the actual security
// boundary; the client-side check in SubmissionUploader is UX-only.
export const submissionFileMetaSchema = z.object({
  dealId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  fileType: z.enum(SUBMISSION_ALLOWED_MIME_TYPES, {
    error: "Unsupported file type. Allowed: MP4, MOV, JPG, PNG, WEBP.",
  }),
  fileSizeMb: z
    .number()
    .positive()
    .max(SUBMISSION_MAX_SIZE_MB, `File must be under ${SUBMISSION_MAX_SIZE_MB}MB.`),
});
export type SubmissionFileMetaInput = z.infer<typeof submissionFileMetaSchema>;

export const submissionRecordSchema = z.object({
  dealId: z.string().uuid(),
  filePath: z.string().trim().min(1).max(1024),
  fileName: z.string().trim().min(1).max(255),
  fileSizeMb: z.number().positive().max(SUBMISSION_MAX_SIZE_MB),
});
