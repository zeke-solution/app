-- Zeke Shield case coordination and independent legal-provider directory.
--
-- Product boundary enforced by this migration:
--   * Zeke provides assisted follow-up, settlement coordination, records, and
--     case administration.
--   * The creator decides whether and when to seek independent legal help.
--   * A legal provider is selected and engaged directly by the creator.
--   * Provider fees and legal costs are paid directly by the creator. Zeke
--     does not take a referral fee or percentage of a recovery.

-- ---------------------------------------------------------------------------
-- 1. Independent legal-provider directory
-- ---------------------------------------------------------------------------

create table if not exists public.legal_providers (
  id                    uuid primary key default gen_random_uuid(),
  display_name          text not null check (char_length(trim(display_name)) between 2 and 160),
  provider_type         text not null check (provider_type in ('advocate', 'law_firm')),
  firm_scale            text not null check (firm_scale in ('independent', 'boutique', 'mid_size', 'full_service')),
  city                  text,
  state                 text,
  languages             text[] not null default '{}',
  matter_types          text[] not null default '{}',
  profile_summary       text,
  fee_note              text,
  contact_email         text,
  contact_phone         text,
  website               text,
  enrollment_reference text,
  verified_at           timestamptz,
  active                boolean not null default true,
  created_by            uuid references public.profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  check (contact_email is not null or contact_phone is not null or website is not null)
);

comment on table public.legal_providers is
  'Factual directory of independent advocates and law firms available to Shield creators. No ranking, recommendation, or Zeke fee share is implied.';
comment on column public.legal_providers.matter_types is
  'Self-reported matter types handled; not a Zeke claim of specialization or outcome quality.';

-- ---------------------------------------------------------------------------
-- 2. Shield cases, timeline, and evidence metadata
-- ---------------------------------------------------------------------------

create table if not exists public.shield_cases (
  id                         uuid primary key default gen_random_uuid(),
  dispute_id                 uuid not null unique references public.disputes(id) on delete restrict,
  creator_id                 uuid not null references public.profiles(id) on delete restrict,
  status                     text not null default 'intake'
                             check (status in (
                               'intake', 'assisted_follow_up', 'settlement_talks',
                               'lawyer_selection', 'legal_coordination',
                               'resolved', 'closed'
                             )),
  creator_path               text not null default 'undecided'
                             check (creator_path in ('undecided', 'follow_up', 'legal')),
  selected_provider_id       uuid references public.legal_providers(id) on delete set null,
  contact_brand_consent      boolean not null default false,
  share_with_provider_consent boolean not null default false,
  legal_cost_acknowledged    boolean not null default false,
  independent_advice_acknowledged boolean not null default false,
  creator_decided_at         timestamptz,
  engagement_confirmed_at    timestamptz,
  outcome                    text,
  opened_at                  timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  closed_at                  timestamptz
);

comment on table public.shield_cases is
  'Creator-controlled Shield support case. A selected provider remains independent and is engaged and paid directly by the creator.';

create table if not exists public.shield_case_updates (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.shield_cases(id) on delete cascade,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  text not null check (actor_role in ('creator', 'admin', 'system')),
  kind        text not null check (kind in (
                'case_opened', 'creator_decision', 'follow_up',
                'settlement_talk', 'provider_selected',
                'engagement_confirmed', 'legal_coordination',
                'document_added', 'status_change', 'note', 'outcome'
              )),
  body        text not null check (char_length(trim(body)) between 1 and 4000),
  audience    text not null default 'creator_and_admin'
              check (audience in ('creator_and_admin', 'admin_only')),
  created_at  timestamptz not null default now()
);

create table if not exists public.shield_case_documents (
  id                    uuid primary key default gen_random_uuid(),
  case_id               uuid not null references public.shield_cases(id) on delete cascade,
  uploaded_by           uuid not null references public.profiles(id) on delete restrict,
  category              text not null check (category in (
                          'agreement', 'invoice', 'communication',
                          'payment_record', 'deliverable', 'legal', 'other'
                        )),
  file_name             text not null,
  storage_path          text not null unique,
  mime_type             text not null,
  size_bytes            bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  shared_with_provider  boolean not null default false,
  created_at            timestamptz not null default now()
);

