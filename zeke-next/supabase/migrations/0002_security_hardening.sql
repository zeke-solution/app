-- Security hardening for the Next.js application.
-- Apply after 0001_notifications_related_deal.sql.

-- ---------------------------------------------------------------------------
-- Trusted role helpers (avoid recursive policies on public.profiles).
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.current_app_role() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_app_role() to authenticated;

-- ---------------------------------------------------------------------------
-- Never trust signup metadata to create an administrator.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  v_role text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_role := case when meta->>'role' = 'brand' then 'brand' else 'influencer' end;

  insert into public.profiles (id, role, display_name, location)
  values (
    new.id,
    v_role,
    coalesce(nullif(trim(meta->>'display_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(meta->>'location'), '')
  );

  if v_role = 'influencer' then
    insert into public.influencer_profiles (
      id, niche, handle, ig_followers,
      yt_followers, x_followers, yt_handle, x_handle,
      yt_enabled, x_enabled, is_adult
    ) values (
      new.id,
      meta->>'niche',
      meta->>'handle',
      greatest(coalesce((meta->>'ig_followers')::int, 0), 0),
      greatest(nullif(meta->>'yt_followers','')::int, 0),
      greatest(nullif(meta->>'x_followers','')::int, 0),
      nullif(meta->>'yt_handle',''),
      nullif(meta->>'x_handle',''),
      coalesce((meta->>'yt_enabled')::boolean, false),
      coalesce((meta->>'x_enabled')::boolean, false),
      coalesce((meta->>'is_adult')::boolean, true)
    );

    if coalesce((meta->>'is_adult')::boolean, true) = false
       and nullif(meta->>'guardian_name', '') is not null then
      insert into public.guardians (influencer_id, guardian_name, guardian_email, relation)
      values (
        new.id,
        meta->>'guardian_name',
        meta->>'guardian_email',
        meta->>'guardian_relation'
      );
    end if;
  else
    insert into public.brand_profiles (id, brand_type)
    values (
      new.id,
      case when meta->>'brand_type' in ('business','ngo','agency')
        then meta->>'brand_type' else 'business' end
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Protect privileged columns even when a client calls PostgREST directly.
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and new.role is distinct from old.role then
    raise exception 'role cannot be changed by the account owner' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.protect_influencer_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() and (
    new.shield_active is distinct from old.shield_active or
    new.shield_expires is distinct from old.shield_expires or
    new.verified is distinct from old.verified or
    new.rating is distinct from old.rating
  ) then
    raise exception 'privileged creator fields are admin-managed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_influencer_privileges_trigger on public.influencer_profiles;
create trigger protect_influencer_privileges_trigger
before update on public.influencer_profiles
for each row execute function public.protect_influencer_privileges();

-- Persist the status that existed before a dispute so resolution can restore it.
alter table public.disputes
  add column if not exists previous_deal_status text;

alter table public.disputes
  drop constraint if exists disputes_previous_deal_status_check;
alter table public.disputes
  add constraint disputes_previous_deal_status_check check (
    previous_deal_status is null or previous_deal_status in (
      'negotiating','agreement_sent','active','submitted','approved',
      'link_submitted','payment_sent'
    )
  );

-- Enforce the deal state machine for direct database calls as well as actions.
create or replace function public.enforce_deal_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_is_brand boolean;
  actor_is_creator boolean;
begin
  if actor is null or public.is_admin() then
    return new;
  end if;

  actor_is_brand := old.brand_id = actor;
  actor_is_creator := old.influencer_id = actor;
  if not actor_is_brand and not actor_is_creator then
    raise exception 'not a party to this deal' using errcode = '42501';
  end if;

  if new.id is distinct from old.id
     or new.brand_id is distinct from old.brand_id
     or new.influencer_id is distinct from old.influencer_id
     or new.campaign_id is distinct from old.campaign_id
     or new.created_at is distinct from old.created_at then
    raise exception 'deal identity fields are immutable' using errcode = '42501';
  end if;

  if row(new.title,new.platform,new.amount,new.currency,new.deliverables,new.usage_rights,
         new.exclusivity,new.payment_terms,new.deadline)
     is distinct from
     row(old.title,old.platform,old.amount,old.currency,old.deliverables,old.usage_rights,
         old.exclusivity,old.payment_terms,old.deadline) then
    if not actor_is_brand or old.status <> 'negotiating' or new.status <> 'negotiating' then
      raise exception 'offer terms can only be edited by the brand while negotiating'
        using errcode = '42501';
    end if;
  end if;

  if new.cancel_requested_by is distinct from old.cancel_requested_by then
    if new.cancel_requested_by is not null and new.cancel_requested_by <> actor then
      raise exception 'invalid cancellation requester' using errcode = '42501';
    end if;
    if old.status in ('completed','cancelled') then
      raise exception 'closed deals cannot be cancelled' using errcode = '42501';
    end if;
  end if;

  if new.cancel_reason is distinct from old.cancel_reason then
    if not (
      (old.cancel_requested_by is null and new.cancel_requested_by = actor) or
      (old.cancel_requested_by is not null and new.cancel_requested_by is null)
    ) then
      raise exception 'cancellation reason cannot be altered' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    if not (
      (actor_is_creator and old.status = 'negotiating' and new.status in ('active','cancelled')) or
      (actor_is_creator and old.status = 'active' and new.status = 'submitted') or
      (actor_is_brand and old.status = 'submitted' and new.status = 'approved') or
      (actor_is_creator and old.status = 'approved' and new.status = 'link_submitted') or
      (actor_is_brand and old.status = 'link_submitted' and new.status = 'payment_sent') or
      (actor_is_creator and old.status = 'payment_sent' and new.status = 'completed') or
      (old.status not in ('completed','cancelled','disputed') and new.status = 'disputed') or
      (old.cancel_requested_by is not null and old.cancel_requested_by <> actor and new.status = 'cancelled')
    ) then
      raise exception 'invalid deal status transition: % -> %', old.status, new.status
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_deal_update_trigger on public.deals;
create trigger enforce_deal_update_trigger
before update on public.deals
for each row execute function public.enforce_deal_update();

create or replace function public.enforce_submission_review()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.id is distinct from old.id
     or new.deal_id is distinct from old.deal_id
     or new.round is distinct from old.round
     or new.file_url is distinct from old.file_url
     or new.file_name is distinct from old.file_name
     or new.file_size_mb is distinct from old.file_size_mb
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'submission identity and file fields are immutable' using errcode = '42501';
  end if;
  if old.status <> 'pending' or new.status not in ('approved','rejected') then
    raise exception 'invalid submission review transition' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_submission_review_trigger on public.submissions;
create trigger enforce_submission_review_trigger
before update on public.submissions
for each row execute function public.enforce_submission_review();

create or replace function public.enforce_payment_confirmation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  if new.id is distinct from old.id
     or new.deal_id is distinct from old.deal_id
     or new.amount is distinct from old.amount
     or new.currency is distinct from old.currency
     or new.proof_url is distinct from old.proof_url
     or new.sent_by is distinct from old.sent_by
     or new.sent_at is distinct from old.sent_at then
    raise exception 'payment record fields are immutable' using errcode = '42501';
  end if;
  if old.status <> 'pending' or new.status <> 'confirmed' or new.confirmed_by <> auth.uid() then
    raise exception 'invalid payment confirmation' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_payment_confirmation_trigger on public.payments;
create trigger enforce_payment_confirmation_trigger
before update on public.payments
for each row execute function public.enforce_payment_confirmation();

-- ---------------------------------------------------------------------------
-- Replace broad FOR ALL policies with operation-specific policies.
-- ---------------------------------------------------------------------------

-- The hosted project may contain operation-specific policy names from an
-- earlier manual hardening pass even when this migration is not recorded in
-- supabase_migrations. Drop every target name as well as the legacy names
-- below so this migration reconciles that drift instead of failing midway.
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists influencer_select on public.influencer_profiles;
drop policy if exists influencer_update_own on public.influencer_profiles;
drop policy if exists influencer_update_admin on public.influencer_profiles;
drop policy if exists brand_select on public.brand_profiles;
drop policy if exists brand_update_own on public.brand_profiles;
drop policy if exists guardian_select on public.guardians;
drop policy if exists campaign_select on public.campaigns;
drop policy if exists campaign_insert_brand on public.campaigns;
drop policy if exists campaign_update_brand on public.campaigns;
drop policy if exists deal_select on public.deals;
drop policy if exists deal_insert_brand on public.deals;
drop policy if exists deal_update_parties on public.deals;
drop policy if exists message_select on public.deal_messages;
drop policy if exists message_insert on public.deal_messages;
drop policy if exists submission_select on public.submissions;
drop policy if exists submission_insert_creator on public.submissions;
drop policy if exists submission_update_brand on public.submissions;
drop policy if exists final_link_select on public.final_links;
drop policy if exists final_link_insert_creator on public.final_links;
drop policy if exists payment_select on public.payments;
drop policy if exists payment_insert_brand on public.payments;
drop policy if exists payment_update_creator on public.payments;
drop policy if exists agreement_select on public.agreements;
drop policy if exists agreement_insert_creator on public.agreements;
drop policy if exists dispute_select on public.disputes;
drop policy if exists dispute_insert_party on public.disputes;
drop policy if exists dispute_update_admin on public.disputes;
drop policy if exists notification_select_own on public.notifications;
drop policy if exists notification_update_own on public.notifications;
drop policy if exists shield_select on public.shield_requests;
drop policy if exists shield_insert_creator on public.shield_requests;
drop policy if exists shield_update_admin on public.shield_requests;

drop policy if exists profiles_own on public.profiles;
drop policy if exists profiles_admin_read on public.profiles;
-- Cross-user profile visibility is deliberately scoped to the opposite role:
-- a brand may read influencer profiles, a creator may read brand profiles,
-- admins read all, and everyone reads their own. This mirrors the
-- influencer_profiles/brand_profiles select policies and covers every
-- display_name/location join used by deal, chat, discovery, and agreement
-- screens. profiles holds no sensitive data (id, role, display_name,
-- location, created_at) -- email lives in auth.users -- so row-level access
-- is safe; two roles still cannot read peers of their own role.
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or public.is_admin()
    or (role = 'influencer' and public.current_app_role() = 'brand')
    or (role = 'brand' and public.current_app_role() = 'influencer')
  );
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists inf_own on public.influencer_profiles;
drop policy if exists inf_brand_read on public.influencer_profiles;
create policy influencer_select on public.influencer_profiles for select
  using (id = auth.uid() or public.current_app_role() in ('brand','admin'));
create policy influencer_update_own on public.influencer_profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy influencer_update_admin on public.influencer_profiles for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists brand_own on public.brand_profiles;
drop policy if exists brand_inf_read on public.brand_profiles;
create policy brand_select on public.brand_profiles for select
  using (id = auth.uid() or public.current_app_role() in ('influencer','admin'));
create policy brand_update_own on public.brand_profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists guardian_own on public.guardians;
create policy guardian_select on public.guardians for select
  using (influencer_id = auth.uid() or public.is_admin());

drop policy if exists campaign_brand_own on public.campaigns;
drop policy if exists campaign_read on public.campaigns;
create policy campaign_select on public.campaigns for select
  using (brand_id = auth.uid() or public.current_app_role() in ('influencer','admin'));
create policy campaign_insert_brand on public.campaigns for insert
  with check (brand_id = auth.uid() and public.current_app_role() = 'brand');
create policy campaign_update_brand on public.campaigns for update
  using (brand_id = auth.uid() and public.current_app_role() = 'brand')
  with check (brand_id = auth.uid() and public.current_app_role() = 'brand');

drop policy if exists deal_parties on public.deals;
create policy deal_select on public.deals for select
  using (brand_id = auth.uid() or influencer_id = auth.uid() or public.is_admin());
create policy deal_insert_brand on public.deals for insert
  with check (
    brand_id = auth.uid()
    and public.current_app_role() = 'brand'
    and exists (
      select 1 from public.profiles p
      where p.id = influencer_id and p.role = 'influencer'
    )
  );
create policy deal_update_parties on public.deals for update
  using (brand_id = auth.uid() or influencer_id = auth.uid() or public.is_admin())
  with check (brand_id = auth.uid() or influencer_id = auth.uid() or public.is_admin());

drop policy if exists msg_parties on public.deal_messages;
create policy message_select on public.deal_messages for select
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );
create policy message_insert on public.deal_messages for insert
  with check (
    sender_id = auth.uid() and exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );

drop policy if exists sub_parties on public.submissions;
create policy submission_select on public.submissions for select
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );
create policy submission_insert_creator on public.submissions for insert
  with check (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and d.influencer_id = auth.uid()
        and d.status in ('active','submitted')
    )
  );
