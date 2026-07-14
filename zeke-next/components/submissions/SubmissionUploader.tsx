"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createSubmissionUploadTarget, createSubmissionRecord } from "@/actions/submissions";
import { Button } from "@/components/ui/Button";
import { SUBMISSION_ALLOWED_MIME_TYPES, SUBMISSION_MAX_SIZE_MB } from "@/lib/domain/constants";

// Port of creator.js's handleFileSelect()/submitFile(). Client-side checks
// here are UX only — createSubmissionUploadTarget re-validates server-side,
// which is the real boundary (see lib/validation/submission.schema.ts).
export function SubmissionUploader({ dealId }: { dealId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSelect(f: File | null) {
    setError("");
    if (!f) return setFile(null);
    if (!SUBMISSION_ALLOWED_MIME_TYPES.includes(f.type as never)) {
      setError("Unsupported file type. Allowed: MP4, MOV, JPG, PNG, WEBP.");
      return;
    }
    if (f.size / 1048576 > SUBMISSION_MAX_SIZE_MB) {
      setError(`File must be under ${SUBMISSION_MAX_SIZE_MB}MB.`);
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    setError("");

    const fileSizeMb = Number((file.size / 1048576).toFixed(1));
    const target = await createSubmissionUploadTarget({
      dealId,
      fileName: file.name,
      fileType: file.type as (typeof SUBMISSION_ALLOWED_MIME_TYPES)[number],
      fileSizeMb,
    });
    if (!target.ok) {
      setUploading(false);
      setError(target.error);
      return;
    }

    const supabase = createClient();
    const { error: uploadErr } = await supabase.storage.from(target.bucket).upload(target.path, file);
    if (uploadErr) {
      setUploading(false);
      setError(`Upload failed: ${uploadErr.message}`);
      return;
    }

    const res = await createSubmissionRecord(dealId, target.path, file.name, fileSizeMb);
    setUploading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 text-[13px] font-bold text-white">Round 1</div>
      {!file ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full cursor-pointer rounded-xl border-2 border-dashed border-border p-5 text-center focus:outline-none focus:ring-2 focus:ring-accent/60"
          >
            <div className="mb-1 text-[13px] font-semibold text-light">Upload Content File</div>
            <div className="text-[11px] text-muted">MP4, MOV, JPG up to {SUBMISSION_MAX_SIZE_MB}MB</div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Choose content file"
            onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
          />
        </>
      ) : (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-zgreen/30 bg-dark p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">{file.name}</div>
            <div className="text-[11px] text-muted">{(file.size / 1048576).toFixed(1)} MB</div>
          </div>
          <button type="button" onClick={() => setFile(null)} className="text-muted" aria-label="Remove selected file">
            &times;
          </button>
        </div>
      )}
      {error && (
        <div className="mt-2.5 rounded-[10px] border border-accent/20 bg-accent/10 px-3.5 py-2 text-xs text-accent">
          {error}
        </div>
      )}
      <Button
        fullWidth
        size="sm"
        className="mt-3"
        disabled={!file || uploading}
        onClick={handleSubmit}
      >
        {uploading ? "Uploading..." : "Submit for Review"}
      </Button>
    </div>
  );
}
