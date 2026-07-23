# SIMURG OS Data and Integrations Map

Audit date: 2026-07-23  
Scope: current active runtime, server source, migrations, persistence, imports,
Polar, Cloud Auth, and PWA behavior

No personal data values are included in this map.

## 1. Local-first persistence

Primary payload key:

```text
atlas_summary_reports
```

Startup:

```text
DATA = parsed localStorage payload if the key exists
       otherwise a deep copy of INITIAL
```

This confirms that saved local data takes priority over `INITIAL`.

Active `save()`:

1. Ensures/updates `DATA._meta.lastLocalUpdate`.
2. Serializes the complete `DATA` root into `atlas_summary_reports`.
3. Invalidates shared signal caches for real mutations.
4. Calls broad render/refresh paths.
5. Updates local-status UI.

`window.simurgPersistData()` resolves to the same persistence path when integrations
need to merge records.

## 2. Current `INITIAL` / `DATA` shape

### Stable top-level collections

| Area | Shape | Written by | Read by / visible in | Cloud |
|---|---|---|---|---|
| `workouts` | Array of workout/set rows | Gym, edit/import paths | Gym, Logger, Home, reports, coaching/signals | Included in full payload |
| `metrics` | Array of dated body metrics | Base forms/import | reports/data views | Included |
| `nutrition` | Array of dated nutrition entries | Base forms/import | summaries/signals where used | Included |
| `recovery` | Array of fallback recovery records | forms/import/legacy | Home Recovery, readiness fallback | Included |
| `appleWatch` | Array of legacy Apple Health/Watch activities | import paths | source-policy fallback, legacy views | Included |
| `dailyNotes` | Array | daily note UI/import | Daily/Coaching | Included |
| `weeklyNotes` | Array | weekly note UI/import | Weekly/Coaching | Included |
| `customGymPrograms` | Object keyed by day/program | Gym program editor | Gym/Home plan | Included |
| `programNames` | Object mapping day to label | Gym/program editing | Gym/Home/Logger | Included |

### Polar stores

| Area | Shape | Written by | Read by / visible in | Status |
|---|---|---|---|---|
| `polarWorkouts` | `{daily:{date: record[]|record}, latest}` | AccessLink sync, manual Polar import | Polar Workout, Home, Logger/source policy, reports | Active |
| `polarActivity` | `{daily, latest, ...sync metadata}` | AccessLink sync | Home/activity/signals | Active |
| `polarProfile` | `{latest, ...}` | AccessLink sync | profile-dependent calculations/status | Active |
| `polarSleep` | `{daily, latest, lastSyncAt, lastError}` | AccessLink sync | Home Sleep/Recovery, signals | Active |
| `polarNightlyRecharge` | same pattern | AccessLink sync | Home Recovery/readiness | Active |
| `polarContinuousHr` | same pattern | AccessLink sync | health summaries where available | Active |
| `polarCardioLoad` | same pattern | AccessLink sync | Home Load, Polar Workout Load, coaching | Active |
| `polarConnection` | connection/status/count metadata | connect/sync/disconnect | AccessLink cards | Active |
| `polarBridge` | `{source,lastSync,daily}` | legacy bridge lifecycle/import | hidden bridge helpers/fallback | Legacy but active data path |

### Lazily created stores and metadata

| Key/store | Purpose | Persistence/status |
|---|---|---|
| `activityNotes` | Notes keyed by date/type | In main payload |
| `autoNextTargets` | Gym next-target values | In main payload |
| `recoveryEntries` | Additional recovery input | In main payload |
| `_meta` | Local update and schema-adjacent metadata | In main payload |
| `simurg_polar_accesslink_client_v1` | Browser device-capability ID/key | Separate localStorage key |
| `simurg_cloud_meta:<user-id>` | Last known cloud revision/update for one auth user | Separate localStorage key |
| import undo/snapshot key | One-step import restoration | Separate localStorage key |
| install/import-date hints | UI capability metadata | Separate localStorage keys |

Cloud metadata intentionally does not contain the cloud payload, password, email, or
service-role secret.

## 3. Workout and program record behavior

Typical workout fields include:

- date/day
- exercise
- body part
- sets
- reps
- weight
- notes
- optional RPE, form, pain, start time, and duration

Current limitations:

- No stable row/session/exercise ID is enforced.
- Historic rows may represent one set per row, while other imports can use a
  `sets` multiplier.
- Base calculations and the signal model do not always count those forms identically.
- Dedupe therefore depends on date/name/time heuristics and source-specific logic.

