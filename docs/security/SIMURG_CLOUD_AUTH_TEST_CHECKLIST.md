# Simurg OS Cloud Auth Test Checklist

Status: Phase 2A plan only

Use only synthetic data and a non-production Supabase project until a production change is separately authorized.

## Test prerequisites

- [ ] SQL migration has been reviewed but is applied only to an authorized test project.
- [ ] Two test users exist: user A and user B.
- [ ] Browser DevTools logging does not expose access tokens, refresh tokens, passwords or payload contents.
- [ ] A synthetic local JSON backup exists before testing.
- [ ] The legacy `public.simurg_data/main` row has been recorded by metadata/count only so accidental mutation can be detected without exposing its payload.

## 1. Signed-out user

- [ ] Start with no Supabase Auth session while preserving `atlas_summary_reports`.
- [ ] Data Center shows a signed-out state.
- [ ] Push, Pull and Check User Cloud are disabled.
- [ ] Direct anon SELECT on `simurg_user_data` returns no user rows or is rejected.
- [ ] Direct anon INSERT, UPDATE and DELETE are rejected.
- [ ] No cloud request is sent merely by opening Data Center.
- [ ] Local Gym, Logger, Polar, Coaching, reports and JSON export still work.

## 2. Sign in and session persistence

- [ ] Sign in as user A with email/password.
- [ ] No cloud row is created and no Push/Pull occurs automatically.
- [ ] Reload the page and confirm the session restores before cloud actions enable.
- [ ] The UI shows user A without exposing the JWT or internal user ID unnecessarily.
- [ ] `atlas_summary_reports` remains byte-for-byte unchanged by sign-in/reload.

## 3. First Push for an empty account

- [ ] Confirm user A has no `simurg_user_data` row.
- [ ] Click Push explicitly and review the confirmation.
- [ ] Cancel once; verify no row is created.
- [ ] Confirm Push; verify exactly one user A row is inserted at revision 1.
- [ ] Verify the response stores revision 1 and `updated_at` as the local sync base.
- [ ] Repeat the creation request from another client; verify the primary-key conflict is shown and no overwrite occurs.

## 4. Pull

- [ ] Change local data using a clearly synthetic record and export a local backup.
- [ ] Click Pull; inspect cloud revision/time before confirming.
- [ ] Cancel once; local `DATA` and localStorage must remain unchanged.
- [ ] Confirm Pull; only then may cloud payload replace local data.
- [ ] Verify the returned revision is stored as the expected Push base.
- [ ] Verify existing render/cache invalidation paths run once and navigation remains stable.

## 5. Normal revision update

- [ ] Establish a base through successful Pull or Push.
- [ ] Make a synthetic local change.
- [ ] Push with `revision = expected` and body revision `expected + 1`.
- [ ] Verify exactly one row returns and revision advances by one.
- [ ] Verify `updated_at` changes server-side.
- [ ] Attempt a repeated/skipped/reduced revision; verify the trigger rejects it.

## 6. Revision conflict

- [ ] Open devices/browser profiles A1 and A2 for user A at the same revision.
- [ ] Push a synthetic change from A1 successfully.
- [ ] Push the stale A2 change with its old expected revision.
- [ ] Verify zero rows/update conflict is treated as failure, not success.
- [ ] Verify A1 cloud data remains unchanged.
- [ ] Verify A2 local data remains unchanged and can still be exported.
- [ ] Verify UI offers Pull Latest and Export Local Backup.
- [ ] Verify Force Overwrite is absent or requires a separate explicit future confirmation flow.

## 7. Different second user

- [ ] Sign in as user B in a separate clean profile.
- [ ] User B cannot SELECT user A's row, even when user A's UUID is supplied in the URL.
- [ ] User B cannot UPDATE or DELETE user A's row.
- [ ] User B cannot INSERT a row whose `user_id` is user A.
- [ ] User B can create and manage only user B's own row.
- [ ] Switching accounts never reuses another user's revision/base metadata.

## 8. Logout

- [ ] Sign out as user A.
- [ ] Supabase session and in-memory authenticated user/revision state clear.
- [ ] Push, Pull and Check User Cloud disable immediately.
- [ ] Reload and confirm the user remains signed out.
- [ ] `DATA` and `atlas_summary_reports` remain intact.
- [ ] No user email, revision or cloud metadata is displayed while signed out.

## 9. LocalStorage preservation

- [ ] Record a hash/count summary of local `atlas_summary_reports` before each auth-only action.
- [ ] Sign in, restore session and sign out without Push/Pull.
- [ ] Confirm the local data hash/count remains unchanged.
- [ ] Confirm no auth token or user ID is inserted into `DATA` or JSON export.
- [ ] Confirm user-scoped revision metadata contains no payload or token.

## 10. Legacy row preservation

- [ ] Confirm no runtime request targets `public.simurg_data` after the new client path is enabled.
- [ ] Confirm no request contains `SIMURG_SYNC_ID = "main"`.
- [ ] Confirm the legacy table and `main` row metadata are unchanged after all tests.
- [ ] Confirm no automatic migration, deletion or retirement is attempted.
- [ ] Confirm manual migration follows backup → sign in → local import → explicit first Push → verification.

## 11. RLS and credential checks

- [ ] Every policy uses `auth.uid() = user_id` and targets `authenticated`.
- [ ] RLS and FORCE RLS are enabled.
- [ ] `anon` has no table privilege.
- [ ] Browser source contains only the redacted-in-docs publishable key type; no service-role secret is introduced.
- [ ] Network requests use the authenticated user's access token and never log it.
- [ ] Payload responses never include another user's row.

## Exit criteria

- [ ] All signed-out, user A, user B, conflict, persistence and legacy-preservation tests pass.
- [ ] No real user data was used in testing.
- [ ] No production SQL, deployment, cloud write or legacy-row mutation occurred without separate approval.
