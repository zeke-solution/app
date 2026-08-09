-- A deal with an open or escalated dispute must not be completed or cancelled.
-- The dispute resolution RPC updates the dispute first and then restores the
-- deal's pre-dispute status, so legitimate admin resolution remains allowed.

create or replace function public.prevent_active_dispute_deal_close()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('completed', 'cancelled')
     and new.status is distinct from old.status
     and exists (
       select 1
       from public.disputes dispute
       where dispute.deal_id = old.id
         and dispute.status in ('open', 'escalated')
     ) then
    raise exception 'resolve the active dispute before closing this deal'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_active_dispute_deal_close_trigger on public.deals;
create trigger prevent_active_dispute_deal_close_trigger
before update of status on public.deals
for each row execute function public.prevent_active_dispute_deal_close();

revoke all on function public.prevent_active_dispute_deal_close() from public;
