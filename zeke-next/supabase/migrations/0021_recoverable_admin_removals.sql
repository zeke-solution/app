-- Recoverable administrator removals.
-- Relational deletion and operation-state updates happen in one transaction.
-- Auth and Storage are external systems, so their cleanup is completed by the
-- server action and can be retried from the removal log.

create table if not exists public.admin_removal_jobs (
  id                    uuid primary key default gen_random_uuid(),
  actor_id              uuid references public.profiles(id) on delete set null,
  entity_type           text not null check (entity_type in (
    'user', 'campaign', 'deal', 'dispute',
    'shield_request', 'shield_case', 'legal_provider'
  )),
  entity_id             uuid not null,
  entity_label          text not null default 'Removal target',
  status                text not null default 'pending' check (status in (
    'pending', 'database_complete', 'needs_review', 'complete'
  )),
  details               jsonb not null default '{}'::jsonb,
  storage_refs          jsonb not null default '[]'::jsonb,
  last_error            text,
  attempt_count         integer not null default 0 check (attempt_count >= 0),
  database_completed_at timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.admin_removal_jobs is
  'Retryable operation state for destructive actions initiated by administrators.';

create index if not exists admin_removal_jobs_created_idx
  on public.admin_removal_jobs (created_at desc);

create unique index if not exists admin_removal_jobs_active_target_uidx
  on public.admin_removal_jobs (entity_type, entity_id)
  where status <> 'complete';

alter table public.admin_removal_jobs enable row level security;

drop policy if exists admin_removal_jobs_select on public.admin_removal_jobs;
create policy admin_removal_jobs_select
on public.admin_removal_jobs for select to authenticated
using (public.is_admin());

revoke all on table public.admin_removal_jobs from anon;
revoke insert, update, delete on table public.admin_removal_jobs from authenticated;
grant select on table public.admin_removal_jobs to authenticated;
grant all on table public.admin_removal_jobs to service_role;

alter table public.admin_removal_audit
  add column if not exists job_id uuid references public.admin_removal_jobs(id) on delete restrict;

create unique index if not exists admin_removal_audit_job_uidx
  on public.admin_removal_audit (job_id);

create or replace function public.admin_delete_deals_for_removal(p_deal_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal_ids uuid[] := coalesce(p_deal_ids, array[]::uuid[]);
  v_case_count integer := 0;
  v_refs jsonb := '[]'::jsonb;
begin
  select coalesce(array_agg(d.id), array[]::uuid[])
  into v_deal_ids
  from public.deals d
  where d.id = any(v_deal_ids);

  if cardinality(v_deal_ids) = 0 then
    return jsonb_build_object(
      'deals_removed', 0,
      'shield_cases_removed', 0,
      'storage_refs', '[]'::jsonb
    );
  end if;

  select coalesce(jsonb_agg(ref), '[]'::jsonb)
  into v_refs
  from (
    select jsonb_build_object('bucket', 'submissions', 'value', s.file_url) as ref
    from public.submissions s
    where s.deal_id = any(v_deal_ids) and nullif(btrim(s.file_url), '') is not null
    union all
    select jsonb_build_object('bucket', 'payment-proof', 'value', p.proof_url)
    from public.payments p
    where p.deal_id = any(v_deal_ids) and nullif(btrim(p.proof_url), '') is not null
    union all
    select jsonb_build_object('bucket', 'agreements', 'value', a.pdf_url)
    from public.agreements a
    where a.deal_id = any(v_deal_ids) and nullif(btrim(a.pdf_url), '') is not null
    union all
    select jsonb_build_object('bucket', 'shield-case-files', 'value', doc.storage_path)
    from public.shield_case_documents doc
    join public.shield_cases sc on sc.id = doc.case_id
    join public.disputes dispute on dispute.id = sc.dispute_id
    where dispute.deal_id = any(v_deal_ids)
      and nullif(btrim(doc.storage_path), '') is not null
  ) refs;

  select count(*)::integer
  into v_case_count
  from public.shield_cases sc
  join public.disputes dispute on dispute.id = sc.dispute_id
  where dispute.deal_id = any(v_deal_ids);

  delete from public.shield_cases sc
  using public.disputes dispute
  where sc.dispute_id = dispute.id
    and dispute.deal_id = any(v_deal_ids);

  delete from public.disputes
  where deal_id = any(v_deal_ids);

  delete from public.notifications
  where related_deal_id = any(v_deal_ids);

  delete from public.deals
  where id = any(v_deal_ids);

  return jsonb_build_object(
    'deals_removed', cardinality(v_deal_ids),
    'shield_cases_removed', v_case_count,
    'storage_refs', v_refs
  );
end;
$$;

revoke all on function public.admin_delete_deals_for_removal(uuid[]) from public;

create or replace function public.admin_prepare_removal(
  p_job_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.admin_removal_jobs%rowtype;
  v_label text;
  v_details jsonb := '{}'::jsonb;
  v_deal_result jsonb := '{}'::jsonb;
  v_refs jsonb := '[]'::jsonb;
  v_deal_ids uuid[] := array[]::uuid[];
  v_campaign_ids uuid[] := array[]::uuid[];
  v_count integer := 0;
  v_role text;
  v_avatar_url text;
  v_dispute public.disputes%rowtype;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select * into v_job
  from public.admin_removal_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'removal job not found' using errcode = 'P0002';
  end if;

  if v_job.database_completed_at is not null then
    return jsonb_build_object(
      'job_id', v_job.id,
      'entity_type', v_job.entity_type,
      'entity_id', v_job.entity_id,
      'entity_label', v_job.entity_label,
      'details', v_job.details,
      'storage_refs', v_job.storage_refs
    );
  end if;

  if v_job.entity_type = 'deal' then
    select title into v_label from public.deals where id = v_job.entity_id for update;
    if not found then raise exception 'Deal not found' using errcode = 'P0002'; end if;
    v_deal_result := public.admin_delete_deals_for_removal(array[v_job.entity_id]);
    v_refs := v_deal_result->'storage_refs';
    v_details := v_deal_result - 'storage_refs';

  elsif v_job.entity_type = 'campaign' then
    select title into v_label from public.campaigns where id = v_job.entity_id for update;
    if not found then raise exception 'Campaign not found' using errcode = 'P0002'; end if;
    select coalesce(array_agg(id), array[]::uuid[]) into v_deal_ids
    from public.deals where campaign_id = v_job.entity_id;
    v_deal_result := public.admin_delete_deals_for_removal(v_deal_ids);
    v_refs := v_deal_result->'storage_refs';
    v_details := (v_deal_result - 'storage_refs') || jsonb_build_object('campaigns_removed', 1);
    delete from public.campaigns where id = v_job.entity_id;

  elsif v_job.entity_type = 'user' then
    select display_name, role, avatar_url
    into v_label, v_role, v_avatar_url
    from public.profiles
    where id = v_job.entity_id
    for update;
    if not found then raise exception 'Account not found' using errcode = 'P0002'; end if;
    if v_role = 'admin' then
      raise exception 'Administrator accounts cannot be removed here' using errcode = '42501';
    end if;

    select coalesce(array_agg(id), array[]::uuid[])
    into v_campaign_ids
    from public.campaigns
    where brand_id = v_job.entity_id;

    select coalesce(array_agg(d.id), array[]::uuid[])
    into v_deal_ids
    from public.deals d
    where d.brand_id = v_job.entity_id
       or d.influencer_id = v_job.entity_id
       or d.campaign_id = any(v_campaign_ids);

    v_deal_result := public.admin_delete_deals_for_removal(v_deal_ids);
    v_refs := v_deal_result->'storage_refs';

    select count(*)::integer into v_count
    from public.shield_cases
    where creator_id = v_job.entity_id;

    select v_refs || coalesce(jsonb_agg(
      jsonb_build_object('bucket', 'shield-case-files', 'value', doc.storage_path)
    ), '[]'::jsonb)
    into v_refs
    from public.shield_case_documents doc
    join public.shield_cases sc on sc.id = doc.case_id
    where sc.creator_id = v_job.entity_id
      and nullif(btrim(doc.storage_path), '') is not null;

    delete from public.shield_cases where creator_id = v_job.entity_id;
    delete from public.campaigns where id = any(v_campaign_ids);
    delete from public.shield_requests where influencer_id = v_job.entity_id;
    update public.legal_providers set created_by = null where created_by = v_job.entity_id;

    -- Defensive detachment for references that may point at the user outside
    -- one of their own deals. The underlying business record is preserved.
    update public.deal_messages set sender_id = null where sender_id = v_job.entity_id;
    update public.payments set sent_by = null where sent_by = v_job.entity_id;
    update public.payments set confirmed_by = null where confirmed_by = v_job.entity_id;
    update public.disputes set raised_by = null where raised_by = v_job.entity_id;
    update public.shield_case_updates set actor_id = null where actor_id = v_job.entity_id;

    if nullif(btrim(v_avatar_url), '') is not null then
      v_refs := v_refs || jsonb_build_array(
        jsonb_build_object('bucket', 'avatars', 'value', v_avatar_url)
      );
    end if;

    v_details := (v_deal_result - 'storage_refs') || jsonb_build_object(
      'role', v_role,
      'campaigns_removed', cardinality(v_campaign_ids),
      'additional_shield_cases_removed', v_count
    );

  elsif v_job.entity_type = 'dispute' then
    select * into v_dispute
    from public.disputes
    where id = v_job.entity_id
    for update;
    if not found then raise exception 'Dispute not found' using errcode = 'P0002'; end if;
    v_label := 'Dispute: ' || left(v_dispute.reason, 80);

    select coalesce(jsonb_agg(
      jsonb_build_object('bucket', 'shield-case-files', 'value', doc.storage_path)
    ), '[]'::jsonb)
    into v_refs
    from public.shield_case_documents doc
    join public.shield_cases sc on sc.id = doc.case_id
    where sc.dispute_id = v_job.entity_id
      and nullif(btrim(doc.storage_path), '') is not null;

    select count(*)::integer into v_count
    from public.shield_cases where dispute_id = v_job.entity_id;
    delete from public.shield_cases where dispute_id = v_job.entity_id;
    delete from public.disputes where id = v_job.entity_id;
    if v_dispute.deal_id is not null then
      update public.deals
      set status = coalesce(v_dispute.previous_deal_status, 'negotiating')
      where id = v_dispute.deal_id and status = 'disputed';
    end if;
    v_details := jsonb_build_object('shield_cases_removed', v_count);

  elsif v_job.entity_type = 'shield_request' then
    select 'Shield request' into v_label
    from public.shield_requests where id = v_job.entity_id for update;
    if not found then raise exception 'Shield request not found' using errcode = 'P0002'; end if;
    delete from public.shield_requests where id = v_job.entity_id;

  elsif v_job.entity_type = 'shield_case' then
    select 'Shield case' into v_label
    from public.shield_cases where id = v_job.entity_id for update;
    if not found then raise exception 'Shield case not found' using errcode = 'P0002'; end if;
    select coalesce(jsonb_agg(
      jsonb_build_object('bucket', 'shield-case-files', 'value', storage_path)
    ), '[]'::jsonb)
    into v_refs
    from public.shield_case_documents
    where case_id = v_job.entity_id and nullif(btrim(storage_path), '') is not null;
    delete from public.shield_cases where id = v_job.entity_id;

  elsif v_job.entity_type = 'legal_provider' then
    select display_name into v_label
    from public.legal_providers where id = v_job.entity_id for update;
    if not found then raise exception 'Legal provider not found' using errcode = 'P0002'; end if;
    delete from public.legal_providers where id = v_job.entity_id;

  else
    raise exception 'Unsupported removal type' using errcode = '22023';
  end if;

  update public.admin_removal_jobs
  set entity_label = coalesce(nullif(v_label, ''), 'Removal target'),
      status = 'database_complete',
      details = coalesce(v_details, '{}'::jsonb),
      storage_refs = coalesce(v_refs, '[]'::jsonb),
      last_error = null,
      attempt_count = attempt_count + 1,
      database_completed_at = now(),
      updated_at = now()
  where id = v_job.id
  returning * into v_job;

  return jsonb_build_object(
    'job_id', v_job.id,
    'entity_type', v_job.entity_type,
    'entity_id', v_job.entity_id,
    'entity_label', v_job.entity_label,
    'details', v_job.details,
    'storage_refs', v_job.storage_refs
  );
end;
$$;

revoke all on function public.admin_prepare_removal(uuid, uuid) from public;
grant execute on function public.admin_prepare_removal(uuid, uuid) to service_role;

create or replace function public.admin_complete_removal(
  p_job_id uuid,
  p_actor_id uuid,
  p_storage_warnings jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.admin_removal_jobs%rowtype;
  v_details jsonb;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor_id and role = 'admin'
  ) then
    raise exception 'admin only' using errcode = '42501';
  end if;

  select * into v_job
  from public.admin_removal_jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'removal job not found' using errcode = 'P0002';
  end if;
  if v_job.database_completed_at is null then
    raise exception 'database removal is not complete' using errcode = '55000';
  end if;
  if v_job.status = 'complete' then return; end if;

  v_details := v_job.details || jsonb_build_object(
    'storage_cleanup_warnings', coalesce(p_storage_warnings, '[]'::jsonb)
  );

  insert into public.admin_removal_audit (
    job_id, actor_id, entity_type, entity_id, entity_label, details
  ) values (
    v_job.id, v_job.actor_id, v_job.entity_type,
    v_job.entity_id, v_job.entity_label, v_details
  )
  on conflict (job_id) do nothing;

  update public.admin_removal_jobs
  set status = 'complete',
      details = v_details,
      last_error = null,
      completed_at = now(),
      updated_at = now()
  where id = v_job.id;
end;
$$;

revoke all on function public.admin_complete_removal(uuid, uuid, jsonb) from public;
grant execute on function public.admin_complete_removal(uuid, uuid, jsonb) to service_role;

-- Enforce the documented limits at the bucket boundary as well as in the UI.
update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/heic', 'image/heif'
    ]
where id = 'payment-proof';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['application/pdf']
where id = 'agreements';
