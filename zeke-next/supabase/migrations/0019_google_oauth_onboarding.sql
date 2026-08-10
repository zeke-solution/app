-- Safe Google OAuth onboarding.
--
-- OAuth providers do not carry Zeke's creator/brand profile metadata. New
-- OAuth identities therefore enter a deliberately restricted `pending`
-- state and cannot access either dashboard until the authenticated owner
-- completes the matching profile through the narrow RPC below.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default true;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('pending', 'influencer', 'brand', 'admin'));

alter table public.profiles
  drop constraint if exists profiles_onboarding_state_check;

alter table public.profiles
  add constraint profiles_onboarding_state_check
  check (
    (role = 'pending' and onboarding_completed = false)
    or (role <> 'pending' and onboarding_completed = true)
  );

comment on column public.profiles.onboarding_completed is
  'False only while a new OAuth identity is completing the required Zeke creator or brand profile.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb;
  has_app_role boolean;
  v_role text;
  v_display_name text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  has_app_role := coalesce(meta->>'role' in ('brand', 'influencer'), false);
  v_role := case
    when meta->>'role' = 'brand' then 'brand'
    when meta->>'role' = 'influencer' then 'influencer'
    else 'pending'
  end;
  v_display_name := coalesce(
    nullif(trim(meta->>'display_name'), ''),
    nullif(trim(meta->>'full_name'), ''),
    nullif(trim(meta->>'name'), ''),
    split_part(coalesce(new.email, 'Zeke user'), '@', 1)
  );

  insert into public.profiles (
    id,
    role,
    display_name,
    location,
    onboarding_completed
  )
  values (
    new.id,
    v_role,
    v_display_name,
    nullif(trim(meta->>'location'), ''),
    has_app_role
  );

  -- OAuth users stop here. Their role-specific row is created atomically by
  -- complete_google_onboarding only after the owner chooses a role.
  if not has_app_role then
    return new;
  end if;

  if v_role = 'influencer' then
    insert into public.influencer_profiles (
      id, niche, handle, ig_followers,
      yt_followers, x_followers, yt_handle, x_handle,
      yt_enabled, x_enabled, is_adult
    ) values (
      new.id,
      meta->>'niche',
      meta->>'handle',
      greatest(coalesce((meta->>'ig_followers')::int, 0), 0),
      greatest(nullif(meta->>'yt_followers','')::int, 0),
      greatest(nullif(meta->>'x_followers','')::int, 0),
      nullif(meta->>'yt_handle',''),
      nullif(meta->>'x_handle',''),
      coalesce((meta->>'yt_enabled')::boolean, false),
      coalesce((meta->>'x_enabled')::boolean, false),
      coalesce((meta->>'is_adult')::boolean, true)
    );

    if coalesce((meta->>'is_adult')::boolean, true) = false
       and nullif(meta->>'guardian_name', '') is not null then
      insert into public.guardians (
        influencer_id,
        guardian_name,
        guardian_email,
        relation
      )
      values (
        new.id,
        meta->>'guardian_name',
        meta->>'guardian_email',
        meta->>'guardian_relation'
      );
    end if;
  else
    insert into public.brand_profiles (id, brand_type)
    values (
      new.id,
      case
        when meta->>'brand_type' in ('business', 'ngo', 'agency')
          then meta->>'brand_type'
        else 'business'
      end
    );
  end if;

  return new;
