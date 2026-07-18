-- Simurg OS Cloud Security Phase 2A
-- Review-only migration proposal. Do not run against a live project until the
-- dashboard checks and test plan in docs/security have been completed.
--
-- This migration intentionally does not read, alter, migrate, truncate, or
-- delete public.simurg_data or its legacy row id = 'main'.

begin;

do $migration_guard$
begin
  if to_regclass('public.simurg_user_data') is not null then
    raise exception
      'public.simurg_user_data already exists; inspect the existing table manually before running this migration';
  end if;
end;
$migration_guard$;

create table public.simurg_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint simurg_user_data_payload_object
    check (jsonb_typeof(payload) = 'object'),
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
  as permissive
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_insert_own
  on public.simurg_user_data;
create policy simurg_user_data_insert_own
  on public.simurg_user_data
  as permissive
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_update_own
  on public.simurg_user_data;
create policy simurg_user_data_update_own
  on public.simurg_user_data
  as permissive
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_delete_own
  on public.simurg_user_data;
create policy simurg_user_data_delete_own
  on public.simurg_user_data
  as permissive
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists simurg_user_data_permanent_users_only
  on public.simurg_user_data;
create policy simurg_user_data_permanent_users_only
  on public.simurg_user_data
  as restrictive
  for all
  to authenticated
  using (
    coalesce(
      (select (auth.jwt()->>'is_anonymous')::boolean),
      true
    ) is false
  )
  with check (
    coalesce(
      (select (auth.jwt()->>'is_anonymous')::boolean),
      true
    ) is false
  );

-- Optimistic update contract for the future client:
--   PATCH /rest/v1/simurg_user_data
--     ?user_id=eq.<session-user-id>
--     &revision=eq.<expected-revision>
--     &select=payload,revision,updated_at
--   body: { "payload": {...}, "revision": <expected-revision + 1> }
-- A successful update returns exactly one row. Zero rows means a revision
-- conflict or missing row and must never be treated as a successful push.
-- The trigger rejects revision skips, repeats, or reductions.

commit;

-- Manual verification queries (comments only; substitute test identities and
-- execute later in an isolated test project/session, never during review):
--
-- 1. Confirm the transaction completed. If any executable statement failed,
-- PostgreSQL must roll back the table, function, trigger, grants and policies:
-- select to_regclass('public.simurg_user_data') as committed_table;
--
-- 2. Review table columns, types, defaults, primary/foreign keys and CHECK
-- constraints (including JSON-object payload and positive revision):
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'simurg_user_data'
-- order by ordinal_position;
-- select conname, contype, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.simurg_user_data'::regclass
-- order by conname;
--
-- 3. Confirm RLS and FORCE RLS:
-- select relrowsecurity, relforcerowsecurity
-- from pg_class
-- where oid = 'public.simurg_user_data'::regclass;
--
-- 4. Review policy command and permissive/restrictive classification. Expect
-- four PERMISSIVE own-row policies and one RESTRICTIVE permanent-user policy:
-- select policyname, permissive, roles, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'simurg_user_data';
--
-- 5. Review grants; PUBLIC and anon must have no table privilege:
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public' and table_name = 'simurg_user_data';
--
-- 6. With a permanent email/password authenticated JWT whose is_anonymous
-- claim is false, INSERT/SELECT/UPDATE/DELETE of that user's own row must work.
--
-- 7. With a Supabase Anonymous Sign-In JWT whose is_anonymous claim is true,
-- every command must be denied by simurg_user_data_permanent_users_only.
-- Repeat with the claim missing or malformed; access must fail, never allow.
--
-- 8. With the unauthenticated anon database role and no user JWT,
-- SELECT/INSERT/UPDATE/DELETE must fail or return no rows as appropriate.
--
-- 9. With permanent users A and B, verify A cannot SELECT, INSERT for, UPDATE,
-- or DELETE B's row even when B's UUID is supplied explicitly.
--
-- 10. In a rollback-only test transaction, try to update revision from N to
-- N+2. Expect 'revision must advance by exactly one', then ROLLBACK.
--
-- 11. In a rollback-only test transaction, try INSERT/UPDATE with payload
-- roots [], 'text'::jsonb, '1'::jsonb and 'null'::jsonb. Each must fail the
-- simurg_user_data_payload_object constraint; an object payload must succeed.
--
-- 12. Confirm the legacy table and its separately recorded metadata remain
-- unchanged; do not read or print its payload during verification:
-- select to_regclass('public.simurg_data');
