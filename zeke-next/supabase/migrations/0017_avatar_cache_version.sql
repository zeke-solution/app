-- Persist a versioned public avatar URL so replacement uploads are visible
-- immediately instead of reusing a browser or CDN-cached URL.

create or replace function public.set_profile_avatar(
  p_object_path text,
  p_avatar_url text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  expected_path text;
  expected_suffix text;
  public_url_without_query text;
begin
  if actor is null then return 'not_authenticated'; end if;

  expected_path := actor::text || '/avatar.';
  if p_object_path is null
     or left(p_object_path, length(expected_path)) <> expected_path
     or split_part(p_object_path, '.', 2) not in ('jpg', 'png', 'webp')
     or p_object_path <> expected_path || split_part(p_object_path, '.', 2) then
    return 'invalid_avatar_path';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'avatars' and name = p_object_path
  ) then
    return 'avatar_not_uploaded';
  end if;

  expected_suffix := '/storage/v1/object/public/avatars/' || p_object_path;
  public_url_without_query := split_part(p_avatar_url, '?', 1);
  if p_avatar_url is null
     or public_url_without_query !~ '^https://[a-z0-9-]+[.]supabase[.]co/'
     or right(public_url_without_query, length(expected_suffix)) <> expected_suffix
     or p_avatar_url !~ '[?]v=[0-9]+$' then
    return 'invalid_avatar_url';
  end if;

  update public.profiles
  set avatar_url = p_avatar_url
  where id = actor;

  if not found then return 'profile_not_found'; end if;
  return null;
end;
$$;

revoke all on function public.set_profile_avatar(text, text) from public;
revoke all on function public.set_profile_avatar(text, text) from anon;
grant execute on function public.set_profile_avatar(text, text) to authenticated;