end;
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  onboarding_rpc boolean;
begin
  onboarding_rpc :=
    coalesce(current_setting('app.google_onboarding', true), '') = '1';

  if auth.uid() is not null
     and not public.is_admin()
     and (
       new.role is distinct from old.role
       or new.onboarding_completed is distinct from old.onboarding_completed
     )
     and not onboarding_rpc then
    raise exception 'role and onboarding state cannot be changed by the account owner'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.complete_google_onboarding(
  p_role text,
  p_display_name text,
  p_location text,
  p_brand_type text,
  p_niche text,
  p_handle text,
  p_ig_followers integer,
  p_yt_enabled boolean,
  p_yt_handle text,
  p_yt_followers integer,
  p_x_enabled boolean,
  p_x_handle text,
  p_x_followers integer,
  p_is_adult boolean,
  p_guardian_name text,
  p_guardian_email text,
  p_guardian_relation text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid;
  target public.profiles%rowtype;
  clean_handle text;
begin
  actor := auth.uid();
  if actor is null then
    return 'unauthenticated';
  end if;

  if not exists (
    select 1
    from auth.identities auth_identity
    where auth_identity.user_id = actor
      and auth_identity.provider = 'google'
  ) then
    return 'google_identity_required';
  end if;

  select *
  into target
  from public.profiles
  where id = actor
  for update;

  if not found then
    return 'profile_missing';
  end if;

  if target.onboarding_completed or target.role <> 'pending' then
    return 'already_completed';
  end if;

  if exists (
    select 1 from public.influencer_profiles where id = actor
    union all
    select 1 from public.brand_profiles where id = actor
  ) then
    return 'profile_state_invalid';
  end if;

  if p_role not in ('influencer', 'brand')
     or nullif(trim(p_display_name), '') is null
     or length(trim(p_display_name)) > 120
     or nullif(trim(p_location), '') is null
     or length(trim(p_location)) > 120 then
    return 'invalid_profile';
  end if;

  if p_role = 'brand' then
    if p_brand_type not in ('business', 'ngo', 'agency') then
      return 'invalid_brand';
    end if;
  else
    clean_handle := lower(regexp_replace(coalesce(trim(p_handle), ''), '^@', ''));

    if nullif(trim(p_niche), '') is null
       or length(trim(p_niche)) > 60
       or clean_handle !~ '^[a-z0-9._]{2,30}$'
       or coalesce(p_ig_followers, 0) < 1
       or p_is_adult is null then
      return 'invalid_creator';
    end if;

    if not p_is_adult and (
      nullif(trim(p_guardian_name), '') is null
      or nullif(trim(p_guardian_email), '') is null
      or p_guardian_relation not in (
        'Parent',
        'Legal Guardian',
        'Sibling (18+)',
        'Other Authorized Person'
      )
    ) then
      return 'guardian_required';
    end if;
  end if;

  perform set_config('app.google_onboarding', '1', true);

  update public.profiles
  set
    role = p_role,
    display_name = trim(p_display_name),
    location = trim(p_location),
    onboarding_completed = true
  where id = actor;

  if p_role = 'brand' then
    insert into public.brand_profiles (id, brand_type)
    values (actor, p_brand_type);
  else
    insert into public.influencer_profiles (
      id,
      niche,
      handle,
      ig_followers,
      yt_followers,
      x_followers,
      yt_handle,
      x_handle,
      yt_enabled,
      x_enabled,
      is_adult
    )
    values (
      actor,
      trim(p_niche),
      clean_handle,
      p_ig_followers,
      case when coalesce(p_yt_enabled, false)
        then greatest(coalesce(p_yt_followers, 0), 0) else null end,
      case when coalesce(p_x_enabled, false)
        then greatest(coalesce(p_x_followers, 0), 0) else null end,
      case when coalesce(p_yt_enabled, false)
        then nullif(trim(p_yt_handle), '') else null end,
      case when coalesce(p_x_enabled, false)
        then nullif(trim(p_x_handle), '') else null end,
      coalesce(p_yt_enabled, false),
      coalesce(p_x_enabled, false),
      p_is_adult
    );

    if not p_is_adult then
      insert into public.guardians (
        influencer_id,
        guardian_name,
        guardian_email,
        relation
      )
      values (
        actor,
        trim(p_guardian_name),
        trim(p_guardian_email),
        p_guardian_relation
      );
    end if;
  end if;

  return null;
exception
  when unique_violation then
    return 'handle_taken';
end;
$$;

revoke all on function public.complete_google_onboarding(
  text, text, text, text, text, text, integer, boolean, text, integer,
  boolean, text, integer, boolean, text, text, text
) from public;

revoke all on function public.complete_google_onboarding(
  text, text, text, text, text, text, integer, boolean, text, integer,
  boolean, text, integer, boolean, text, text, text
) from anon;

grant execute on function public.complete_google_onboarding(
  text, text, text, text, text, text, integer, boolean, text, integer,
  boolean, text, integer, boolean, text, text, text
) to authenticated;
