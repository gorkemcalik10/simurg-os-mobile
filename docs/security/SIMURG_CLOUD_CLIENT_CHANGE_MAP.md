# Simurg OS Cloud Client Change Map

Status: Phase 2B canonical client implemented; manual browser verification pending

Active runtime files changed in this phase: `index.html`, `simurg-cloud-auth.js`, `sw.js`

## 1. Runtime load and duplication findings

The active entry page is `index.html`. It loads external runtime files for signals, Polar Workout, source policy, premium UI, Polar AccessLink and desktop alignment, but it does not load `script.js`, `all_scripts.js`, `script_4.js` or `script_10.js`.

Cloud code exists in several copies:

| File | Runtime status | Cloud content |
|---|---|---|
| `index.html` | Active | Browser-safe config and authenticated Data Center UI; legacy Cloud request functions removed |
| `simurg-cloud-auth.js` | Active and cached | Single canonical Auth, Check, Push and Pull controller |
| `script_4.js` | Not loaded by current `index.html` or service worker | Legacy base Cloud Sync copy |
| `script_10.js` | Not loaded by current `index.html` or service worker | Legacy later Push/Pull override copy |
| `script.js` | Not loaded | Aggregate/legacy copies of UI, base functions and overrides |
| `all_scripts.js` | Not loaded | Aggregate/legacy copies of base functions and overrides |

The remaining legacy copies are not referenced by current `index.html` or `sw.js`. They remain public source artifacts but cannot issue runtime requests in the active application. Archive cleanup remains a separate task.

## 2. Active canonical implementation

| File / function | Implemented behavior | Security boundary | Verification status |
|---|---|---|---|
| `index.html` Supabase constants | Keeps project URL and browser publishable key; fixed `SIMURG_SYNC_ID` removed | Publishable key plus authenticated RLS session | Static scan passed |
| `simurg-cloud-auth.js` `getClient()` | Creates one Supabase JS v2 singleton with persistent session and token refresh | Official client manages authenticated Bearer session | Static/syntax tests passed |
| `initialize()` | Restores session and registers Auth listener without Check/Push/Pull | Auth session only; local DATA remains independent | Automatic-operation test passed |
| `signInToCloud()` | Email/password sign-in; clears password field; no DATA mutation | Supabase Auth | Local-data contract test passed |
| `signOutFromCloud()` | Signs out and clears only user-scoped cloud metadata | Supabase Auth and scoped local metadata | Local-data contract test passed |
| `checkUserCloudStatus()` | Selects only `revision,updated_at` for session user; stores no base | RLS plus `user_id` filter | Query/base tests passed |
| `pushUserData()` | Explicit first INSERT or conditional expected-revision UPDATE | RLS, PK, revision trigger and client compare-and-swap | Insert/conflict tests passed |
| `pullUserData()` | Validates object payload, confirms, downloads local backup, replaces through existing save/render flow, stores base | RLS plus explicit destructive confirmation | Ordering/metadata tests passed |
| `setStatus()` / `renderAuthState()` | Uses textContent, masked email and disabled busy/signed-out controls | DOM output safety | Static tests passed |
| `index.html` DATA startup/save/import | Existing localStorage-first and local persistence behavior retained | Local browser data | Regression suite passed |

## 3. Canonical controller functions

The active implementation is the single focused `simurg-cloud-auth.js` module; no late Cloud override block remains in `index.html`:

| Component | Responsibility |
|---|---|
| `getClient()` | Return one initialized official client using URL and publishable key |
| `initialize()` | Resolve initial session and subscribe to Auth changes; no Cloud data operation |
| `signInToCloud()` | Explicit email/password sign-in |
| `signOutFromCloud()` | Sign out and clear user-scoped cloud metadata without touching DATA/localStorage |
| `renderAuthState()` | Render initializing/signed-out/signed-in/busy controls |
| `readMeta()` / `writeMeta()` | Manage only revision/time metadata under `simurg_cloud_meta:<user-id>` |
| `checkUserCloudStatus()` | Fetch current user's revision/time without mutating DATA or creating a Push base |
| `pullUserData()` | Explicit confirmed Pull, local backup option, persist through existing app path |
| `pushUserData()` | Explicit first INSERT or conditional revision PATCH; block conflicts |

Only the five UI actions and the controller inspection handle are exposed. The former `pushToCloud`, `pullFromCloud`, `checkCloudStatus`, `simurgCloudHeaders` and `SIMURG_SYNC_ID` active definitions were removed.

## 4. PostgREST/Supabase operation map

| Operation | Required authenticated behavior |
|---|---|
| Check | SELECT `revision,updated_at` from caller's row; zero rows = no cloud data |
| Pull | SELECT `payload,revision,updated_at`; preview and explicit confirmation before local replacement |
| First Push | INSERT `{user_id: session.user.id, payload}`; conflict = block and Pull/check |
| Existing Push | UPDATE where `user_id=session.user.id` and `revision=expected`; send revision `expected+1`; require one returned row |
| Sign out | End Auth session, disable actions, clear cloud-only runtime state; preserve local DATA |

RLS is the security boundary. Client filters improve correctness and conflict detection but must never be treated as authorization.

## 5. Phase 2B file/result map

- `index.html`: authenticated Cloud card, disabled initial controls, old active request code removed, official Supabase v2 and canonical module loaded.
- `simurg-cloud-auth.js`: canonical controller.
- `sw.js`: cache identity advanced and canonical module added to `CORE_ASSETS`; fetch behavior unchanged.
- `tests/cloud-auth.test.js` and existing test registry/contracts: Auth, revision, backup and legacy-endpoint coverage.
- Legacy non-runtime copies (`script_4.js`, `script_10.js`, `script.js`, `all_scripts.js`): unchanged and still not loaded.

Do not modify `polar-accesslink.js` or Polar Edge Functions for general Cloud Auth. Polar's device-capability flow is a separate server integration and should remain intact.