create index if not exists shield_cases_creator_idx
  on public.shield_cases (creator_id, opened_at desc);
create index if not exists shield_cases_status_idx
  on public.shield_cases (status, updated_at desc);
create index if not exists shield_case_updates_case_idx
  on public.shield_case_updates (case_id, created_at asc);
create index if not exists shield_case_documents_case_idx
  on public.shield_case_documents (case_id, created_at desc);
create index if not exists legal_providers_active_idx
  on public.legal_providers (active, state, city);

-- Keep mutable directory and case timestamps reliable regardless of client.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists legal_providers_touch_updated_at on public.legal_providers;
create trigger legal_providers_touch_updated_at
before update on public.legal_providers
for each row execute function public.touch_updated_at();

drop trigger if exists shield_cases_touch_updated_at on public.shield_cases;
create trigger shield_cases_touch_updated_at
before update on public.shield_cases
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 3. RLS: Shield members see their case and factual directory; admins manage.
-- ---------------------------------------------------------------------------

alter table public.legal_providers enable row level security;
alter table public.shield_cases enable row level security;
alter table public.shield_case_updates enable row level security;
alter table public.shield_case_documents enable row level security;

create or replace function public.has_active_shield(p_creator_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.influencer_profiles ip
    where ip.id = p_creator_id
      and coalesce(ip.shield_active, false)
      and (ip.shield_expires is null or ip.shield_expires >= current_date)
  );
$$;

drop policy if exists legal_providers_read on public.legal_providers;
create policy legal_providers_read on public.legal_providers for select to authenticated
using (
  public.is_admin()
  or (active and public.has_active_shield(auth.uid()))
);

drop policy if exists legal_providers_admin_insert on public.legal_providers;
create policy legal_providers_admin_insert on public.legal_providers for insert to authenticated
with check (public.is_admin() and created_by = auth.uid());

drop policy if exists legal_providers_admin_update on public.legal_providers;
create policy legal_providers_admin_update on public.legal_providers for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists legal_providers_admin_delete on public.legal_providers;
create policy legal_providers_admin_delete on public.legal_providers for delete to authenticated
using (public.is_admin());

drop policy if exists shield_cases_read on public.shield_cases;
create policy shield_cases_read on public.shield_cases for select to authenticated
using (creator_id = auth.uid() or public.is_admin());

drop policy if exists shield_case_updates_read on public.shield_case_updates;
create policy shield_case_updates_read on public.shield_case_updates for select to authenticated
using (
  public.is_admin()
  or (
    audience = 'creator_and_admin'
    and exists (
      select 1 from public.shield_cases sc
      where sc.id = case_id and sc.creator_id = auth.uid()
    )
  )
);

drop policy if exists shield_case_documents_read on public.shield_case_documents;
create policy shield_case_documents_read on public.shield_case_documents for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.shield_cases sc
    where sc.id = case_id and sc.creator_id = auth.uid()
  )
);

drop policy if exists shield_case_documents_insert on public.shield_case_documents;
create policy shield_case_documents_insert on public.shield_case_documents for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1 from public.shield_cases sc
      where sc.id = case_id
        and sc.creator_id = auth.uid()
        and sc.status not in ('resolved', 'closed')
    )
  )
);

-- No direct client writes to case status, consents, or the audit timeline.
revoke insert, update, delete on public.shield_cases from authenticated;
revoke insert, update, delete on public.shield_case_updates from authenticated;
revoke update, delete on public.shield_case_documents from authenticated;

-- ---------------------------------------------------------------------------
-- 4. Automatically open a Shield case for disputes involving a Shield creator.
-- ---------------------------------------------------------------------------

