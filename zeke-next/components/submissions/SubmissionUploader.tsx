"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadResumableFile } from "@/lib/supabase/resumable-upload";
import { createSubmissionUploadTarget, createSubmissionRecord } from "@/actions/submissions";
import { Button } from "@/components/ui/Button";
import { SUBMISSION_ALLOWED_MIME_TYPES, SUBMISSION_MAX_SIZE_MB } from "@/lib/domain/constants";

type AllowedMimeType = (typeof SUBMISSION_ALLOWED_MIME_TYPES)[number];

const EXTENSION_MIME_TYPES: Record<string, AllowedMimeType> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function resolvedMimeType(file: File): AllowedMimeType | null {
  if (SUBMISSION_ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return file.type as AllowedMimeType;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_TYPES[extension] ?? null;
}

function uploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/413|payload too large|maximum.*size|file.*size/i.test(message)) {
    return "This file exceeds the Supabase project Storage limit. Set the global Storage limit to at least 100 MB.";
  }
  if (/network|fetch|offline|connection/i.test(message)) {
    return "The upload was interrupted. Check your connection and try again - resumable upload will continue from the last completed chunk.";
  }
  return `Upload failed: ${message}`;
}

export function SubmissionUploader({ dealId, round }: { dealId: string; round: number }) {
  const [file, setFile] = useState<File | null>(null);
  const [mimeType, setMimeType] = useState<AllowedMimeType | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSelect(selectedFile: File | null) {
    setError("");
    setProgress(0);
    if (!selectedFile) {
      setFile(null);
      setMimeType(null);
      return;
    }
    const selectedMimeType = resolvedMimeType(selectedFile);
    if (!selectedMimeType) {
      setError("Unsupported file type. Use MP4, MOV, JPG, PNG, WebP, HEIC, or HEIF.");
      return;
    }
    if (selectedFile.size > SUBMISSION_MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be ${SUBMISSION_MAX_SIZE_MB} MB or smaller.`);
      return;
    }
    setFile(selectedFile);
    setMimeType(selectedMimeType);
  }

  async function handleSubmit() {
    if (!file || !mimeType) return;
    setUploading(true);
    setProgress(0);
    setError("");

    // Keep enough precision for small phone images instead of rounding them to 0.0 MB.
    const fileSizeMb = Math.max(0.001, Number((file.size / 1048576).toFixed(3)));
    const target = await createSubmissionUploadTarget({
      dealId,
      fileName: file.name,
      fileType: mimeType,
      fileSizeMb,
    });
    if (!target.ok) {
      setUploading(false);
      setError(target.error);
      return;
    }

    const supabase = createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) {
      setUploading(false);
      setError("Your session expired. Sign in again and retry the upload.");
      return;
    }

    try {
      await uploadResumableFile({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        accessToken,
        bucket: target.bucket,
        path: target.path,
        file,
        contentType: mimeType,
        onProgress: setProgress,
      });
    } catch (uploadError) {
      setUploading(false);
      setError(uploadErrorMessage(uploadError));
      return;
    }

    const result = await createSubmissionRecord(dealId, target.path, file.name, fileSizeMb);
    setUploading(false);
    if (!result.ok) {
      // Avoid leaving an inaccessible orphan when the transaction rejects the record.
      await supabase.storage.from(target.bucket).remove([target.path]);
      setError(result.error);
      return;
    }
    setFile(null);
    setMimeType(null);
    setProgress(0);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 text-[13px] font-bold text-light">Round {round}</div>
      {!file ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full cursor-pointer rounded-xl border-2 border-dashed border-border p-5 text-center focus:outline-none focus:ring-2 focus:ring-accent/60"
          >
            <div className="mb-1 text-[13px] font-semibold text-light">Upload Content File</div>
            <div className="text-[11px] text-muted">Video or image - up to {SUBMISSION_MAX_SIZE_MB} MB</div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
            className="sr-only"
            aria-label="Choose content file"
            onChange={(event) => handleSelect(event.target.files?.[0] ?? null)}
          />
        </>
      ) : (
        <div className="mt-2.5 flex min-w-0 items-center gap-2.5 rounded-xl border border-zgreen/30 bg-dark p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-light">{file.name}</div>
            <div className="text-[11px] text-muted">{(file.size / 1048576).toFixed(1)} MB</div>
          </div>
          <button type="button" onClick={() => handleSelect(null)} className="p-2 text-muted" aria-label="Remove selected file" disabled={uploading}>
            &times;
          </button>
        </div>
      )}
      {uploading && (
        <div className="mt-3" aria-live="polite">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
            <span>Uploading securely</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && (
        <div className="mt-2.5 rounded-[10px] border border-danger/25 bg-danger/10 px-3.5 py-2 text-xs text-danger" role="alert">
          {error}
        </div>
      )}
      <Button fullWidth size="sm" className="mt-3" disabled={!file || uploading} onClick={handleSubmit}>
        {uploading ? `Uploading ${progress}%` : "Submit for Review"}
      </Button>
    </div>
  );
}
