-- Supabase can apply explicit default EXECUTE grants to API roles when a
-- function is created. Remove anon directly in addition to the PUBLIC revoke
-- from 0014; only signed-in users should reach this mutation RPC.

revoke all on function public.set_profile_avatar(text, text) from anon;
grant execute on function public.set_profile_avatar(text, text) to authenticated;
