-- Price Zeke Shield at INR 1,999 per month for all new activations.
-- Existing memberships retain the expiry date already recorded on their row.

create or replace function public.activate_shield_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  creator_id uuid;
  expiry date := (current_date + interval '1 month')::date;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  update public.shield_requests
  set status = 'activated', activated_at = now(), expires_at = expiry
  where id = p_request_id and status = 'pending'
  returning influencer_id into creator_id;
  if creator_id is null then return false; end if;

  update public.influencer_profiles
  set shield_active = true, shield_expires = expiry
  where id = creator_id;

  insert into public.notifications (user_id, title, body, type)
  values (
    creator_id,
    'Shield Activated',
    format('Your Zeke Shield is active until %s.', expiry),
    'system'
  );
  return true;
end;
$$;

comment on function public.activate_shield_request(uuid) is
  'Admin activation for a pending INR 1,999 monthly Shield request. Existing expiry dates are not changed by this migration.';
