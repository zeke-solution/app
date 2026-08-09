-- Make creator content uploads match the application's 100 MB limit and
-- preserve file sizes for small phone images instead of rounding to 0.0 MB.

alter table public.submissions
  alter column file_size_mb type numeric(8,3);

update storage.buckets
set file_size_limit = 104857600,
    allowed_mime_types = array[
      'video/mp4',
      'video/quicktime',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
where id = 'submissions';
