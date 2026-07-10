create extension if not exists pgcrypto;

create table if not exists public.polar_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  client_key_hash text not null,
  polar_user_id bigint not null unique,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  status text not null default 'connected',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint polar_connections_status_check
    check (status in ('connected', 'disconnected', 'error'))
);

create table if not exists public.polar_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  client_id uuid not null,
  client_key_hash text not null,
  return_url text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.polar_sync_log (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references public.polar_connections(id) on delete set null,
  sync_type text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text,
  raw_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.polar_raw_data (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.polar_connections(id) on delete cascade,
  data_type text not null,
  polar_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, data_type, polar_id)
);

create index if not exists polar_oauth_states_expires_idx
  on public.polar_oauth_states (expires_at);
create index if not exists polar_sync_log_connection_idx
  on public.polar_sync_log (connection_id, started_at desc);
create index if not exists polar_raw_data_type_idx
  on public.polar_raw_data (connection_id, data_type, updated_at desc);

create or replace function public.set_polar_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists polar_connections_updated_at on public.polar_connections;
create trigger polar_connections_updated_at
before update on public.polar_connections
for each row execute function public.set_polar_updated_at();

drop trigger if exists polar_raw_data_updated_at on public.polar_raw_data;
create trigger polar_raw_data_updated_at
before update on public.polar_raw_data
for each row execute function public.set_polar_updated_at();

alter table public.polar_connections enable row level security;
alter table public.polar_oauth_states enable row level security;
alter table public.polar_sync_log enable row level security;
alter table public.polar_raw_data enable row level security;

revoke all on public.polar_connections from anon, authenticated;
revoke all on public.polar_oauth_states from anon, authenticated;
revoke all on public.polar_sync_log from anon, authenticated;
revoke all on public.polar_raw_data from anon, authenticated;

grant all on public.polar_connections to service_role;
grant all on public.polar_oauth_states to service_role;
grant all on public.polar_sync_log to service_role;
grant all on public.polar_raw_data to service_role;
