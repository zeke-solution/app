-- Classify disputes from the deal creator's current Shield membership.
--
-- The original atomic dispute RPC looked up Shield on auth.uid(). That made
-- the same deal render as a standard warning when the brand raised it, even
-- when the creator had Shield. It also trusted shield_active without checking
-- whether the dated membership had expired. The locked deal row is the
-- authoritative source for the creator whose membership applies.

create or replace function public.raise_dispute_transaction(
  p_deal_id uuid,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  v_deal public.deals%rowtype;
  v_name text;
  v_reason text := nullif(trim(p_reason), '');
  v_shield boolean := false;
  v_other uuid;
begin
  if actor is null then return 'not_authenticated'; end if;
  if v_reason is null then return 'reason_required'; end if;
  if length(v_reason) > 2000 then return 'reason_too_long'; end if;

  select * into v_deal
  from public.deals
  where id = p_deal_id
  for update;

  if not found or (
    v_deal.brand_id is distinct from actor
    and v_deal.influencer_id is distinct from actor
  ) then
    return 'not_your_deal';
  end if;
  if coalesce(v_deal.status, '') = 'disputed' then return 'already_disputed'; end if;
  if coalesce(v_deal.status, '') in ('completed', 'cancelled') then return 'deal_closed'; end if;

  select
    coalesce(ip.shield_active, false)
    and (ip.shield_expires is null or ip.shield_expires >= current_date)
  into v_shield
  from public.influencer_profiles ip
  where ip.id = v_deal.influencer_id;
  v_shield := coalesce(v_shield, false);

  insert into public.disputes (deal_id, raised_by, reason, status, previous_deal_status)
  values (p_deal_id, actor, v_reason, 'open', v_deal.status);

  update public.deals
  set status = 'disputed', updated_at = now()
  where id = p_deal_id;

  select display_name into v_name
  from public.profiles
  where id = actor;
  v_name := coalesce(v_name, 'User');

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (
    p_deal_id,
    actor,
    case when v_shield then 'event_gold' else 'event' end,
    case when v_shield then 'Shield' else 'Warning' end
      || ': dispute raised by ' || v_name || ': ' || v_reason
  );

  v_other := case
    when v_deal.influencer_id is not distinct from actor then v_deal.brand_id
    else v_deal.influencer_id
  end;
  if v_other is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (
      v_other,
      'Dispute opened',
      left(v_name || ' raised a dispute on ' || v_deal.title, 1000),
      'system',
      p_deal_id
    );
  end if;

  return null;
end;
$$;

revoke all on function public.raise_dispute_transaction(uuid, text) from public;
revoke all on function public.raise_dispute_transaction(uuid, text) from anon;
grant execute on function public.raise_dispute_transaction(uuid, text) to authenticated;