create policy submission_update_brand on public.submissions for update
  using (
    public.is_admin() or exists (
      select 1 from public.deals d where d.id = deal_id and d.brand_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.deals d where d.id = deal_id and d.brand_id = auth.uid()
    )
  );

drop policy if exists link_parties on public.final_links;
create policy final_link_select on public.final_links for select
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );
create policy final_link_insert_creator on public.final_links for insert
  with check (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and d.influencer_id = auth.uid() and d.status = 'approved'
    )
  );

drop policy if exists pay_parties on public.payments;
create policy payment_select on public.payments for select
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );
create policy payment_insert_brand on public.payments for insert
  with check (
    sent_by = auth.uid() and amount > 0 and exists (
      select 1 from public.deals d
      where d.id = deal_id and d.brand_id = auth.uid() and d.status = 'link_submitted'
    )
  );
create policy payment_update_creator on public.payments for update
  using (
    public.is_admin() or exists (
      select 1 from public.deals d where d.id = deal_id and d.influencer_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.deals d where d.id = deal_id and d.influencer_id = auth.uid()
    )
  );

drop policy if exists agree_parties on public.agreements;
create policy agreement_select on public.agreements for select
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );
create policy agreement_insert_creator on public.agreements for insert
  with check (
    exists (
      select 1 from public.deals d
      where d.id = deal_id and d.influencer_id = auth.uid() and d.status = 'active'
    )
  );

