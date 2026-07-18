# Simurg OS Cloud Client Change Map

Status: Phase 2A inspection only  
Runtime files changed in this phase: none

## 1. Runtime load and duplication findings

The active entry page is `index.html`. It loads external runtime files for signals, Polar Workout, source policy, premium UI, Polar AccessLink and desktop alignment, but it does not load `script.js`, `all_scripts.js`, `script_4.js` or `script_10.js`.

Cloud code exists in several copies:

| File | Runtime status | Cloud content |
|---|---|---|
| `index.html` | Active | Base config/functions, Data Center UI, and later effective Push/Pull overrides |
| `script_4.js` | Not loaded by current `index.html` or service worker | Legacy base Cloud Sync copy |
| `script_10.js` | Not loaded by current `index.html` or service worker | Legacy later Push/Pull override copy |
| `script.js` | Not loaded | Aggregate/legacy copies of UI, base functions and overrides |
| `all_scripts.js` | Not loaded | Aggregate/legacy copies of base functions and overrides |

Phase 2B must change the active `index.html` path first. Legacy copies should be marked/archive-cleaned in a separate task or updated consistently only if repository policy requires compilable historical mirrors. They must not be mistaken for loaded runtime code.

## 2. Exact active functions and required changes

| File / function | Current behavior | Required new behavior | Security risk | Recommended change |
|---|---|---|---|---|
| `index.html` `SIMURG_SUPABASE_URL`, `SIMURG_SUPABASE_KEY`, `SIMURG_SYNC_ID` | Static URL, publishable key and fixed `main` row ID | Keep URL/publishable key; remove fixed shared row dependency | Shared anonymous singleton; key is acceptable only as publishable | Rename key semantically to publishable key if desired; initialize one Supabase client; never add service-role credentials |
| `index.html` `simurgCloudHeaders(extra)` | Uses publishable key as both `apikey` and Bearer authorization | Requests must carry the current authenticated access token | Anonymous role may reach shared payload | Prefer Supabase client query methods; otherwise obtain the current session token immediately before each request and never log it |
| `index.html` `setCloudStatus(message,type)` | Updates a single text status | Also represent initializing, signed-out, signed-in, conflict and error states | Current UI cannot distinguish auth/ownership/conflict | Keep the safe text sink; add structured state-to-message mapping without embedding tokens/payloads |
| `index.html` base `pushToCloud()` around the primary Cloud block | Upserts full `DATA` into `simurg_data/main` | Replace/remove after one canonical authenticated implementation exists | Last writer wins; fixed shared row | Do not leave competing globals; route the button to one authenticated controller |
| `index.html` effective `window.pushToCloud` in the later polish block | Saves local metadata, then upserts full payload to `main`; this override is the effective runtime function | Require session; distinguish first INSERT from conditional PATCH; update only `user_id=session.user.id AND revision=expected`; treat zero rows as conflict | Anonymous shared overwrite and no concurrency control | Implement canonical `pushUserData`; persist only user-scoped revision metadata after exactly one returned row; keep confirmation explicit |
| `index.html` base `pullFromCloud()` | Reads `main`, confirms, replaces DATA/localStorage | Replace/remove after canonical authenticated Pull exists | Cross-user/shared read and destructive replacement | Keep only one authenticated Pull implementation |
| `index.html` effective `window.pullFromCloud` in the later polish block | Reads full shared payload; after confirmation initializes missing fields, replaces local DATA, saves and renders | Read only current user's row; return payload/revision/time; preview and confirm; preserve/export local backup; set base revision only after success | Shared disclosure, unvalidated wholesale replacement, no base tracking | Implement canonical `pullUserData`; reuse current persistence/invalidation carefully; no automatic pull after sign-in |
| `index.html` `checkCloudStatus()` | Reads only `updated_at` from `simurg_data/main`; unlike Push/Pull, it is not overridden later | Require session and read only current user's `revision,updated_at` | Anonymous shared-row metadata exposure; can imply false safety | Rename to `checkUserCloudStatus`; display metadata only; do not authorize overwrite or establish a Push base for an existing row |
| `index.html` `cloudSummaryHtml(prefix,cloudUpdated)` | Displays local counts and cloud time | Include authenticated/row/revision state without sensitive identifiers | Current status omits ownership and conflict state | Accept a sanitized view model; never include JWT, raw UUID or payload contents |
| `index.html` `renderDataLocalStatus()` | Displays local data counts and last local/Polar update | Remain local-only; optionally show separate auth/cloud status | Mixing local and cloud state can confuse migration | Preserve local counts; keep cloud auth/revision in the Cloud card |
| `index.html` `markLocalUpdate()` / `ensureMeta()` | Writes build and local-update metadata into DATA | Remain local data behavior; must not store auth tokens/user identity | Auth metadata could leak through backup/cloud payload | Keep auth/session and revision metadata outside DATA |
| `index.html` `save()` and `window.simurgPersistData()` | Save DATA to `atlas_summary_reports` and render | Remain unchanged for local persistence | Coupling auth transitions to save could mutate local data | Auth sign-in/out must not call save unless a user explicitly Pulled/imported data |
| `index.html` startup `let DATA = JSON.parse(localStorage.getItem(...) || INITIAL)` | Existing localStorage wins over INITIAL | Preserve exactly | An auth initialization rewrite could accidentally replace local state | Initialize Auth independently after DATA startup; never auto-Pull on restored session |
| `index.html` Data Center `.cloudSyncCard` and inline button handlers | Three always-enabled buttons call global Push/Pull/Check | Add email/password form, sign-in/sign-out state and disabled actions while signed out/initializing | Signed-out users can currently invoke anonymous requests | Replace inline global coupling with one controller/event binding in Phase 2B; keep explicit confirmations |
| `index.html` `exportJSON()` / `importJSON(event)` | Explicit local backup/restore; import replaces DATA then saves | Preserve as manual migration tools; later add schema validation separately | Import remains an injection/schema risk, but is required for safe manual migration | Do not merge Auth migration with broad import refactor; require backup before cloud migration |