Programs are stored as built-in definitions plus user overrides in
`customGymPrograms` and labels in `programNames`.

## 4. Calculated summaries and coaching

Daily, weekly, monthly, readiness, risk, deload, PR, and target data are primarily
derived rather than stored as independent report tables.

`SimurgSignalModel`:

- normalizes duration and physical sessions
- merges valid session sources
- dedupes Polar against Apple Health for compatible time/duration/type
- preserves same-source sessions
- excludes partial sessions from aggregate totals while retaining detail
- caches day/week/month models until explicit invalidation
- calculates PR, risk, and safe target inputs

`SimurgWorkoutSource`:

- selects the best Polar session for a date
- fuses Polar and Gym context
- falls back to Gym, then valid Apple Health
- provides canonical visible source labels

`SimurgReadiness` is defined by the premium layer and resolves selected-day inputs
once for the current model.

## 5. Import and export paths

### JSON backup/export

Serializes the complete `DATA` payload, including all Polar stores and cloud-neutral
local records. Cloud authentication/session credentials are not part of `DATA`.

### General JSON restore

Parses and assigns the complete root to `DATA`, then saves. This path does not
perform comprehensive schema/version validation or migration and is a critical
data-integrity risk.

### Universal Import

The base importer is wrapped by multiple active compatibility layers:

- expanded alias handling
- undo snapshot
- imported-date selection
- Polar recovery helper
- Polar Workout outer wrapper

It can append or normalize supported inputs, but validation/dedupe behavior differs
by source. Wrapper order is part of current behavior.

### CSV

Current export is workout-focused and does not represent the complete application
payload.

## 6. Polar AccessLink end-to-end

### 6.1 Browser authorization model

Polar AccessLink uses a device-capability pair stored in:

```text
simurg_polar_accesslink_client_v1
```

This capability is separate from Supabase Auth. The browser sends the public
Supabase publishable key plus the client ID/key to Polar Edge Functions. No
service-role key or Polar client secret is present in browser code.

### 6.2 OAuth/connect flow

1. User explicitly selects Connect in the AccessLink card.
2. Browser creates/reuses the device capability.
3. `polar-connect` validates the capability and creates a short-lived, one-time
   OAuth state.
4. User is redirected to Polar authorization.
5. `polar-callback` atomically consumes a valid unused state.
6. Server exchanges the code using server-side Polar credentials.
7. Polar user registration is completed.
8. Access/refresh tokens are encrypted with AES-GCM and stored server-side.
9. Browser returns to the app; query status is handled and removed.

### 6.3 Server tables from the inspected migration

- `polar_connections`
- `polar_oauth_states`
- `polar_sync_log`
- `polar_raw_data`

The migration enables RLS and revokes browser roles; server functions use the
service role on the server only.

### 6.4 Sync flow

1. User explicitly presses sync.
2. `polar-sync` authenticates the device capability.
3. It decrypts the stored access token.
4. It requests Polar exercises, activity, physical profile, sleep, nightly recharge,
   continuous HR, and cardio load for the configured windows.
5. It normalizes each category and records per-category status/counts.
6. Raw upstream payloads are archived server-side.
7. The normalized response is returned to the browser.
8. `polar-accesslink.js` ensures every `DATA.polar*` store exists.
9. It merges by date and updates latest/sync/error metadata.
10. Workouts dedupe primarily by date + start time and update an existing match.
11. `simurgPersistData()` saves through the application's normal local persistence.

Synced workouts use the Polar Flow source model and are visible in Polar Workout,
Home, Logger, and desktop reports through the source policy.

### 6.5 Multi-workout and history

`polarWorkouts.daily[date]` supports an array. Polar Workout holds a selected date
and workout index, allowing multiple workouts per day. Date navigation changes the
selected day without changing the underlying store.

### 6.6 Partial and missing data

- Missing values display as unavailable/dash.
- Partial heart-zone data is retained.
- Unclassified time can be displayed.
- Zone totals are not forced to 100.
- Empty category objects remain safe structures.
- AccessLink status shows counts and category availability.

### 6.7 Disconnect

Disconnect updates connection state and server registration but does not delete
already synchronized local workouts.

### 6.8 Polar risks

| Risk | Severity | Basis |
|---|---|---|
| Capability can be stolen by same-origin script | High | Possession secret is in localStorage |
| Capability not bound to Supabase user | High | Device auth and cloud auth are separate |
| No observed access-token refresh path | High | Refresh token is stored but sync marks 401 error |
| Raw health-data retention undefined | Medium | Server raw archive exists; no policy found |
| Legacy bridge still creates data | Medium | Hidden UI does not make lifecycle dead |
| Real deployment/CORS/secrets unverified | Manual | Repository cannot prove live configuration |