create unique index if not exists agreements_one_per_deal on public.agreements (deal_id);
create unique index if not exists payments_one_per_deal on public.payments (deal_id);
create unique index if not exists final_links_one_per_deal on public.final_links (deal_id);
create unique index if not exists shield_one_pending_per_creator
  on public.shield_requests (influencer_id) where status = 'pending';
create unique index if not exists disputes_one_active_per_deal
  on public.disputes (deal_id) where status in ('open','escalated');
create unique index if not exists submissions_unique_round on public.submissions (deal_id, round);

-- Preserve cancelled offer history while allowing only one current offer per
-- creator and campaign. This legacy negotiation was superseded by an accepted
-- replacement three minutes later; keep its messages, but close the stale row.
update public.deals
set status = 'cancelled', updated_at = now()
where id = '0d65d0d4-3f23-4644-a11b-c35b1e3a9495'
  and campaign_id = '193a5a2b-5f1e-4e89-9ef7-31b83c3fbe4e'
  and influencer_id = 'c97d554a-c41b-45de-9605-5858685dcdb2'
  and status = 'negotiating'
  and exists (
    select 1
    from public.deals replacement
    where replacement.id = 'e4dd0ac6-667d-4690-b770-a75ba6146342'
      and replacement.campaign_id = public.deals.campaign_id
      and replacement.influencer_id = public.deals.influencer_id
      and replacement.status <> 'cancelled'
  );

