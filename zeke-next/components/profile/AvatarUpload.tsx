"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarPath } from "@/actions/profile";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function AvatarUpload({
  userId,
  avatarUrl,
  initials,
}: {
  userId: string;
  avatarUrl: string | null;
  initials: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function upload(file: File) {
    setError("");
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension) {
      setError("Use a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Profile image must be 5 MB or smaller.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const objectPath = `${userId}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(objectPath, file, { cacheControl: "3600", upsert: true, contentType: file.type });

    if (uploadError) {
      setPending(false);
      setError(uploadError.message);
      return;
    }

    const result = await updateAvatarPath(objectPath);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    setPreview(`${data.publicUrl}?v=${Date.now()}`);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/20 bg-cover bg-center text-base font-black text-accent"
          style={preview ? { backgroundImage: `url(${preview})` } : undefined}
          aria-label="Profile picture"
        >
          {!preview && initials}
        </div>
        <div>
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-light disabled:opacity-50"
          >
            {pending ? "Uploading..." : preview ? "Change profile picture" : "Upload profile picture"}
          </button>
          <div className="mt-1 text-[10px] text-muted">JPG, PNG or WebP - up to 5 MB</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {error && <div className="mt-2 text-xs font-semibold text-accent">{error}</div>}
    </div>
  );
}
