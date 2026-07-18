# Simurg OS Cloud Auth Migration Plan

Status: Phase 2A design and review only

Date: 2026-07-19

Live Supabase changes performed: none

## 1. Current architecture and risk

The active browser client in `index.html` uses a static Supabase project URL and a browser publishable key. The complete key must remain in runtime configuration but is intentionally redacted in documentation as `sb_publishable_[REDACTED]`.

Cloud Sync currently targets `public.simurg_data` through PostgREST with the fixed identifier `SIMURG_SYNC_ID = "main"`. The browser has no Supabase Auth session. Both the `apikey` and `Authorization` headers use the publishable key, so access is governed only by the live table grants/RLS configuration, which has not been verified in this phase.

The effective Push path serializes the complete in-memory `DATA` object into `payload.data` and upserts the shared row. Pull reads the same row and, after confirmation, replaces `DATA` and `localStorage['atlas_summary_reports']`. There is no user ownership, base revision, compare-and-swap check, snapshot, or conflict detection.

This creates four linked risks:

1. every client addresses the same cloud row;
2. an anonymous role may be able to read or overwrite it, depending on unverified live policies;
3. a stale device can silently overwrite a newer full payload;
4. Pull replaces local state wholesale after a single confirmation.

## 2. Target architecture

Create a separate table without altering the legacy table:

```text
public.simurg_user_data
├── user_id uuid PRIMARY KEY → auth.users(id) ON DELETE CASCADE
├── payload jsonb NOT NULL DEFAULT '{}'
├── revision bigint NOT NULL DEFAULT 1
└── updated_at timestamptz NOT NULL DEFAULT now()
```

Each authenticated user has at most one current payload row. The browser derives `user_id` only from the verified Supabase session; it must never trust a user ID inside imported JSON or `DATA`.

The browser continues to contain only the Supabase project URL and publishable/anon key. It must never contain a service-role key, database password, OAuth client secret, or any server secret.

The proposed SQL is in `supabase/migrations/002_simurg_user_data_auth.sql`. It creates only the new table, its revision trigger, grants and RLS policies. It does not touch `public.simurg_data` or row `main`.

## 3. Minimal authentication flow

Use a pinned version of the official `@supabase/supabase-js` browser client in the next implementation phase. Configure one singleton with:

- the existing project URL;
- the existing browser publishable key;
- `persistSession: true`;
- `autoRefreshToken: true`;
- `detectSessionInUrl: false` because Phase 2 uses email/password only.

Required UI states:

1. **Initializing:** session restoration is pending; Cloud actions are disabled.
2. **Signed out:** email/password sign-in form is visible; Push, Pull and Check User Cloud are disabled.
3. **Signed in:** show the authenticated email in a compact status area; enable explicit cloud actions.
4. **Signing out/error:** actions are disabled until the state transition finishes.

Required actions:

- email/password sign in;
- optional explicit account creation if enabled in the project;
- persistent session restoration on reload;
- sign out through `supabase.auth.signOut()`;
- `onAuthStateChange` updates UI and clears in-memory user/revision state when signed out.

Sign in must not automatically create a row, Push, Pull, import, replace, or clear data. Sign out clears the Supabase session and cloud-only in-memory metadata, but must not clear `atlas_summary_reports` or mutate `DATA`.

Tokens must be managed by the Supabase client, never printed, copied into `DATA`, included in JSON backup, or written to application logs. Because a persistent browser session is reachable by same-origin JavaScript, the existing stored-injection risks documented in Phase 0 remain a prerequisite security concern.

## 4. RLS and grants model

`public.simurg_user_data` has RLS and FORCE RLS enabled. `anon` receives no table privilege. `authenticated` receives only SELECT, INSERT, UPDATE and DELETE, each constrained by a dedicated policy:

| Operation | Policy condition |
|---|---|
| SELECT | `auth.uid() = user_id` |
| INSERT | `auth.uid() = user_id` via `WITH CHECK` |
| UPDATE | existing and resulting row both require `auth.uid() = user_id` |
| DELETE | `auth.uid() = user_id` |

The client still includes a `user_id` field when inserting a new row because it is the primary key, but the value must come from `session.user.id`, and RLS independently rejects a different value.

No policy is created for `anon`. No broad `USING (true)` policy is permitted. No service-role credential is used by the browser.

## 5. Revision and conflict model

The browser keeps cloud sync metadata separate from `DATA`:

```text
userId
lastKnownRevision
lastKnownUpdatedAt
baseEstablishedBy: pull | successful-push
```

If persisted between sessions, it must use a user-scoped key such as `simurg_cloud_sync_meta:<user-id>` and contain no payload or token. A new/different authenticated user must never inherit another user's revision metadata.

### Pull

1. Require an authenticated session.
2. Read only the caller's `payload`, `revision` and `updated_at`.
3. If no row exists, display an empty-cloud state without changing local data.
4. Preview the revision/time and require explicit confirmation.
5. Before replacement, offer/export a local JSON backup in the later implementation flow.
6. Replace local `DATA` only after confirmation, use the existing persistence/render path, and record the returned revision as the local base.

### First Push

