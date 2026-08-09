-- Existing avatars predate URL versioning. Add a one-time version token so
-- browsers and the public Storage CDN fetch the current uploaded object now.

update public.profiles
set avatar_url =
  avatar_url
  || '?v='
  || (floor(extract(epoch from clock_timestamp()) * 1000)::bigint)::text
where avatar_url is not null
  and avatar_url <> ''
  and avatar_url not like '%?v=%'
  and avatar_url ~ '^https://[a-z0-9-]+[.]supabase[.]co/storage/v1/object/public/avatars/';
