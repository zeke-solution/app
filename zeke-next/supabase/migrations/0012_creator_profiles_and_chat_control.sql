-- Creator public profiles, avatar storage, and completed-chat control.

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.deals
  add column if not exists creator_chat_closed_at timestamptz;

create unique index if not exists influencer_profiles_handle_lower_uidx
  on public.influencer_profiles (lower(handle))
  where handle is not null and btrim(handle) <> '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
for select to public
using (bucket_id = 'avatars');

drop policy if exists avatars_own_insert on storage.objects;
create policy avatars_own_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_own_update on storage.objects;
create policy avatars_own_update on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.get_public_creator_profile(p_handle text)
returns table (
  display_name text,
  location text,
  avatar_url text,
  handle text,
  niche text,
  ig_followers integer,
  yt_followers integer,
  x_followers integer,
  yt_enabled boolean,
  x_enabled boolean,
  rating numeric,
  verified boolean,
  shield_active boolean,
  completed_deals bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.display_name,
    p.location,
    p.avatar_url,
    ip.handle,
    ip.niche,
    ip.ig_followers,
    ip.yt_followers,
    ip.x_followers,
    ip.yt_enabled,
    ip.x_enabled,
    ip.rating,
    ip.verified,
    (
      coalesce(ip.shield_active, false)
      and (ip.shield_expires is null or ip.shield_expires >= current_date)
    ) as shield_active,
    (
      select count(*)
      from public.deals d
      where d.influencer_id = ip.id and d.status = 'completed'
    ) as completed_deals
  from public.influencer_profiles ip
  join public.profiles p on p.id = ip.id
  where lower(ip.handle) = lower(btrim(p_handle))
  limit 1;
$$;

revoke all on function public.get_public_creator_profile(text) from public;
grant execute on function public.get_public_creator_profile(text) to anon, authenticated;

create or replace function public.guard_creator_chat_control()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.creator_chat_closed_at is distinct from old.creator_chat_closed_at
     and coalesce(current_setting('zeke.creator_chat_control', true), '') <> 'allowed' then
    raise exception 'creator_chat_control_requires_rpc';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_creator_chat_control on public.deals;
create trigger guard_creator_chat_control
before update of creator_chat_closed_at on public.deals
for each row execute function public.guard_creator_chat_control();

create or replace function public.set_creator_chat_closed(p_deal_id uuid, p_closed boolean)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.deals%rowtype;
  creator_name text;
begin
  if auth.uid() is null then return 'not_authenticated'; end if;

  select * into target from public.deals where id = p_deal_id for update;
  if not found then return 'not_found'; end if;
  if target.influencer_id <> auth.uid() then return 'not_creator'; end if;
  if target.status <> 'completed' then return 'deal_not_completed'; end if;

  perform set_config('zeke.creator_chat_control', 'allowed', true);
  update public.deals
  set creator_chat_closed_at = case when p_closed then now() else null end,
      updated_at = now()
  where id = p_deal_id;

  select display_name into creator_name from public.profiles where id = auth.uid();

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (
    p_deal_id,
    auth.uid(),
    'event',
    case when p_closed
      then coalesce(creator_name, 'The creator') || ' closed brand messaging for this completed deal.'
      else coalesce(creator_name, 'The creator') || ' reopened brand messaging for this completed deal.'
    end
  );

  perform public.create_notification(
    target.brand_id,
    case when p_closed then 'Completed chat closed' else 'Completed chat reopened' end,
    case when p_closed
      then 'The creator closed messaging for ' || target.title || '.'
      else 'The creator reopened messaging for ' || target.title || '.'
    end,
    'deal',
    target.id
  );

  return null;
end;
$$;

revoke all on function public.set_creator_chat_closed(uuid, boolean) from public;
grant execute on function public.set_creator_chat_closed(uuid, boolean) to authenticated;

create or replace function public.block_closed_completed_brand_chat()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target public.deals%rowtype;
begin
  if new.msg_type <> 'text' then return new; end if;

  select * into target from public.deals where id = new.deal_id;
  if target.status = 'completed'
     and target.creator_chat_closed_at is not null
     and new.sender_id = target.brand_id then
    raise exception 'creator_closed_completed_chat';
  end if;

  return new;
end;
$$;

drop trigger if exists block_closed_completed_brand_chat on public.deal_messages;
create trigger block_closed_completed_brand_chat
before insert on public.deal_messages
for each row execute function public.block_closed_completed_brand_chat();