If the authenticated user has no row, an explicit Push may INSERT `{user_id, payload}` at revision 1. A primary-key conflict means another device created the row; block and require Pull/check rather than converting it into an overwrite.

### Existing-row Push

The client may Push only when it has a base revision established by a successful Pull or previous successful Push. It performs one conditional update:

```text
user_id = current session user
revision = lastKnownRevision
new revision = lastKnownRevision + 1
```

The database trigger requires revision to advance by exactly one. The response must return exactly one row. A successful HTTP response with zero returned rows is a conflict, not success.

On mismatch:

- do not change the cloud row;
- do not change local `DATA`;
- display a conflict warning;
- retain the local export option;
- offer Pull Latest later;
- offer Force Overwrite only in a separate, explicitly confirmed future flow.

No silent merge or overwrite is allowed. “Check Cloud” may display current metadata, but it must not establish a safe Push base by itself for an existing row.

## 6. Manual migration from legacy `main`

No automatic migration is permitted.

1. In the current application, the user downloads a JSON backup of the desired local data.
2. The user creates or signs into their Supabase Auth account.
3. The user imports the verified JSON backup locally through the existing explicit import flow.
4. The client verifies that the authenticated user has no existing `simurg_user_data` row.
5. The user explicitly chooses Push and confirms creation of their own revision-1 row.
6. The user performs an explicit Pull/check on a separate test profile or trusted device and verifies counts/content.
7. The legacy `public.simurg_data/main` row remains untouched throughout migration.
8. Only after independent verification and a separate authorization may administrators retire legacy access or remove the legacy row manually.

The application must never read `main` automatically after Auth rollout and must never copy it into a user row based only on login identity.

## 7. Rollout and rollback plan

### Rollout

1. Review this SQL and the client change map.
2. Create two non-production Auth users in a test Supabase project.
3. Apply the migration only to that test project.
4. Run the complete RLS checklist as anon, user A and user B.
5. Implement the client behind a local development flag without enabling legacy anonymous cloud calls.
6. Run local/manual tests with synthetic payloads.
7. Review the final runtime diff and only then schedule a separately approved production migration/deployment.

### Rollback

If Auth or RLS validation fails, disable the new client Cloud actions and keep the application local-only. Do not fall back automatically to anonymous `simurg_data/main`. Preserve both tables and user rows for investigation. A later SQL rollback should revoke authenticated access or correct policies; it should not drop `simurg_user_data`, delete user payloads, or modify `main` without a separate backup and approval.

## 8. Risks and prerequisites

- Live `simurg_data` grants/RLS and existing payload remain unverified.
- Stored HTML injection paths documented in Phase 0 could expose a persistent Auth session; schema validation/output encoding should be addressed before production Auth rollout.
- Email confirmation, password policy, CAPTCHA/rate limits and recovery settings require dashboard review.
- Whole-object payloads remain large and last-known-base correctness depends on strict client metadata handling.
- A single-row-per-user model provides isolation and optimistic concurrency but not snapshots or record-level merge history.
- Multi-device offline edits can legitimately conflict; the UI must preserve both local backup and cloud Pull choices.
- Account deletion cascades to the user's new row. Product UX and backup confirmation must make that consequence explicit before any deletion feature is added.

## 9. Exact future Supabase dashboard steps

These are instructions for a later authorized change; none were performed in Phase 2A.

1. Open the intended Supabase project and confirm it is not production before initial testing.
2. In **Authentication → Providers → Email**, enable email/password only; do not enable social providers.
3. Decide whether email confirmation is required and configure the approved Site URL/redirect allowlist for the deployed Simurg origin and explicit local development origins.
4. Review **Authentication → Rate Limits**, password requirements, email templates and CAPTCHA options.
5. Create two isolated test users (A and B) with no personal payload.
6. Open **SQL Editor**, paste the reviewed `002_simurg_user_data_auth.sql`, inspect it again, and execute it only after approval.
7. In **Database → Tables**, confirm `simurg_user_data` has the four expected columns, UUID primary/foreign key, revision check and update trigger.
8. In **Database → Policies**, confirm RLS and FORCE RLS are enabled and exactly four authenticated owner policies exist.
9. In **Database → Roles/Privileges**, confirm `anon` has no privilege and `authenticated` has only SELECT/INSERT/UPDATE/DELETE subject to RLS.
10. Use user A, user B and anon test sessions to execute the checklist in `SIMURG_CLOUD_AUTH_TEST_CHECKLIST.md`.
11. Confirm `public.simurg_data`, its `main` row, and all existing cloud data are unchanged.
12. Review logs for policy errors without logging JWTs or payload contents.
13. Do not deploy the client until the RLS isolation and revision-conflict tests pass.

## 10. Completion criteria for Phase 2B

- signed-out cloud actions are disabled;
- authenticated session persists and signs out cleanly;
- user A cannot observe or mutate user B;
- Push/Pull remain explicit;
- initial insert and conditional revision update are distinguished;
- conflicts never overwrite cloud or local data;
- localStorage data survives auth state changes;
- legacy `simurg_data/main` is not read, migrated, modified or deleted automatically.
