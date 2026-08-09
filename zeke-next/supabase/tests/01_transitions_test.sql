-- Drives the six atomic transitions as simulated authenticated users.
-- `set local role authenticated` + request.jwt.claims is exactly how PostgREST
-- presents a logged-in user, so RLS and the 0002 triggers behave as they will
-- in production.

create or replace function test_eq(actual text, expected text, label text)
returns void language plpgsql as $$
begin
  if actual is not distinct from expected then
    raise notice 'PASS  %', label;
  else
    raise notice 'FAIL  % | expected=[%] got=[%]', label, coalesce(expected,'<null>'), coalesce(actual,'<null>');
  end if;
end $$;
grant execute on function test_eq(text,text,text) to public;

create or replace function test_cancel_disputed_deal(target_deal_id uuid)
returns text language plpgsql as $$
begin
  update public.deals set status = 'cancelled' where id = target_deal_id;
  return 'not_blocked';
exception
  when sqlstate '42501' then return 'blocked';
end $$;
grant execute on function test_cancel_disputed_deal(uuid) to public;

-- ---------------------------------------------------------------- fixtures
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','creator@t.com',
   '{"role":"influencer","display_name":"Test Creator","ig_followers":"1000"}'),
  ('22222222-2222-2222-2222-222222222222','brand@t.com',
   '{"role":"brand","display_name":"Test Brand","brand_type":"business"}'),
  ('33333333-3333-3333-3333-333333333333','admin@t.com',
   '{"role":"influencer","display_name":"Test Admin"}'),
  ('44444444-4444-4444-4444-444444444444','stranger@t.com',
   '{"role":"influencer","display_name":"Stranger","ig_followers":"5"}');

update public.profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';

insert into public.deals (id, brand_id, influencer_id, title, amount, status) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111','Happy Path Deal', 5000, 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111','Dispute Deal', 5000, 'active');

\echo '=============== fmt_amount matches fmtNum() ==============='
select test_eq(public.fmt_amount(5000),    '5.0K',   'fmt 5000 -> 5.0K');
select test_eq(public.fmt_amount(500),     '500',    'fmt 500 -> 500');
select test_eq(public.fmt_amount(500.00),  '500',    'fmt 500.00 -> 500');
select test_eq(public.fmt_amount(500.50),  '500.5',  'fmt 500.50 -> 500.5');
select test_eq(public.fmt_amount(999.99),  '999.99', 'fmt 999.99 -> 999.99');
select test_eq(public.fmt_amount(1000),    '1.0K',   'fmt 1000 -> 1.0K');
select test_eq(public.fmt_amount(1500000), '1.5M',   'fmt 1500000 -> 1.5M');
select test_eq(public.fmt_amount(0),       '0',      'fmt 0 -> 0');
select test_eq(public.fmt_amount(null),    '0',      'fmt null -> 0');

\echo '=============== 1. creator submits content ==============='
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.submit_content_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/1_clip.mp4',
    'clip.mp4', 12.5), null, 'submit_content returns null (success)');
commit;
select test_eq((select status from public.deals where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'submitted', 'deal moved active -> submitted');
select test_eq((select count(*)::text from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '1', 'submission row created');
select test_eq((select round::text from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '1', 'submission round = 1');
select test_eq((select count(*)::text from public.deal_messages where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '1', 'event message created');
select test_eq((select count(*)::text from public.notifications
  where user_id='22222222-2222-2222-2222-222222222222'), '1', 'brand notified of submission');

\echo '--- negative: brand cannot submit content ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.submit_content_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/x.mp4',
    'x.mp4', 1), 'not_your_deal', 'brand submitting -> not_your_deal');
commit;

\echo '--- negative: file path belonging to another user is rejected ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.submit_content_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '44444444-4444-4444-4444-444444444444/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/x.mp4',
    'x.mp4', 1), 'file_mismatch', 'foreign file path -> file_mismatch');
commit;

\echo '=============== 2. brand reviews submission ==============='
\echo '--- negative: creator cannot review their own work ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.review_submission_transaction(
    (select id from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','approved',null),
    'not_your_deal', 'creator reviewing -> not_your_deal');
