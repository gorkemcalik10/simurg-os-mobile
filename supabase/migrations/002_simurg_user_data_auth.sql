-- Simurg OS Cloud Security Phase 2A
-- Review-only migration proposal. Do not run against a live project until the
-- dashboard checks and test plan in docs/security have been completed.
--
-- This migration intentionally does not read, alter, migrate, truncate, or
-- delete public.simurg_data or its legacy row id = 'main'.

create table if not exists public.simurg_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint simurg_user_data_revision_positive check (revision >= 1)
);

comment on table public.simurg_user_data is
  'Authenticated per-user Simurg OS payload with optimistic revision control.';

create or replace function public.enforce_simurg_user_data_revision()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.revision = 1;
    new.updated_at = now();
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;

  if new.revision <> old.revision + 1 then
    raise exception 'revision must advance by exactly one';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists simurg_user_data_revision_guard
  on public.simurg_user_data;

create trigger simurg_user_data_revision_guard
before insert or update on public.simurg_user_data
for each row
execute function public.enforce_simurg_user_data_revision();

alter table public.simurg_user_data enable row level security;
alter table public.simurg_user_data force row level security;

revoke all on table public.simurg_user_data from public, anon;
revoke all on table public.simurg_user_data from authenticated;
grant select, insert, update, delete on table public.simurg_user_data to authenticated;

drop policy if exists simurg_user_data_select_own
  on public.simurg_user_data;
create policy simurg_user_data_select_own
  on public.simurg_user_data
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_insert_own
  on public.simurg_user_data;
create policy simurg_user_data_insert_own
  on public.simurg_user_data
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_update_own
  on public.simurg_user_data;
create policy simurg_user_data_update_own
  on public.simurg_user_data
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_delete_own
  on public.simurg_user_data;
create policy simurg_user_data_delete_own
  on public.simurg_user_data
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Optimistic update contract for the future client:
--   PATCH /rest/v1/simurg_user_data
--     ?user_id=eq.<session-user-id>
--     &revision=eq.<expected-revision>
--     &select=payload,revision,updated_at
--   body: { "payload": {...}, "revision": <expected-revision + 1> }
-- A successful update returns exactly one row. Zero rows means a revision
-- conflict or missing row and must never be treated as a successful push.
-- The trigger rejects revision skips, repeats, or reductions.

-- Manual verification queries (comments only; substitute test identities and
-- execute later in an isolated test project/session, never during review):
--
-- 1. Confirm RLS and FORCE RLS:
-- select relrowsecurity, relforcerowsecurity
-- from pg_class
-- where oid = 'public.simurg_user_data'::regclass;
--
-- 2. Review policies and authenticated-only role targets:
-- select policyname, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'simurg_user_data';
--
-- 3. Review grants; anon must have no table privilege:
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'simurg_user_data';
--
-- 4. With an authenticated JWT for user A, verify only user A's row is
-- visible/writable. Repeat with user B and confirm user A's row is invisible.
-- With the anon role and no user JWT, SELECT/INSERT/UPDATE/DELETE must fail or
-- return no rows according to the operation.
--
-- 5. Confirm the legacy table was not changed by this migration:
-- select to_regclass('public.simurg_data');
