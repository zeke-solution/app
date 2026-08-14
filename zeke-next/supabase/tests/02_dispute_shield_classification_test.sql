-- Regression coverage for migration 0023.
-- The brand is deliberately the actor in both cases so the assertions prove
-- that classification follows the deal creator's membership, not auth.uid().

create or replace function test_eq_dispute_shield(
  actual text,
  expected text,
  label text
)
returns void
language plpgsql
as $$
begin
  if actual is not distinct from expected then
    raise notice 'PASS  %', label;
  else
    raise notice 'FAIL  % | expected=[%] got=[%]',
      label,
      coalesce(expected, '<null>'),
      coalesce(actual, '<null>');
  end if;
end;
$$;
grant execute on function test_eq_dispute_shield(text, text, text) to public;

insert into auth.users (id, email, raw_user_meta_data) values
  ('55555555-5555-5555-5555-555555555555', 'shield-creator@t.com',
   '{"role":"influencer","display_name":"Shield Creator","ig_followers":"1000"}'),
  ('66666666-6666-6666-6666-666666666666', 'shield-brand@t.com',
   '{"role":"brand","display_name":"Shield Brand","brand_type":"business"}');

insert into public.deals (
  id,
  brand_id,
  influencer_id,
  title,
  amount,
  status,
  updated_at
) values
  ('77777777-7777-7777-7777-777777777777',
   '66666666-6666-6666-6666-666666666666',
   '55555555-5555-5555-5555-555555555555',
   'Brand Shield Dispute', 4000, 'active', '2026-08-14 10:00:00+00'),
  ('88888888-8888-8888-8888-888888888888',
   '66666666-6666-6666-6666-666666666666',
   '55555555-5555-5555-5555-555555555555',
   'Expired Shield Dispute', 4000, 'active', '2026-08-14 10:00:00+00');

\echo '--- active creator Shield applies when the brand raises the dispute ---'
update public.influencer_profiles
set shield_active = true,
    shield_expires = current_date + 1
where id = '55555555-5555-5555-5555-555555555555';

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666"}';
  select test_eq_dispute_shield(public.raise_dispute_transaction(
    '77777777-7777-7777-7777-777777777777',
    'Creator needs Shield support'
  ), null, 'brand raises a Shield-classified dispute for active creator membership');
commit;

select test_eq_dispute_shield((select raised_by::text from public.disputes
  where deal_id = '77777777-7777-7777-7777-777777777777'),
  '66666666-6666-6666-6666-666666666666',
  'Shield dispute records the brand as actor');
select test_eq_dispute_shield((select msg_type from public.deal_messages
  where deal_id = '77777777-7777-7777-7777-777777777777'),
  'event_gold', 'active creator membership produces a gold dispute event');
select test_eq_dispute_shield((select (content like 'Shield:%')::text
  from public.deal_messages
  where deal_id = '77777777-7777-7777-7777-777777777777'),
  'true', 'active creator membership produces the Shield dispute label');

\echo '--- expired creator Shield is not active ---'
update public.influencer_profiles
set shield_active = true,
    shield_expires = current_date - 1
where id = '55555555-5555-5555-5555-555555555555';

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666"}';
  select test_eq_dispute_shield(public.raise_dispute_transaction(
    '88888888-8888-8888-8888-888888888888',
    'Membership has expired'
  ), null, 'brand raises a standard dispute for expired creator membership');
commit;

select test_eq_dispute_shield((select msg_type from public.deal_messages
  where deal_id = '88888888-8888-8888-8888-888888888888'),
  'event', 'expired creator membership produces a standard dispute event');
select test_eq_dispute_shield((select (content like 'Warning:%')::text
  from public.deal_messages
  where deal_id = '88888888-8888-8888-8888-888888888888'),
  'true', 'expired creator membership produces the warning label');
