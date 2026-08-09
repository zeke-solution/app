# Migration tests

Runs migrations 0001-0003 plus the active-dispute close guard in 0010 against a
throwaway local Postgres and drives the six core transitions as simulated authenticated users. No Docker, no Supabase CLI,
and it never touches a real project.

Last run 2026-07-17 against Postgres 17.5: 44/44 assertions pass, plus the
concurrency test.

## Why a shim

`00_supabase_shim.sql` recreates the parts Supabase provides that stock Postgres
does not: the `anon`/`authenticated`/`service_role` roles, `auth.users`,
`auth.uid()`, and a minimal `storage` schema. `auth.uid()` reads the JWT claims
out of a GUC exactly as the real one does, which is what makes `security definer`
functions still see the calling user. Tests impersonate a user with:

```sql
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<user-uuid>"}';
  -- ... call the RPC ...
commit;
```

That is the same mechanism PostgREST uses per request, so RLS policies and the
0002 state-machine triggers behave as they will in production.

## Running

Get a Postgres 17 binary (no admin needed, no service installed):

```powershell
# https://get.enterprisedb.com/postgresql/postgresql-17.5-1-windows-x64-binaries.zip
tar -xf postgresql-17.5-1-windows-x64-binaries.zip -C C:\pgtmp
C:\pgtmp\pgsql\bin\initdb.exe -D C:\pgtmp\data -U postgres -A trust -E UTF8 --locale=C
C:\pgtmp\pgsql\bin\pg_ctl.exe -D C:\pgtmp\data -o "-p 55432" -l C:\pgtmp\log.txt start
```

Extract to a short path. The scratchpad path overflows Windows MAX_PATH and
`Expand-Archive` fails halfway; `tar` handles it. Then:

```powershell
$PSQL = "C:\pgtmp\pgsql\bin\psql.exe"
$c = @("-h","127.0.0.1","-p","55432","-U","postgres","-v","ON_ERROR_STOP=1","-q","-d","zeke")
& $PSQL -h 127.0.0.1 -p 55432 -U postgres -d postgres -c "create database zeke;"
& $PSQL @c -f supabase\tests\00_supabase_shim.sql
& $PSQL @c -f ..\supabase\schema.sql          # legacy repo root schema
& $PSQL @c -c "grant all on all tables in schema public to anon, authenticated, service_role;"
& $PSQL @c -f supabase\migrations\0001_notifications_related_deal.sql
& $PSQL @c -f supabase\migrations\0002_security_hardening.sql
& $PSQL @c -f supabase\migrations\0003_atomic_transitions.sql
& $PSQL @c -f supabase\migrations\0010_active_dispute_close_guard.sql
& $PSQL @c -f supabase\tests\01_transitions_test.sql
```

Assertions print as `PASS`/`FAIL` notices. Do not pipe psql through `2>$null` in
PowerShell 5.1; it corrupts `$?` and turns a passing run into a phantom failure.

`02_payment_race_test.cjs` needs `npm i pg` and a running server. It opens two
connections and has both brands mark payment sent on one deal simultaneously,
proving the `for update` lock serialises them: the second blocks, then returns a
clean `wrong_status` rather than hitting the `payments_one_per_deal` unique index.

## Caveat worth knowing

These run against `../../supabase/schema.sql`, which is hand-maintained. Nobody
has introspected the live project, so if production has drifted from that file,
a green run here does not guarantee a green run there. Diff the real schema
against `schema.sql` before trusting this as proof for production.

## Not covered

Storage object policies and the real auth/signup flow. The shim stubs
`storage.objects`, so the bucket policies in 0002 are only checked for syntax,
not behaviour. Those need the full Supabase stack or live QA.