drop index if exists public.campaign_offer_one_per_creator;
create unique index campaign_offer_one_per_creator
  on public.deals (campaign_id, influencer_id)
  where campaign_id is not null and status <> 'cancelled';

drop policy if exists dispute_parties on public.disputes;
create policy dispute_select on public.disputes for select
  using (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  );
create policy dispute_insert_party on public.disputes for insert
  with check (
    raised_by = auth.uid() and exists (
      select 1 from public.deals d
      where d.id = deal_id and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
        and d.status not in ('completed','cancelled','disputed')
    )
  );
create policy dispute_update_admin on public.disputes for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists notif_own on public.notifications;
create policy notification_select_own on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());
create policy notification_update_own on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists shield_own on public.shield_requests;
create policy shield_select on public.shield_requests for select
  using (influencer_id = auth.uid() or public.is_admin());
create policy shield_insert_creator on public.shield_requests for insert
  with check (
    influencer_id = auth.uid()
    and public.current_app_role() = 'influencer'
    and status = 'pending'
    and amount = 1999
  );
create policy shield_update_admin on public.shield_requests for update
  using (public.is_admin()) with check (public.is_admin());

-- Restrict direct updates to non-privileged columns.
revoke update on public.profiles from authenticated;
grant update (display_name, location) on public.profiles to authenticated;

revoke update on public.influencer_profiles from authenticated;
grant update (
  handle, niche, is_adult, ig_followers, yt_followers, x_followers,
  yt_handle, x_handle, yt_enabled, x_enabled, updated_at
) on public.influencer_profiles to authenticated;

revoke update on public.brand_profiles from authenticated;
grant update (brand_type, updated_at) on public.brand_profiles to authenticated;

revoke update on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

revoke update on public.submissions from authenticated;
grant update (status, review_note, reviewed_at) on public.submissions to authenticated;

revoke update on public.payments from authenticated;
grant update (status, confirmed_by, confirmed_at) on public.payments to authenticated;

