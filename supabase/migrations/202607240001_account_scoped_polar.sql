begin;

alter table public.polar_connections
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.polar_oauth_states
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists polar_connections_user_id_unique
  on public.polar_connections (user_id)
  where user_id is not null;

create index if not exists polar_oauth_states_user_id_idx
  on public.polar_oauth_states (user_id, expires_at desc);

comment on column public.polar_connections.user_id is
  'Authenticated Simurg account owner. NULL is reserved for legacy device-capability rows awaiting one-time claim.';

comment on column public.polar_oauth_states.user_id is
  'Authenticated Simurg account that initiated the one-time Polar OAuth state.';

alter table public.polar_connections force row level security;
alter table public.polar_oauth_states force row level security;
alter table public.polar_sync_log force row level security;
alter table public.polar_raw_data force row level security;

revoke all on public.polar_connections from public, anon, authenticated;
revoke all on public.polar_oauth_states from public, anon, authenticated;
revoke all on public.polar_sync_log from public, anon, authenticated;
revoke all on public.polar_raw_data from public, anon, authenticated;

grant all on public.polar_connections to service_role;
grant all on public.polar_oauth_states to service_role;
grant all on public.polar_sync_log to service_role;
grant all on public.polar_raw_data to service_role;

commit;

-- Legacy migration contract:
-- Existing rows intentionally remain user_id IS NULL. The authenticated Edge
-- runtime may claim one only when the request also proves the row's existing
-- client_id + client_key_hash capability. The capability is never copied to a
-- second device or stored in Simurg DATA.
