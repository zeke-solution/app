-- Restore the live delivery paths used by chat and notification popups, add
-- database-level chat validation, and complete the two missing brand alerts.

-- Supabase Realtime only sends Postgres Changes for tables in its publication.
-- The hosted project had an empty publication even though the clients were
-- subscribed to deal_messages and notifications.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'deal_messages'
    ) then
      alter publication supabase_realtime add table public.deal_messages;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end;
$$;

-- Match actions/chat.ts at the trust boundary so a scripted authenticated
-- client cannot bypass trimming and length checks.
alter table public.deal_messages
  drop constraint if exists deal_messages_content_guard;
alter table public.deal_messages
  add constraint deal_messages_content_guard
  check (char_length(content) <= 4000 and btrim(content) <> '') not valid;
alter table public.deal_messages
  validate constraint deal_messages_content_guard;

-- Creator submits the final live link and the brand receives an atomic alert.
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
  values (p_deal_id, actor, 'event', 'Final link submitted by ' || v_name);

  if v_deal.brand_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (
      v_deal.brand_id,
      'Final link submitted',
      left(v_name || ' submitted the final link for ' || v_deal.title || '. Review it before sending payment.', 1000),
      'deal',
      p_deal_id
    );
  end if;

  return null;
end;
$$;

-- Creator confirms payment, completes the deal, and the brand receives an
-- atomic completion alert.
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
  values (p_deal_id, actor, 'event', 'Payment confirmed by ' || v_name || '. Deal complete.');

  if v_deal.brand_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (
      v_deal.brand_id,
      'Payment confirmed',
      left(v_name || ' confirmed receipt for ' || v_deal.title || '. The deal is complete.', 1000),
      'payment',
      p_deal_id
    );
  end if;

  return null;
end;
$$;

revoke all on function public.submit_final_link_transaction(uuid, text) from public;
revoke all on function public.confirm_payment_transaction(uuid, uuid) from public;
grant execute on function public.submit_final_link_transaction(uuid, text) to authenticated;
grant execute on function public.confirm_payment_transaction(uuid, uuid) to authenticated;