## 7. Authenticated Cloud end-to-end

### 7.1 Active client

`simurg-cloud-auth.js` is the only loaded cloud controller. Active runtime does not
reference the old shared `public.simurg_data` table or fixed `id="main"`.

Old references remain in unloaded script copies and stale documentation. They are
not current runtime behavior.

### 7.2 Client initialization

The Supabase v2 client uses:

- project URL
- browser-safe publishable/anon key
- `persistSession: true`
- automatic token refresh
- no session-in-URL parsing for this flow

No service-role secret is present in browser source.

### 7.3 Sign in and session restore

- Email/password sign in only.
- Existing session is restored on startup.
- Auth-state changes refresh controls.
- Restore does not automatically Push, Pull, create a row, or replace `DATA`.
- No social login or current sign-up UI.

### 7.4 Sign out

- Signs out of Supabase.
- Clears only the current user's `simurg_cloud_meta:<user-id>`.
- Leaves application `DATA` and its localStorage payload intact.
- Disables cloud actions that require authentication.

### 7.5 Check Cloud

Selects only:

- `revision`
- `updated_at`

for the authenticated user's row. It does not download the payload and does not
establish/create a new server row.

### 7.6 Push

First push:

- requires explicit user confirmation
- inserts only `{user_id, payload}` for the authenticated user
- lets the database establish revision 1

Subsequent push:

- requires locally stored expected revision
- updates only the authenticated user row matching that revision
- sends revision + 1
- treats zero updated rows as a conflict
- never silently overwrites a newer revision

### 7.7 Pull

1. Requires authentication and explicit confirmation.
2. Fetches the user's payload/revision/update time.
3. Downloads a full local JSON backup before replacement.
4. Checks that the cloud root is a plain object and restores limited defaults.
5. Replaces `DATA` and persists locally.
6. Stores the returned revision metadata for that user.

The backup is an important recovery control; root validation remains insufficient
for full schema safety.

### 7.8 Target database model

`public.simurg_user_data`:

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `payload jsonb` constrained to an object
- `revision bigint`, first value 1
- `updated_at timestamptz`, set server-side
- RLS and FORCE RLS
- browser table access revoked from PUBLIC/anon
- only required operations granted to authenticated
- permissive own-row SELECT/INSERT/UPDATE/DELETE using `auth.uid() = user_id`
- restrictive permanent-user policy denying `is_anonymous=true` and missing claim
- trigger prevents user ID changes and requires revision to advance exactly one

The migration is transactional and intentionally fails if the table already exists.
It does not modify `public.simurg_data` or the old `main` row.

Whether this exact migration is live remains a manual verification item.

## 8. Service worker and PWA

Manifest:

- standalone display
- portrait-primary orientation
- application scope/start URL under the repository path
- 192 px and 512 px icons

Service worker:

- cache: `simurg-cloud-auth-phase-2b-1`
- precaches current same-origin assets
- navigation: network-first, cached index fallback
- localhost source: network-first
- production static source: cache-first
- Supabase network requests: bypassed
- non-GET: untouched
- activate: deletes all other origin-visible caches

The pinned external Supabase CDN asset is not precached. Local features can remain
available offline, but cloud auth cannot initialize offline unless the browser
already supplies the dependency separately.

## 9. Security and data-integrity boundaries

### Critical

- No universal text-escaping boundary before active `innerHTML`.
- Whole-payload JSON restore and shallowly validated Cloud Pull.

### High

- Full payload is one cloud conflict/data-loss unit.
- Polar capability and Supabase session coexist in origin localStorage and are
  exposed if origin script execution is compromised.
- Polar access-token refresh is not evident.
- Workout identities/set semantics are inconsistent.

### Medium

- Legacy bridge can add persisted shape automatically.
- Raw/normalized health data retention exists in multiple layers.
- Service worker deletes all other caches in its origin visibility.
- External auth dependency is not offline-cached or integrity-pinned.
- Stale documentation and unloaded duplicate code can mislead future changes.

## 10. Live/manual verification still required

- RLS/policy state in the live Supabase project
- two-user isolation and anonymous-auth denial
- revision conflict and backup recovery
- live Polar OAuth/CORS/function-secret configuration
- expired Polar access token
- server raw-data retention/deletion
- offline cold start
- installed iOS PWA behavior
- malformed/old backup migrations