revoke update on public.shield_requests from authenticated;
revoke update on public.disputes from authenticated;

-- ---------------------------------------------------------------------------
-- Controlled cross-user and administrator mutations.
-- ---------------------------------------------------------------------------

create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_body text default null,
  p_type text default null,
  p_related_deal_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  notification_id uuid;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() and p_user_id <> actor then
    if p_related_deal_id is null or not exists (
      select 1 from public.deals d
      where d.id = p_related_deal_id
        and actor in (d.brand_id, d.influencer_id)
        and p_user_id in (d.brand_id, d.influencer_id)
    ) then
      raise exception 'notification target is not a deal party' using errcode = '42501';
    end if;
  end if;

  insert into public.notifications (user_id, title, body, type, related_deal_id)
  values (p_user_id, left(p_title, 200), left(p_body, 1000), p_type, p_related_deal_id)
  returning id into notification_id;
  return notification_id;
end;
$$;

create or replace function public.activate_shield_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  creator_id uuid;
  expiry date := (current_date + interval '1 year')::date;
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

create or replace function public.reject_shield_request(p_request_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  creator_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if nullif(trim(p_reason), '') is null then
    raise exception 'reason is required';
  end if;

  update public.shield_requests
  set status = 'rejected', note = left(trim(p_reason), 1000)
  where id = p_request_id and status = 'pending'
  returning influencer_id into creator_id;
  if creator_id is null then return false; end if;

  insert into public.notifications (user_id, title, body, type)
  values (creator_id, 'Shield request not approved', left(trim(p_reason), 1000), 'system');
  return true;
end;
$$;

create or replace function public.resolve_dispute_transaction(
  p_dispute_id uuid,
  p_resolution text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_deal_id uuid;
  restore_status text;
  target_deal public.deals%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if nullif(trim(p_resolution), '') is null then
    raise exception 'resolution is required';
  end if;

  update public.disputes
  set status = 'resolved', resolution = left(trim(p_resolution), 2000), resolved_at = now()
  where id = p_dispute_id and status in ('open','escalated')
  returning deal_id, coalesce(previous_deal_status, 'active')
  into target_deal_id, restore_status;
  if target_deal_id is null then return false; end if;

  update public.deals
  set status = restore_status, updated_at = now()
  where id = target_deal_id
  returning * into target_deal;

  if target_deal.brand_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (target_deal.brand_id, 'Dispute resolved', left(trim(p_resolution), 1000), 'system', target_deal_id);
  end if;
  if target_deal.influencer_id is not null then
    insert into public.notifications (user_id, title, body, type, related_deal_id)
    values (target_deal.influencer_id, 'Dispute resolved', left(trim(p_resolution), 1000), 'system', target_deal_id);
  end if;
  return true;
end;
$$;

create or replace function public.escalate_dispute_transaction(p_dispute_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  update public.disputes
  set status = 'escalated'
  where id = p_dispute_id and status = 'open';
  return found;
end;
$$;

revoke all on function public.create_notification(uuid,text,text,text,uuid) from public;
revoke all on function public.activate_shield_request(uuid) from public;
revoke all on function public.reject_shield_request(uuid,text) from public;
revoke all on function public.resolve_dispute_transaction(uuid,text) from public;
revoke all on function public.escalate_dispute_transaction(uuid) from public;
grant execute on function public.create_notification(uuid,text,text,text,uuid) to authenticated;
grant execute on function public.activate_shield_request(uuid) to authenticated;
grant execute on function public.reject_shield_request(uuid,text) to authenticated;
grant execute on function public.resolve_dispute_transaction(uuid,text) to authenticated;
grant execute on function public.escalate_dispute_transaction(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Private submission storage. Object names are creator/deal/timestamp_file.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  209715200,
  array['video/mp4','video/quicktime','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists submission_object_insert on storage.objects;
drop policy if exists submission_object_select on storage.objects;

create policy submission_object_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1 from public.deals d
    where d.id::text = (storage.foldername(name))[2]
      and d.influencer_id = auth.uid()
      and d.status in ('active','submitted')
  )
);

create policy submission_object_select on storage.objects for select to authenticated
using (
  bucket_id = 'submissions'
  and array_length(storage.foldername(name), 1) >= 2
  and (
    public.is_admin() or exists (
      select 1 from public.deals d
      where d.id::text = (storage.foldername(name))[2]
        and (d.brand_id = auth.uid() or d.influencer_id = auth.uid())
    )
  )
);
