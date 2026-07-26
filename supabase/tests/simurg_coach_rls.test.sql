begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'coach-user-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'coach-user-b@example.test')
on conflict (id) do nothing;

insert into public.simurg_user_data (user_id, payload)
values
  ('11111111-1111-4111-8111-111111111111', '{"owner":"A"}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', '{"owner":"B"}'::jsonb)
on conflict (user_id) do update
set payload = excluded.payload,
    revision = public.simurg_user_data.revision + 1;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","is_anonymous":false}',
  true
);

select results_eq(
  $$select count(*) from public.simurg_user_data$$,
  array[1::bigint],
  'User A sees exactly one own row'
);

select results_eq(
  $$select count(*) from public.simurg_user_data where user_id = '22222222-2222-4222-8222-222222222222'::uuid$$,
  array[0::bigint],
  'User A cannot read User B row by explicit user_id'
);

select is_empty(
  $$update public.simurg_user_data
      set payload = '{"owner":"A changed B"}'::jsonb,
          revision = revision + 1
    where user_id = '22222222-2222-4222-8222-222222222222'::uuid
    returning user_id$$,
  'User A cannot update User B row'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","is_anonymous":false}',
  true
);

select results_eq(
  $$select payload->>'owner' from public.simurg_user_data where user_id = '22222222-2222-4222-8222-222222222222'::uuid$$,
  array['B'::text],
  'User B data remains unchanged after User A update attempt'
);

select results_eq(
  $$select count(*) from public.simurg_user_data where user_id = '11111111-1111-4111-8111-111111111111'::uuid$$,
  array[0::bigint],
  'User B cannot read User A row'
);

reset role;
select * from finish();
rollback;
