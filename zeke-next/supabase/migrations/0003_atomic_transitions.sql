-- Atomic workflow transitions (QA 2026-07-14, P1 #2).
-- Apply after 0002_security_hardening.sql.
--
-- Each of the six core transitions previously ran as several independent
-- PostgREST calls from a Server Action: insert the row, update the deal
-- status, insert the event message, insert the notification. A failure or a
-- lost connection between any two of them left the deal partially advanced
-- (for example a submission row with the deal still marked `active`, or a
-- payment row with the deal still marked `link_submitted`).
--
-- Every function here does the whole transition in one statement block, so it
-- commits or rolls back as a unit. Each takes `for update` on the deal row
-- first, which serialises concurrent attempts on the same deal and makes the
-- status checks below sound: once the lock is held no other transaction can
-- move the deal out from under us, so the follow-up writes are unconditional
-- rather than the previous `.eq("status", ...)` guards that could silently
-- match zero rows (QA P2).
--
-- Convention: returns null on success, or a short error code the calling
-- action maps to user-facing copy. Codes are returned only before any write;
-- anything that fails after a write raises and rolls the transaction back.
--
-- These are `security definer` so they can write notifications for the other
-- party (the notifications table has no insert policy for authenticated), so
-- each one re-checks deal membership itself. The state-machine triggers from
-- 0002 still apply: auth.uid() reads the request JWT, not the function owner,
-- so enforce_deal_update / enforce_submission_review /
-- enforce_payment_confirmation remain a second line of defence.

-- ---------------------------------------------------------------------------
-- Mirrors fmtNum() in lib/domain/format.ts so event-message amounts read the
-- same whether they were written by the app or by these functions.
-- ---------------------------------------------------------------------------

create or replace function public.fmt_amount(p_amount numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_amount is null or p_amount = 0 then '0'
    when p_amount >= 1000000 then
      trim(to_char(round(p_amount / 1000000.0, 1), 'FM999999990.0')) || 'M'
    when p_amount >= 1000 then
      trim(to_char(round(p_amount / 1000.0, 1), 'FM999999990.0')) || 'K'
    -- rtrim the '.': the FM modifier drops trailing zeros but leaves the
    -- decimal point, so a whole number like 500 formats as '500.' where
    -- fmtNum() gives '500'.
    else rtrim(trim(to_char(p_amount, 'FM999999990.999999')), '.')
  end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Creator submits content. Replaces createSubmissionRecord()'s four calls.
-- ---------------------------------------------------------------------------

create or replace function public.submit_content_transaction(
  p_deal_id uuid,
  p_file_url text,
  p_file_name text,
  p_file_size_mb numeric
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
  v_round int;
  v_prefix text;
begin
  if actor is null then return 'not_authenticated'; end if;

  if nullif(trim(p_file_url), '') is null or length(p_file_url) > 1024
     or nullif(trim(p_file_name), '') is null or length(p_file_name) > 255
     or p_file_size_mb is null or p_file_size_mb <= 0 or p_file_size_mb > 200 then
    return 'invalid_input';
  end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if not found or v_deal.influencer_id is distinct from actor then
    return 'not_your_deal';
  end if;
  -- coalesce, not a bare `not in`: a null status would make `not in` evaluate
  -- to null and fall through as if the check had passed. Same reason the
  -- single-status checks below use `is distinct from` rather than `<>`.
  if coalesce(v_deal.status, '') not in ('active', 'submitted') then
    return 'wrong_status';
  end if;

  -- Must match the path createSubmissionUploadTarget() handed out, which is
  -- also what the storage insert policy in 0002 allows.
  v_prefix := actor::text || '/' || p_deal_id::text || '/';
  if left(p_file_url, length(v_prefix)) <> v_prefix then return 'file_mismatch'; end if;

  select coalesce(max(round), 0) + 1 into v_round
  from public.submissions where deal_id = p_deal_id;

  insert into public.submissions (deal_id, round, file_url, file_name, file_size_mb, status)
  values (p_deal_id, v_round, p_file_url, trim(p_file_name), p_file_size_mb, 'pending');

  if v_deal.status = 'active' then
    update public.deals set status = 'submitted', updated_at = now() where id = p_deal_id;
  end if;

  select display_name into v_name from public.profiles where id = actor;
  v_name := coalesce(v_name, 'Creator');

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (
    p_deal_id, actor, 'event',
    '✓ File submitted by ' || v_name || ' · Awaiting brand review'
  );

  if v_deal.brand_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (
      v_deal.brand_id,
      left('New submission from ' || v_name, 200),
      left(v_deal.title || ' — review pending', 1000),
      'deal',
      p_deal_id
    );
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Brand reviews a submission. Replaces reviewSubmission()'s four calls.
-- ---------------------------------------------------------------------------

create or replace function public.review_submission_transaction(
  p_submission_id uuid,
  p_deal_id uuid,
  p_decision text,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  v_deal public.deals%rowtype;
  v_submission public.submissions%rowtype;
  v_name text;
  v_note text := nullif(trim(p_note), '');
begin
  if actor is null then return 'not_authenticated'; end if;
  if p_decision not in ('approved', 'rejected') then return 'invalid_input'; end if;
  if p_decision = 'rejected' and v_note is null then return 'note_required'; end if;
  if v_note is not null then v_note := left(v_note, 2000); end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if not found or v_deal.brand_id is distinct from actor then return 'not_your_deal'; end if;
  if v_deal.status is distinct from 'submitted' then return 'wrong_status'; end if;

  select * into v_submission from public.submissions
  where id = p_submission_id and deal_id = p_deal_id;
  if not found then return 'submission_mismatch'; end if;
  if v_submission.status is distinct from 'pending' then return 'already_reviewed'; end if;

  update public.submissions
  set status = p_decision, review_note = v_note, reviewed_at = now()
  where id = p_submission_id;

  if p_decision = 'approved' then
    update public.deals set status = 'approved', updated_at = now() where id = p_deal_id;
  end if;

  select display_name into v_name from public.profiles where id = actor;
  v_name := coalesce(v_name, 'Brand');

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (
    p_deal_id, actor, 'event',
    case when p_decision = 'approved'
      then '✓ Content approved by ' || v_name
      else '⟳ Changes requested by ' || v_name || coalesce(': ' || v_note, '')
    end
  );

  if v_deal.influencer_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (
      v_deal.influencer_id,
      case when p_decision = 'approved' then 'Content approved' else 'Changes requested' end,
      left(
        case when p_decision = 'approved'
          then v_deal.title || ' — you can now submit the live link.'
          else v_deal.title || ' — ' || coalesce(v_note, 'Brand requested changes.')
        end,
        1000
      ),
      'deal',
      p_deal_id
    );
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Creator submits the final live link. Replaces submitFinalLink()'s
--    read-then-insert-then-update, whose existence check raced the unique
--    index added in 0002.
-- ---------------------------------------------------------------------------

create or replace function public.submit_final_link_transaction(
  p_deal_id uuid,
  p_url text
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
  v_url text := trim(p_url);
begin
  if actor is null then return 'not_authenticated'; end if;
  if nullif(v_url, '') is null or length(v_url) > 2048 then return 'invalid_input'; end if;
  if v_url !~* '^https?://' then return 'invalid_scheme'; end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if not found or v_deal.influencer_id is distinct from actor then return 'not_your_deal'; end if;
  if v_deal.status is distinct from 'approved' then return 'wrong_status'; end if;

  if exists (select 1 from public.final_links where deal_id = p_deal_id) then
    return 'already_submitted';
  end if;

  insert into public.final_links (deal_id, url) values (p_deal_id, v_url);

  update public.deals set status = 'link_submitted', updated_at = now() where id = p_deal_id;

  select display_name into v_name from public.profiles where id = actor;
  v_name := coalesce(v_name, 'Creator');

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (p_deal_id, actor, 'event', '✓ Final link submitted by ' || v_name);

  -- No brand notification here: submitFinalLink() never sent one, and this
  -- migration deliberately preserves existing behaviour. See HANDOFF.md.

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Brand marks payment sent. Replaces markPaymentSent()'s five calls.
-- ---------------------------------------------------------------------------

create or replace function public.mark_payment_sent_transaction(
  p_deal_id uuid,
  p_amount numeric
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
begin
  if actor is null then return 'not_authenticated'; end if;
  if p_amount is null or p_amount <= 0 then return 'invalid_amount'; end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if not found or v_deal.brand_id is distinct from actor then return 'not_your_deal'; end if;
  if v_deal.status is distinct from 'link_submitted' then return 'wrong_status'; end if;

  -- The recorded amount always comes from the deal, never from the caller;
  -- p_amount is only cross-checked so a stale client form cannot pay a figure
  -- the brand never saw.
  if v_deal.amount is null or v_deal.amount <= 0 or p_amount <> v_deal.amount then
    return 'amount_mismatch';
  end if;

  if exists (select 1 from public.payments where deal_id = p_deal_id) then
    return 'already_sent';
  end if;

  insert into public.payments (deal_id, amount, sent_by, status, sent_at)
  values (p_deal_id, v_deal.amount, actor, 'pending', now());

  update public.deals set status = 'payment_sent', updated_at = now() where id = p_deal_id;

  select display_name into v_name from public.profiles where id = actor;
  v_name := coalesce(v_name, 'Brand');

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (
    p_deal_id, actor, 'event_gold',
    'Payment of ₹' || public.fmt_amount(v_deal.amount) || ' sent by ' || v_name
  );

  if v_deal.influencer_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (
      v_deal.influencer_id,
      'Payment sent',
      left(
        '₹' || public.fmt_amount(v_deal.amount) || ' has been sent for ' || v_deal.title
        || '. Confirm receipt to close the deal.',
        1000
      ),
      'payment',
      p_deal_id
    );
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Creator confirms payment and the deal completes. Replaces
--    confirmPayment()'s four calls.
-- ---------------------------------------------------------------------------

create or replace function public.confirm_payment_transaction(
  p_payment_id uuid,
  p_deal_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  v_deal public.deals%rowtype;
  v_payment public.payments%rowtype;
  v_name text;
begin
  if actor is null then return 'not_authenticated'; end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if not found or v_deal.influencer_id is distinct from actor then return 'not_your_deal'; end if;
  if v_deal.status is distinct from 'payment_sent' then return 'wrong_status'; end if;

  select * into v_payment from public.payments
  where id = p_payment_id and deal_id = p_deal_id for update;
  if not found then return 'payment_mismatch'; end if;
  if v_payment.status is distinct from 'pending' then return 'already_confirmed'; end if;

  update public.payments
  set status = 'confirmed', confirmed_by = actor, confirmed_at = now()
  where id = p_payment_id;

  update public.deals set status = 'completed', updated_at = now() where id = p_deal_id;

  select display_name into v_name from public.profiles where id = actor;
  v_name := coalesce(v_name, 'Creator');

  insert into public.deal_messages (deal_id, sender_id, msg_type, content)
  values (
    p_deal_id, actor, 'event',
    'Payment confirmed by ' || v_name || '. Deal complete.'
  );

  -- No brand notification here: confirmPayment() never sent one, and this
  -- migration deliberately preserves existing behaviour. See HANDOFF.md.

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Either party raises a dispute. Replaces raiseDispute()'s five calls.
--    The pre-dispute status is captured under the same lock that writes
--    'disputed', so resolve_dispute_transaction can always restore it.
-- ---------------------------------------------------------------------------

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
  v_shield boolean;
  v_other uuid;
begin
  if actor is null then return 'not_authenticated'; end if;
  if v_reason is null then return 'reason_required'; end if;
  if length(v_reason) > 2000 then return 'reason_too_long'; end if;

  select * into v_deal from public.deals where id = p_deal_id for update;
  if not found or (
    v_deal.brand_id is distinct from actor
    and v_deal.influencer_id is distinct from actor
  ) then
    return 'not_your_deal';
  end if;
  if coalesce(v_deal.status, '') = 'disputed' then return 'already_disputed'; end if;
  if coalesce(v_deal.status, '') in ('completed', 'cancelled') then return 'deal_closed'; end if;

  select coalesce(shield_active, false) into v_shield
  from public.influencer_profiles where id = actor;
  v_shield := coalesce(v_shield, false);

  insert into public.disputes (deal_id, raised_by, reason, status, previous_deal_status)
  values (p_deal_id, actor, v_reason, 'open', v_deal.status);

  update public.deals set status = 'disputed', updated_at = now() where id = p_deal_id;

  select display_name into v_name from public.profiles where id = actor;
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

-- ---------------------------------------------------------------------------
-- Grants. Same pattern as 0002: nothing to public, execute to authenticated.
-- ---------------------------------------------------------------------------

revoke all on function public.fmt_amount(numeric) from public;
revoke all on function public.submit_content_transaction(uuid, text, text, numeric) from public;
revoke all on function public.review_submission_transaction(uuid, uuid, text, text) from public;
revoke all on function public.submit_final_link_transaction(uuid, text) from public;
revoke all on function public.mark_payment_sent_transaction(uuid, numeric) from public;
revoke all on function public.confirm_payment_transaction(uuid, uuid) from public;
revoke all on function public.raise_dispute_transaction(uuid, text) from public;

grant execute on function public.fmt_amount(numeric) to authenticated;
grant execute on function public.submit_content_transaction(uuid, text, text, numeric) to authenticated;
grant execute on function public.review_submission_transaction(uuid, uuid, text, text) to authenticated;
grant execute on function public.submit_final_link_transaction(uuid, text) to authenticated;
grant execute on function public.mark_payment_sent_transaction(uuid, numeric) to authenticated;
grant execute on function public.confirm_payment_transaction(uuid, uuid) to authenticated;
grant execute on function public.raise_dispute_transaction(uuid, text) to authenticated;