## 3. New client components recommended for Phase 2B

Use one small module/controller rather than adding another override block:

| Component | Responsibility |
|---|---|
| `getSupabaseClient()` | Return one initialized official client using URL and publishable key |
| `restoreAuthSession()` | Resolve initial session before enabling cloud controls; no Push/Pull |
| `signInWithPassword(email,password)` | Explicit email/password sign-in |
| `signOutCloud()` | Sign out and clear in-memory/user-scoped cloud metadata without touching DATA/localStorage |
| `renderCloudAuthState(state)` | Render initializing/signed-out/signed-in/conflict states and button disabled state |
| `getCloudSyncMeta(userId)` | Read revision metadata scoped to the authenticated user; never payload/token |
| `setCloudSyncMeta(userId,meta)` | Store revision after successful Pull/Push only |
| `checkUserCloudStatus()` | Fetch current user's revision/time without mutating DATA or creating a Push base |
| `pullUserData()` | Explicit confirmed Pull, local backup option, persist through existing app path |
| `pushUserData()` | Explicit first INSERT or conditional revision PATCH; block conflicts |

The implementation should expose only the minimal globals required by existing inline handlers, then remove the old duplicate active definitions in the same reviewed change. Do not create a third wrapper around `window.pushToCloud`/`window.pullFromCloud`.

## 4. PostgREST/Supabase operation map

| Operation | Required authenticated behavior |
|---|---|
| Check | SELECT `revision,updated_at` from caller's row; zero rows = no cloud data |
| Pull | SELECT `payload,revision,updated_at`; preview and explicit confirmation before local replacement |
| First Push | INSERT `{user_id: session.user.id, payload}`; conflict = block and Pull/check |
| Existing Push | UPDATE where `user_id=session.user.id` and `revision=expected`; send revision `expected+1`; require one returned row |
| Sign out | End Auth session, disable actions, clear cloud-only runtime state; preserve local DATA |

RLS is the security boundary. Client filters improve correctness and conflict detection but must never be treated as authorization.

## 5. Files expected to change in the next implementation phase

- `index.html`: active Auth UI, singleton client initialization, canonical Push/Pull/Check logic, removal of active duplicate cloud definitions.
- A new focused runtime module may be preferable if loaded explicitly before Data Center handlers; if created, update `index.html` and `sw.js` asset versions together.
- `sw.js`: only if a new runtime asset or changed cache identity is required.
- Tests: add Auth state, signed-out controls, per-user request, revision conflict and localStorage-preservation contracts.
- Legacy non-runtime copies (`script_4.js`, `script_10.js`, `script.js`, `all_scripts.js`): decide separately whether to keep as archives, update as mirrors, or remove after proving they are unused.

Do not modify `polar-accesslink.js` or Polar Edge Functions for general Cloud Auth. Polar's device-capability flow is a separate server integration and should remain intact.