commit;

\echo '--- negative: reject with no note ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.review_submission_transaction(
    (select id from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','rejected','   '),
    'note_required', 'reject without note -> note_required');
commit;

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.review_submission_transaction(
    (select id from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','approved',null),
    null, 'review approve returns null (success)');
commit;
select test_eq((select status from public.deals where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'approved', 'deal moved submitted -> approved');
select test_eq((select status from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'approved', 'submission marked approved');

\echo '--- negative: double review ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.review_submission_transaction(
    (select id from public.submissions where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','approved',null),
    'wrong_status', 'second review -> wrong_status (deal no longer submitted)');
commit;

\echo '=============== 3. creator submits final link ==============='
\echo '--- negative: bad scheme ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.submit_final_link_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','javascript:alert(1)'),
    'invalid_scheme', 'javascript: URL -> invalid_scheme');
commit;

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.submit_final_link_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','https://instagram.com/p/abc'),
    null, 'final link returns null (success)');
commit;
select test_eq((select status from public.deals where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'link_submitted', 'deal moved approved -> link_submitted');

\echo '--- negative: duplicate final link ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.submit_final_link_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','https://instagram.com/p/def'),
    'wrong_status', 'second link -> wrong_status');
commit;

\echo '=============== 4. brand marks payment sent ==============='
\echo '--- negative: wrong amount ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.mark_payment_sent_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1), 'amount_mismatch', 'underpay -> amount_mismatch');
commit;

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.mark_payment_sent_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5000), null, 'mark payment returns null (success)');
commit;
select test_eq((select status from public.deals where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'payment_sent', 'deal moved link_submitted -> payment_sent');
select test_eq((select amount::text from public.payments where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  '5000.00', 'payment amount recorded from deal');
select test_eq((select content from public.deal_messages
  where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and msg_type='event_gold'),
  'Payment of ₹5.0K sent by Test Brand', 'payment event message text');

\echo '=============== 5. creator confirms payment ==============='
\echo '--- negative: brand cannot confirm ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  select test_eq(public.confirm_payment_transaction(
    (select id from public.payments where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'not_your_deal', 'brand confirming -> not_your_deal');
commit;

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.confirm_payment_transaction(
    (select id from public.payments where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), null, 'confirm payment returns null (success)');
commit;
select test_eq((select status from public.deals where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'completed', 'deal moved payment_sent -> completed');
select test_eq((select status from public.payments where deal_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'confirmed', 'payment marked confirmed');

\echo '=============== 6. dispute ==============='
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222"}';
  update public.deals
  set cancel_requested_by = '22222222-2222-2222-2222-222222222222',
      cancel_reason = 'Close before dispute'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
commit;

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.raise_dispute_transaction(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Brand ghosted me'), null, 'raise dispute returns null (success)');
commit;
select test_eq((select status from public.deals where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'disputed', 'deal moved active -> disputed');
select test_eq((select previous_deal_status from public.disputes where deal_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'active', 'pre-dispute status captured for restore');

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.test_cancel_disputed_deal(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'blocked',
    'pending cancellation cannot close a disputed deal');
commit;
select test_eq((select status from public.deals where id='bbbbbbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'disputed', 'blocked cancellation leaves deal disputed');

\echo '--- negative: stranger cannot dispute ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444"}';
  select test_eq(public.raise_dispute_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','not mine'), 'not_your_deal', 'stranger dispute -> not_your_deal');
commit;

\echo '--- negative: dispute on completed deal ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.raise_dispute_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','too late'), 'deal_closed', 'dispute completed deal -> deal_closed');
commit;

\echo '--- negative: double dispute ---'
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111"}';
  select test_eq(public.raise_dispute_transaction(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','again'), 'already_disputed', 'second dispute -> already_disputed');
commit;

\echo '=============== admin resolves, status restores ==============='
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333"}';
  select test_eq(public.resolve_dispute_transaction(
    (select id from public.disputes where deal_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    'Both sides agreed')::text, 'true', 'admin resolve dispute -> true');
commit;
select test_eq((select status from public.deals where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'active', 'deal restored disputed -> active');
