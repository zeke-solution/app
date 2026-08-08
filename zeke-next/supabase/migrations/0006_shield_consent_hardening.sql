-- Final consent and privacy hardening for Shield coordination.

-- Only checked provider records are visible/selectable by creators.
drop policy if exists legal_providers_read on public.legal_providers;
create policy legal_providers_read on public.legal_providers for select to authenticated
using (
  public.is_admin()
  or (active and verified_at is not null and public.has_active_shield(auth.uid()))
);

-- A client cannot bypass the server action and mark evidence for provider
-- sharing unless a provider and current case-level consent both exist.
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
        and (
          not shared_with_provider
          or (
            sc.selected_provider_id is not null
            and sc.share_with_provider_consent
          )
        )
    )
  )
);

-- Replace the update logger so private notes never generate creator-facing
-- notifications, and legal-coordination entries require engagement + consent.
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

  if safe_kind = 'legal_coordination' and (
    target.engagement_confirmed_at is null
    or not target.share_with_provider_consent
    or target.selected_provider_id is null
  ) then
    return 'legal_coordination_not_authorised';
  end if;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body, audience)
  values (
    p_case_id, actor, case when actor_is_admin then 'admin' else 'creator' end,
    safe_kind, safe_body, safe_audience
  );

  if actor_is_admin and safe_audience = 'creator_and_admin' then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    select target.creator_id, 'Shield case update', left(safe_body, 1000), 'system', d.deal_id
    from public.disputes d where d.id = target.dispute_id;
  end if;

  return null;
end;
$$;

-- The creator can stop all future optional sharing at any time. Previously
-- shared records remain in the audit history; this function does not pretend
-- to recall copies already lawfully received by an engaged provider.
create or replace function public.withdraw_shield_provider_sharing(p_case_id uuid)
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
  select * into target from public.shield_cases where id = p_case_id for update;
  if not found or target.creator_id is distinct from actor then return 'not_your_case'; end if;
  if not target.share_with_provider_consent then return 'sharing_already_off'; end if;

  update public.shield_cases
  set share_with_provider_consent = false
  where id = p_case_id;

  insert into public.shield_case_updates (case_id, actor_id, actor_role, kind, body)
  values (
    p_case_id, actor, 'creator', 'creator_decision',
    'Creator withdrew consent for future optional sharing and provider coordination. Previously shared records are not recalled.'
  );

  return null;
end;
$$;

-- A closed/resolved case must contain an explicit outcome in addition to the
-- timeline note explaining the administrative change.
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
  if p_status in ('resolved', 'closed') and safe_outcome is null then return 'outcome_required'; end if;
  if length(safe_note) > 4000 or length(coalesce(safe_outcome, '')) > 4000 then return 'note_too_long'; end if;

  select * into target from public.shield_cases where id = p_case_id for update;
  if not found then return 'case_not_found'; end if;
  if p_status = 'legal_coordination' and (
    target.engagement_confirmed_at is null
    or not target.share_with_provider_consent
  ) then return 'engagement_not_confirmed'; end if;

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

revoke all on function public.withdraw_shield_provider_sharing(uuid) from public;
grant execute on function public.withdraw_shield_provider_sharing(uuid) to authenticated;
