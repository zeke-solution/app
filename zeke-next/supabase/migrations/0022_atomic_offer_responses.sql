-- Make creator offer responses atomic and protect acceptance from stale terms.
--
-- The old Server Actions updated the deal first, then wrote the agreement,
-- event message, and notification as independent PostgREST calls whose errors
-- were ignored. A downstream failure could therefore leave an active or
-- cancelled deal without its supporting records while still returning
-- success. The accept path also checked only the current status, so a brand
-- edit committed after the creator rendered the offer could be accepted
-- without the creator seeing the changed terms.
--
-- This function locks the deal before checking state. Acceptance compares the
-- exact updated_at snapshot rendered to the creator; decline deliberately does
-- not, because changing terms does not invalidate a creator's decision to
-- reject the offer. Every write is in the function transaction and therefore
-- commits or rolls back as a unit.

create or replace function public.respond_to_offer_transaction(
  p_deal_id uuid,
  p_decision text,
  p_seen_updated_at timestamptz
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
  v_shield boolean := false;
begin
  if actor is null then return 'not_authenticated'; end if;
  if p_decision not in ('accept', 'decline') then return 'invalid_decision'; end if;

  select * into v_deal
  from public.deals
  where id = p_deal_id
  for update;

  if not found or v_deal.influencer_id is distinct from actor then
    return 'not_your_deal';
  end if;
  if v_deal.status is distinct from 'negotiating' then
    return 'wrong_status';
  end if;
  if p_decision = 'accept' and (
    p_seen_updated_at is null
    or v_deal.updated_at is distinct from p_seen_updated_at
  ) then
    return 'offer_changed';
  end if;

  select display_name into v_name
  from public.profiles
  where id = actor;
  v_name := coalesce(v_name, 'Creator');

  if p_decision = 'accept' then
    select coalesce(shield_active, false)
      and (shield_expires is null or shield_expires >= current_date)
    into v_shield
    from public.influencer_profiles
    where id = actor;
    v_shield := coalesce(v_shield, false);

    update public.deals
    set status = 'active', updated_at = now()
    where id = p_deal_id;

    insert into public.agreements (deal_id, signed_brand, signed_creator)
    values (p_deal_id, true, true)
    on conflict (deal_id) do nothing;

    insert into public.deal_messages (deal_id, sender_id, msg_type, content)
    values (
      p_deal_id,
      actor,
      case when v_shield then 'event_gold' else 'event' end,
      (case when v_shield then '🛡 ' else '✓ ' end)
        || 'Offer accepted by ' || v_name || ' · Deal active'
        || (case when v_shield then ' · Shield agreement generated' else '' end)
    );

    if v_deal.brand_id is not null then
      insert into public.notifications (user_id, title, body, type, related_deal_id)
      values (
        v_deal.brand_id,
        'Offer accepted',
        left(v_name || ' accepted your offer · ' || v_deal.title, 1000),
        'deal',
        p_deal_id
      );
    end if;
  else
    update public.deals
    set status = 'cancelled', updated_at = now()
    where id = p_deal_id;

    insert into public.deal_messages (deal_id, sender_id, msg_type, content)
    values (p_deal_id, actor, 'event', '✗ Offer declined by ' || v_name);

    if v_deal.brand_id is not null then
      insert into public.notifications (user_id, title, body, type, related_deal_id)
      values (
        v_deal.brand_id,
        'Offer declined',
        left(v_name || ' declined your offer · ' || v_deal.title, 1000),
        'deal',
        p_deal_id
      );
    end if;
  end if;

  return null;
end;
$$;

revoke all on function public.respond_to_offer_transaction(uuid, text, timestamptz) from public;
revoke all on function public.respond_to_offer_transaction(uuid, text, timestamptz) from anon;
grant execute on function public.respond_to_offer_transaction(uuid, text, timestamptz) to authenticated;
