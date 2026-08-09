import { Upload } from "tus-js-client";

const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

function resumableEndpoint(supabaseUrl: string) {
  const url = new URL(supabaseUrl);
  if (url.hostname.endsWith(".supabase.co")) {
    const projectId = url.hostname.split(".")[0];
    return `${url.protocol}//${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
  }
  return `${url.origin}/storage/v1/upload/resumable`;
}

export function uploadResumableFile({
  supabaseUrl,
  accessToken,
  bucket,
  path,
  file,
  contentType,
  onProgress,
}: {
  supabaseUrl: string;
  accessToken: string;
  bucket: string;
  path: string;
  file: File;
  contentType: string;
  onProgress: (percentage: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: resumableEndpoint(supabaseUrl),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE_BYTES,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType,
        cacheControl: "3600",
      },
      onProgress(bytesUploaded, bytesTotal) {
        onProgress(Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100)));
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        onProgress(100);
        resolve();
      },
    });

    void upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch(reject);
  });
}
