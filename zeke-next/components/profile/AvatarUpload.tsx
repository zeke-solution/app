"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarPath } from "@/actions/profile";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function avatarObjectPath(value: string | null) {
  if (!value) return null;
  const marker = "/storage/v1/object/public/avatars/";
  const path = value.split(marker)[1]?.split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

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
    const previousObjectPath = avatarObjectPath(preview);
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
      .upload(objectPath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      setPending(false);
      setError(uploadError.message);
      return;
    }

    const result = await updateAvatarPath(objectPath);
    if (!result.ok) {
      if (previousObjectPath !== objectPath) {
        await supabase.storage.from("avatars").remove([objectPath]);
      }
      setPending(false);
      setError(result.error);
      return;
    }

    if (previousObjectPath && previousObjectPath !== objectPath) {
      await supabase.storage.from("avatars").remove([previousObjectPath]);
    }
    setPending(false);

    const { data } = supabase.storage.from("avatars").getPublicUrl(objectPath);
    setPreview(`${data.publicUrl}?v=${Date.now()}`);
    router.refresh();
  }

  return (
    <div>
      {/* Stacked so the avatar column stays narrow and the identity beside it
          starts right next to the picture rather than past a wide button. */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-accent/40 bg-accent/20 bg-cover bg-center text-xl font-semibold text-accent"
          style={preview ? { backgroundImage: `url(${preview})` } : undefined}
          aria-label="Profile picture"
        >
          {!preview && initials}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          title="JPG, PNG or WebP - up to 5 MB"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-accent hover:bg-navy disabled:opacity-50"
        >
          {pending ? "Uploading..." : preview ? "Change" : "Upload photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>
      {error && (
        <div className="mt-2 text-xs font-semibold text-accent">{error}</div>
      )}
    </div>
  );
}