create or replace function public.open_shield_case_for_dispute()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_creator uuid;
  v_case_id uuid;
begin
  select d.influencer_id into v_creator
  from public.deals d
  where d.id = new.deal_id;

  if v_creator is null or not public.has_active_shield(v_creator) then
    return new;
  end if;

  insert into public.shield_cases (dispute_id, creator_id)
  values (new.id, v_creator)
  on conflict (dispute_id) do nothing
  returning id into v_case_id;

  if v_case_id is not null then
    insert into public.shield_case_updates (
      case_id, actor_id, actor_role, kind, body
    ) values (
      v_case_id, null, 'system', 'case_opened',
      'Shield case opened. The creator controls whether to continue with assisted follow-up or seek independent legal help.'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists dispute_open_shield_case on public.disputes;
create trigger dispute_open_shield_case
after insert on public.disputes
for each row execute function public.open_shield_case_for_dispute();

-- Backfill an eligible open/escalated dispute without altering its status.
with eligible as (
  select d.id as dispute_id, deal.influencer_id as creator_id
  from public.disputes d
  join public.deals deal on deal.id = d.deal_id
  join public.influencer_profiles ip on ip.id = deal.influencer_id
  left join public.shield_cases sc on sc.dispute_id = d.id
  where d.status in ('open', 'escalated')
    and coalesce(ip.shield_active, false)
    and (ip.shield_expires is null or ip.shield_expires >= current_date)
    and sc.id is null
), inserted as (
  insert into public.shield_cases (dispute_id, creator_id)
  select dispute_id, creator_id from eligible
  returning id
)
insert into public.shield_case_updates (case_id, actor_role, kind, body)
select id, 'system', 'case_opened',
  'Existing eligible dispute added to Shield case support.'
from inserted;

-- ---------------------------------------------------------------------------
-- 5. Creator decisions and auditable case coordination RPCs.
-- ---------------------------------------------------------------------------

create or replace function public.choose_shield_case_path(
  p_case_id uuid,
  p_path text,
  p_contact_brand_consent boolean,
  p_legal_cost_acknowledged boolean default false,
  p_independent_advice_acknowledged boolean default false
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.shield_cases%rowtype;
begin
  if actor is null then return 'not_authenticated'; end if;
  if p_path not in ('follow_up', 'legal') then return 'invalid_path'; end if;

  select * into target from public.shield_cases where id = p_case_id for update;
  if not found or target.creator_id is distinct from actor then return 'not_your_case'; end if;
  if target.status in ('resolved', 'closed') then return 'case_closed'; end if;
  if not public.has_active_shield(actor) then return 'shield_inactive'; end if;
  if p_path = 'follow_up' and not coalesce(p_contact_brand_consent, false) then
    return 'contact_consent_required';
  end if;
  if p_path = 'legal' and (
    not coalesce(p_legal_cost_acknowledged, false)
    or not coalesce(p_independent_advice_acknowledged, false)
  ) then
    return 'legal_acknowledgements_required';
  end if;

  update public.shield_cases
  set creator_path = p_path,
      status = case when p_path = 'follow_up' then 'assisted_follow_up' else 'lawyer_selection' end,
      contact_brand_consent = coalesce(p_contact_brand_consent, false),
      legal_cost_acknowledged = coalesce(p_legal_cost_acknowledged, false),
      independent_advice_acknowledged = coalesce(p_independent_advice_acknowledged, false),
      creator_decided_at = now()
  where id = p_case_id;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body)
  values (
    p_case_id, actor, 'creator', 'creator_decision',
    case when p_path = 'follow_up'
      then 'Creator chose assisted follow-up and authorised Zeke to contact the brand for this case.'
      else 'Creator chose to explore independent legal help and acknowledged that legal fees and decisions remain their responsibility.'
    end
  );

  return null;
end;
$$;

create or replace function public.select_shield_legal_provider(
  p_case_id uuid,
  p_provider_id uuid,
  p_share_consent boolean,
  p_legal_cost_acknowledged boolean,
  p_independent_advice_acknowledged boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.shield_cases%rowtype;
  provider_name text;
begin
  if actor is null then return 'not_authenticated'; end if;
  select * into target from public.shield_cases where id = p_case_id for update;
  if not found or target.creator_id is distinct from actor then return 'not_your_case'; end if;
  if target.status in ('resolved', 'closed') then return 'case_closed'; end if;
  if not public.has_active_shield(actor) then return 'shield_inactive'; end if;
  if not coalesce(p_share_consent, false) then return 'share_consent_required'; end if;
  if not coalesce(p_legal_cost_acknowledged, false)
     or not coalesce(p_independent_advice_acknowledged, false) then
    return 'legal_acknowledgements_required';
  end if;

  select display_name into provider_name
  from public.legal_providers
  where id = p_provider_id and active;
  if provider_name is null then return 'provider_unavailable'; end if;

  update public.shield_cases
  set creator_path = 'legal',
      status = 'lawyer_selection',
      selected_provider_id = p_provider_id,
      share_with_provider_consent = true,
      legal_cost_acknowledged = true,
      independent_advice_acknowledged = true,
      creator_decided_at = coalesce(creator_decided_at, now())
  where id = p_case_id;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body)
  values (
    p_case_id, actor, 'creator', 'provider_selected',
    'Creator selected ' || provider_name || ' for direct contact and authorised relevant case records to be shared after engagement.'
  );

  return null;
end;
$$;

create or replace function public.confirm_shield_legal_engagement(p_case_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.shield_cases%rowtype;
  provider_name text;
begin
  if actor is null then return 'not_authenticated'; end if;
  select * into target from public.shield_cases where id = p_case_id for update;
  if not found or target.creator_id is distinct from actor then return 'not_your_case'; end if;
  if target.status in ('resolved', 'closed') then return 'case_closed'; end if;
  if target.selected_provider_id is null then return 'provider_required'; end if;
  if not target.share_with_provider_consent
     or not target.legal_cost_acknowledged
     or not target.independent_advice_acknowledged then
    return 'legal_acknowledgements_required';
  end if;

  select display_name into provider_name
  from public.legal_providers where id = target.selected_provider_id and active;
  if provider_name is null then return 'provider_unavailable'; end if;

  update public.shield_cases
  set status = 'legal_coordination', engagement_confirmed_at = now()
  where id = p_case_id;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body)
  values (
    p_case_id, actor, 'creator', 'engagement_confirmed',
    'Creator confirmed a direct engagement with ' || provider_name || '. Zeke may now coordinate authorised case communication and records.'
  );

  return null;
end;
$$;

create or replace function public.add_shield_case_update(
  p_case_id uuid,
  p_body text,
  p_kind text default 'note',
  p_audience text default 'creator_and_admin'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.shield_cases%rowtype;
  actor_is_admin boolean;
  safe_body text := nullif(trim(p_body), '');
  safe_kind text;
  safe_audience text;
begin
  if actor is null then return 'not_authenticated'; end if;
  if safe_body is null then return 'note_required'; end if;
  if length(safe_body) > 4000 then return 'note_too_long'; end if;

  select * into target from public.shield_cases where id = p_case_id;
  if not found then return 'case_not_found'; end if;
  actor_is_admin := public.is_admin();
  if not actor_is_admin and target.creator_id is distinct from actor then return 'not_your_case'; end if;
  if target.status in ('resolved', 'closed') and not actor_is_admin then return 'case_closed'; end if;

  safe_kind := case
    when actor_is_admin and p_kind in ('follow_up', 'settlement_talk', 'legal_coordination', 'note') then p_kind
    else 'note'
  end;
  safe_audience := case
    when actor_is_admin and p_audience = 'admin_only' then 'admin_only'
    else 'creator_and_admin'
  end;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body, audience)
  values (
    p_case_id, actor, case when actor_is_admin then 'admin' else 'creator' end,
    safe_kind, safe_body, safe_audience
  );

  if actor_is_admin then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    select target.creator_id, 'Shield case update', left(safe_body, 1000), 'system', d.deal_id
    from public.disputes d where d.id = target.dispute_id;
  end if;

  return null;
end;
$$;

create or replace function public.admin_update_shield_case(
  p_case_id uuid,
  p_status text,
  p_note text,
  p_outcome text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.shield_cases%rowtype;
  safe_note text := nullif(trim(p_note), '');
  safe_outcome text := nullif(trim(p_outcome), '');
begin
  if actor is null or not public.is_admin() then return 'admin_only'; end if;
  if p_status not in (
    'intake', 'assisted_follow_up', 'settlement_talks',
    'lawyer_selection', 'legal_coordination', 'resolved', 'closed'
  ) then return 'invalid_status'; end if;
  if safe_note is null then return 'note_required'; end if;
  if length(safe_note) > 4000 or length(coalesce(safe_outcome, '')) > 4000 then return 'note_too_long'; end if;

  select * into target from public.shield_cases where id = p_case_id for update;
  if not found then return 'case_not_found'; end if;
  if p_status = 'legal_coordination' and target.engagement_confirmed_at is null then
    return 'engagement_not_confirmed';
  end if;

  update public.shield_cases
  set status = p_status,
      outcome = case when p_status in ('resolved', 'closed') then safe_outcome else outcome end,
      closed_at = case when p_status in ('resolved', 'closed') then now() else null end
  where id = p_case_id;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body)
  values (
    p_case_id, actor, 'admin',
    case when p_status in ('resolved', 'closed') then 'outcome' else 'status_change' end,
    safe_note
  );

  insert into public.notifications (user_id, title, body, type, related_deal_id)
  select target.creator_id, 'Shield case updated', left(safe_note, 1000), 'system', d.deal_id
  from public.disputes d where d.id = target.dispute_id;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Private evidence bucket. Object path: case-id/user-id/file-name
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shield-case-files',
  'shield-case-files',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists shield_case_file_insert on storage.objects;
create policy shield_case_file_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'shield-case-files'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1 from public.shield_cases sc
    where sc.id::text = (storage.foldername(name))[1]
      and sc.status not in ('resolved', 'closed')
      and (sc.creator_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists shield_case_file_select on storage.objects;
create policy shield_case_file_select on storage.objects for select to authenticated
using (
  bucket_id = 'shield-case-files'
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1 from public.shield_cases sc
    where sc.id::text = (storage.foldername(name))[1]
      and (sc.creator_id = auth.uid() or public.is_admin())
  )
);

-- ---------------------------------------------------------------------------
-- 7. Function privileges
-- ---------------------------------------------------------------------------

revoke all on function public.touch_updated_at() from public;
revoke all on function public.has_active_shield(uuid) from public;
revoke all on function public.open_shield_case_for_dispute() from public;
revoke all on function public.choose_shield_case_path(uuid,text,boolean,boolean,boolean) from public;
revoke all on function public.select_shield_legal_provider(uuid,uuid,boolean,boolean,boolean) from public;
revoke all on function public.confirm_shield_legal_engagement(uuid) from public;
revoke all on function public.add_shield_case_update(uuid,text,text,text) from public;
revoke all on function public.admin_update_shield_case(uuid,text,text,text) from public;

grant execute on function public.has_active_shield(uuid) to authenticated;
grant execute on function public.choose_shield_case_path(uuid,text,boolean,boolean,boolean) to authenticated;
grant execute on function public.select_shield_legal_provider(uuid,uuid,boolean,boolean,boolean) to authenticated;
grant execute on function public.confirm_shield_legal_engagement(uuid) to authenticated;
grant execute on function public.add_shield_case_update(uuid,text,text,text) to authenticated;
grant execute on function public.admin_update_shield_case(uuid,text,text,text) to authenticated;
