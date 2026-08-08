-- Security-definer provider selection must enforce the same checked-record
-- requirement as the directory RLS policy.

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
  where id = p_provider_id and active and verified_at is not null;
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
  from public.legal_providers
  where id = target.selected_provider_id and active and verified_at is not null;
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
