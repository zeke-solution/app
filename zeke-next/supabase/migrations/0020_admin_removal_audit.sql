-- Permanent audit trail for administrator-initiated destructive actions.
-- Operational rows may be removed on explicit request, but the actor, target,
-- timestamp, and deletion summary remain available for accountability.

create table if not exists public.admin_removal_audit (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id) on delete set null,
  entity_type  text not null check (entity_type in (
    'user', 'campaign', 'deal', 'dispute',
    'shield_request', 'shield_case', 'legal_provider'
  )),
  entity_id    uuid not null,
  entity_label text not null,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

comment on table public.admin_removal_audit is
  'Append-only record of permanent removals initiated from the Zeke admin dashboard.';

create index if not exists admin_removal_audit_created_idx
  on public.admin_removal_audit (created_at desc);

alter table public.admin_removal_audit enable row level security;

drop policy if exists admin_removal_audit_select on public.admin_removal_audit;
create policy admin_removal_audit_select
on public.admin_removal_audit for select to authenticated
using (public.is_admin());

revoke all on table public.admin_removal_audit from anon;
revoke insert, update, delete on table public.admin_removal_audit from authenticated;
grant select on table public.admin_removal_audit to authenticated;
grant all on table public.admin_removal_audit to service_role;
