# Simurg OS Privacy and Security Audit — Phase 0

Generated: 2026-07-18 (Europe/Istanbul)  
Repository scope: `gorkemcalik10/simurg-os-mobile`, current working tree and reachable Git history  
Mode: audit only; no runtime code, database, Edge Function, branch or deployment changes

## 1. Executive summary

Simurg OS currently combines a local-first browser data store, a whole-object Supabase backup/sync path, and a substantially better isolated Polar AccessLink server integration. The most urgent confirmed privacy issue is not Polar: the public application source embeds approximately 42 real-looking set-level workout records, and the live entry page loads them as the default dataset. Copies occur in three additional tracked artifacts and many Git revisions.

The second confirmed urgent class is imported-data HTML injection. General restore and Universal Import accept unversioned JSON, and several active render/edit functions interpolate imported fields into `innerHTML` or HTML attributes without consistent escaping. This creates a credible stored injection path in the browser. No exploit payload is reproduced in this report.

Cloud Sync uses a browser publishable Supabase key, which is normal by itself. The material concerns are the fixed shared record ID `main`, absence of Supabase Auth/user ownership in the client, full-payload replacement, and absence of revision/hash conflict checks. The repository does not contain the `simurg_data` table policy definition, so anonymous cloud access cannot be proven secure or insecure from source alone. Live Supabase RLS/grant verification is mandatory. If the publishable role can select/upsert that row, anonymous read/write of the shared health payload is a P0.

The Polar integration should largely be preserved. OAuth exchange and tokens stay server-side; tokens are AES-GCM encrypted; secrets are obtained from Edge Function environment variables; device capabilities are hashed server-side; Polar tables revoke access from browser roles. The browser stores a random device capability in localStorage, so XSS prevention remains important: a stored injection could steal that bearer-equivalent capability even though it cannot directly read server-side Polar tokens.

The DATA model has no enforced schema version, migrations, stable IDs for most record types, or conflict revision. Duplicate global render/normalization functions and wrapper chains make security behavior order-dependent. The future architecture should first remove public personal data and close injection sinks, then add authenticated, user-isolated, revisioned cloud synchronization with snapshots—before considering Realtime.

## 2. Confirmed critical risks

### P0-1 — Real-looking personal workout data is shipped in the public application

**Evidence**

- `index.html` defines `INITIAL` with approximately 42 workout rows covering 2 dates and 14 exercises.
- The fields include date, exercise, body part, weight, repetitions, set count and notes.
- `DATA` is initialized from `localStorage['atlas_summary_reports']` or falls back to `INITIAL`; therefore a new visitor receives the embedded dataset in the live UI.
- The same dataset is tracked in `script.js`, `all_scripts.js` and `script_1.js`. Those three are not loaded by the current page, but they are public repository content.
- The dataset looks like coherent individual training history and is not labelled as synthetic/demo data. Treat it as real personal data unless the owner proves otherwise.
- Redacted example: `Incline DB Press — [weight redacted] × [reps redacted]`.

**Impact**

Anyone with repository or deployed-source access can retrieve the training history. Training load and dated exercise performance are personal wellness/health-adjacent data. The live fallback also exposes it to ordinary visitors rather than only code readers.

**History consequence**

The records occur in many historical revisions (approximately 39 revisions across the four principal files). Deleting the current literals will not remove historical Git objects, forks, clones, release artifacts or caches. History rewriting is intentionally out of scope for this audit and requires a separately approved incident-response plan.

### P0-2 — Stored HTML injection is reachable from import/restore data

**Evidence**

- `importJSON` in `index.html` replaces `DATA` with arbitrary parsed JSON and immediately saves/renders it, without schema validation.
- Universal Import normalizes only a subset of fields and accepts arbitrary strings for exercise, body part, notes, activity names and daily/weekly content.
- Cloud Pull replaces `DATA` with the remote object and then renders it, so a compromised/shared cloud payload reaches the same sinks.
- Active functions interpolate user/import-controlled values into `innerHTML`, including edit modal `value` attributes, exercise/report cards and coaching summaries. Escaping is inconsistent across renderers.

**Impact**

Malicious imported/restored/shared content can become active markup or script-capable attributes in the application origin. Consequences include modification/exfiltration of local health data, the cloud payload, and the local Polar device capability. This audit did not execute or include an exploit.

**Immediate remediation direction**

Introduce a single versioned import validator and reject unknown/invalid shapes before mutation. Render text via `textContent`/DOM APIs; where HTML templates remain, use context-specific text and attribute escaping. Remove user-controlled inline `onclick` construction. Add a restrictive CSP and Trusted Types only after inline-handler dependence is removed or nonces/hashes are designed.

## 3. Possible risks requiring Supabase dashboard verification

### P0-candidate — Anonymous access to the shared `simurg_data/main` payload

The client uses a browser publishable key and no Supabase Auth session. Every device targets the fixed row ID `main`. The repository does not include a migration or policy definition for `public.simurg_data`; therefore the following cannot be established from source:

- whether RLS is enabled on `simurg_data`;
- whether `anon` can `SELECT`, `INSERT` or `UPDATE`;
- whether table grants allow the PostgREST operations;
- whether other rows or columns are exposed;
- whether logs/backups contain prior payload versions.

The publishable key being visible is expected and is **not** itself a vulnerability. The decisive issue is what the live database permits that key/role to do. If the anonymous role can read or upsert `main`, any visitor who obtains the public configuration can retrieve or overwrite the shared personal payload; classify that result as P0.

### Required dashboard checks

1. Inspect `public.simurg_data`: RLS enabled state, grants, policies, indexes and primary/unique keys.
2. Test `anon` and `authenticated` roles separately for select/insert/update/delete, using a safe non-production test project or transaction.
3. Confirm whether any service-role/secret key has ever been deployed to static assets. None was found in the current repository.
4. Review Supabase API/Edge logs and database backups for unauthorized access; repository review cannot prove absence.
5. Confirm Polar Edge Function environment values and deployment match the reviewed source.

## 4. Personal data exposure findings

The structured inventory is in `SIMURG_PERSONAL_DATA_MAP.json`.

| Location | Runtime | Risk | Summary |
|---|---:|---:|---|
| `index.html` | Yes | Critical | ~42 real-looking set rows; default live dataset |
| `script.js` | No | High | Public duplicate of the same dataset |
| `all_scripts.js` | No | High | Public aggregate duplicate |
| `script_1.js` | No | High | Public legacy duplicate |
| Git history for the above | No | Critical | Many revisions retain historical blobs |
| tests/fixtures | No | Low | Values appear synthetic and test-scoped |

No current tracked Polar access/refresh token, Supabase service-role key or Polar OAuth client secret was found. Current `INITIAL.metrics`, `INITIAL.nutrition` and `INITIAL.recovery` are empty. No complete current raw Polar health payload or precise location history was confirmed in tracked current files. This does not cover local browser storage, the live Supabase database, external logs, forks or prior deployments.

## 5. Cloud Sync findings

### Current design

- Static client configuration contains the Supabase project URL, a publishable key and `SIMURG_SYNC_ID = "main"`.
- Requests send the publishable key as `apikey` and Bearer authorization.
- Push performs a PostgREST upsert of `{id: "main", payload: {data: DATA, ...}, updated_at}` with merge-on-conflict semantics.
- Pull fetches `payload,updated_at`, asks for confirmation, then replaces local `DATA` wholesale and writes it to `atlas_summary_reports`.
- Check Cloud only reads `updated_at`.
- Push has a user confirmation and Pull has a user confirmation. This reduces accidental clicks but is not authorization or conflict detection.
- A local “last import” snapshot exists for Universal Import. It is not a cloud revision/snapshot history and does not protect ordinary Push/Pull.

### Confirmed design weaknesses

1. **Shared singleton:** all clients target the same `main` row; the client has no per-user ID.
2. **No authentication:** no Supabase Auth session is used for Cloud Sync.
3. **No user isolation:** requests do not include/derive a `user_id`, and the payload has no authenticated owner boundary.
4. **Last writer wins:** Push sends the entire current object without an expected revision, ETag, hash or compare-and-swap condition. An old device can overwrite newer cloud data if its role is permitted to write.
5. **Destructive Pull:** after confirmation, Pull can replace newer local data with older cloud data. No revision comparison, diff preview or automatic pre-pull snapshot is made.
6. **No merge contract:** the “merge-duplicates” preference applies to the database row conflict; it does not merge nested DATA records.
7. **No integrity signal:** `updated_at` is informational only and is not used to reject stale writes.
8. **Sensitive full payload:** a single permission or injection failure exposes/modifies all stored categories rather than a narrow record.

### Severity

- Missing revisions, snapshots and stable IDs: **P1 data-integrity risk**.
- Shared unauthenticated architecture: **P0 candidate**, conditional on live RLS/grants.
- Publishable key visibility: **informational/expected**, not a secret leak.

## 6. Polar security findings

### Controls confirmed in source

- OAuth authorization code exchange occurs in the `polar-callback` Edge Function, not in the browser.
- Polar access and refresh tokens are stored in `polar_connections`, not in browser DATA.
- Token ciphertext uses AES-GCM with a random 12-byte IV and an environment-provided encryption key.
- Service-role credentials, OAuth client secret and encryption key are read from Edge Function environment variables. No literal values were found in tracked source.
- OAuth state is random, stored as a hash, expiring and single-use.
- The browser generates a random device client ID/key. The server stores and compares a hash of the key.
- Edge Functions require the device capability headers for status, sync and disconnect.
- Polar database tables enable RLS, revoke all privileges from `anon` and `authenticated`, and grant access to `service_role`.
- Raw payload archival uses server-side `polar_raw_data`; `safeRaw` removes token/authorization/client-secret/key-like properties before normalized/client data is returned or embedded.
- Sync logs contain status, timing, error and counts—not access tokens.
- CORS restricts origins to the configured application origin plus development localhost/127.0.0.1 origins.

### Residual concerns

1. The browser device capability is stored in localStorage. It is a bearer-equivalent credential for the associated Polar connection; any same-origin XSS can steal it. This reinforces P0-2 but is not evidence that Polar tokens themselves leak.
2. Normalized records stored in local DATA include health metrics and sanitized `raw` payloads; whole-DATA Cloud Sync therefore carries Polar-derived health data into the less mature `simurg_data` security boundary.
3. `polarProfile.latest` can contain birthday, gender, weight, heart-rate thresholds and VO2 max. Minimize fields retained client-side and in general backups in a later privacy phase.
4. `publicConnection` returns a Polar user identifier and token expiry metadata to the authorized browser. This is not a token, but it is personal metadata and should not be logged unnecessarily.
5. Deployed environment/CORS values and database grants still require dashboard/deployment verification.

### Preserve unchanged unless evidence changes

- server-side OAuth exchange;
- encrypted server-side token storage;
- hashed, expiring OAuth state;
- hashed device capability verification;
- service-role-only Polar tables;
- token-field redaction in `safeRaw`;
- server-side sync logging without tokens;
- connection disconnect clearing server-side tokens.

## 7. Import and XSS findings

| File / function | Data source | Rendering / mutation | Risk | Safe remediation |
|---|---|---|---:|---|
| `index.html` `importJSON` (~7435) | User-selected backup file | `DATA = JSON.parse(...)`, then full save/render; no schema gate | P0 | Parse into an isolated object, validate `schema_version`, types, lengths, dates and allowed keys; preview and confirm; migrate; only then replace/merge. |
| `index.html` `universalImport` chain (~7298, 7822, wrappers through 10435) and `polar-workout.js` (~325) | Pasted JSON | Multiple dispatchers normalize different subsets; arbitrary strings survive | P0/P1 | One canonical parser with per-import discriminated schemas, size/depth limits, canonicalization and structured error output; wrappers should become explicit adapters. |
| `index.html` `openEditExercise` / `openEditSet` (~7393) | Exercise, bodyPart, notes from DATA/import/cloud | Raw values interpolated into `<input value="...">` and `<option>` via `innerHTML` | P0 | Build elements with `document.createElement`; assign `.value` and `.textContent`. Never interpolate into attribute markup. |
| `index.html` likely-active `renderDailyReport` (~7999) | Workout exercise/date/bodyPart and activity data | Template-string `innerHTML`; some activity names use `esc`, but exercise names, best-exercise text, part labels and inline date handler are not consistently escaped | P0 | Use DOM nodes and event listeners; otherwise escape text and attributes separately and validate dates strictly. |
| `index.html` likely-active `renderWeeklyReport` (~8018) plus wrapper chain | Workout bodyPart, program labels, activity fields | Large `innerHTML` template with mixed escaped/raw derived labels | High | Return a typed view model and render via text nodes; audit every derived string, not only direct import fields. |
| `index.html` likely-active `renderCoachPanels` (~7892) | Exercise names, daily notes, activity labels, readiness reasons | `innerHTML`; target/explanation strings include raw or indirectly controlled values | High | Treat all DATA-derived strings as untrusted; text nodes for explanations/labels; allow only fixed CSS tokens. |
| `index.html` `renderPhoenixReport` (~7918) | bodyPart/exercise-derived summaries | `innerHTML` with raw group label | High | Render group labels with `textContent` or context-safe escaping. |
| `index.html` program-name editor and downstream program renderers | User-edited program name | Editor uses `escapeAttr`, but later render paths do not share one safe sink | Medium/High | Keep storage raw, validate length/control characters, and always render as text; do not rely on escaping at edit time. |
| `index.html` Gym renderer | User-edited exercise/body part | Most current Gym template fields use `gymSafe` | Medium residual | Verify `gymSafe` is context-safe for both text and attributes; split helpers by context and replace inline handlers. |
| `polar-workout.js` and `polar-accesslink.js` | Polar normalized/server status data | Central `esc` helper used broadly before HTML templates | Low residual | Preserve escaping; eventually migrate inline handlers to listeners and validate URL/date/ID fields. |

### Cross-cutting defenses

- Define `schema_version` and enforce it at every trust boundary: file import, pasted import, Cloud Pull, Polar manual import.
- Limit payload bytes, array counts, nesting depth, string lengths and numeric ranges before persistence.
- Reject invalid ISO dates rather than using them in selector or inline-handler strings.
- Do not sanitize by mutating stored data; validate/canonicalize on ingest and encode at the output context.
- Prefer DOM creation and event listeners. If templates remain, maintain separate `escapeText`, `escapeAttribute` and safe URL/identifier functions.
- Add regression tests asserting imported strings remain text in the DOM.
- After inline scripts/handlers are removed or nonce-managed, deploy CSP (`default-src 'self'`, constrained `connect-src`, no `object-src`) and consider Trusted Types.

## 8. DATA model findings

The full machine-readable map is in `SIMURG_DATA_SCHEMA_CURRENT.json`.

### Architecture summary

- `DATA` is an untyped mutable global object.
- The initial object only declares `workouts`, `metrics`, `nutrition` and `recovery`; other stores are added lazily.
- `save()` serializes the entire object to one localStorage key and triggers the global render chain.
- General restore and Cloud Pull replace the entire object.
- JSON backup includes every store, including Polar normalized and raw-derived data.
- `_meta.build` is build metadata, not an enforced schema version.
- There is no migration registry, validation step, immutable record ID convention or owner/device identity.

### Workout row ambiguity

The embedded and Gym-created model usually represents **one individual set per row** and sets `sets: 1`. Several legacy calculations count `items.length` as set count and calculate `weight × reps` per row. Newer `SimurgSignalModel` and `workout-source-policy` calculations use `row.sets` as a multiplier for repetitions and volume. Universal Import permits `sets > 1` in a single row.

Consequently, the same imported row can mean either “one row describing N sets” or “one set with a redundant sets field,” and totals vary by call path. This is P1 data integrity. The future schema must choose one canonical representation:

- preferred: immutable `set_id`, one set per record, no multiplicative `sets`; or
- session/exercise record containing a `sets[]` array with stable child IDs.

Do not keep both interpretations.

### Duplicate behavior

- Workout import uses a wide composite key; it can miss duplicates when metadata changes and has no immutable source ID.
- Apple import uses date/start/duration; missing timing creates false merges or duplicates.
- Daily/weekly/metric/nutrition/recovery records append without uniqueness constraints.
- Polar workouts retain `polarExerciseId`, but frontend merge uses date + startTime instead of the source ID.
- Daily Polar categories are date-keyed and overwrite/merge the same day, which is reasonable for daily summaries but not versioned.

## 9. Duplicate function findings

See `SIMURG_FUNCTION_OVERRIDE_MAP.json` for all prioritized definitions, load order and likely-active state.

Highest-impact cases:

1. `universalImport` is an expanded dispatcher wrapped by undo, import-date, legacy Polar Recovery and finally Polar Workout handling. Security and deduplication depend on wrapper order.
2. `renderWeeklyReport` has a base replacement plus five wrappers that add/remove content asynchronously. Final DOM and escaping are difficult to reason about.
3. `calculateReadiness` is replaced after inline renderers are created, while `SimurgReadiness.resolve` is a parallel model. Different callers can calculate different readiness.
4. `activityLoadForDate` changes from a legacy aggregator to `SimurgWorkoutSource.metrics` after load.
5. Two active duration concepts disagree: the global parser treats `MM:SS`, while `SimurgWorkoutSource.durationMinutes` treats a two-component value as `HH:MM`. Polar also has a module-local parser.
6. Three versions each of `renderCoachPanels` and `renderPhoenixReport` remain in active inline source; the last assignment wins.

Tracked unreferenced artifacts (`script.js`, `all_scripts.js`, multiple `script_*.js`) contain still more copies. They do not execute in the current page but increase public exposure, review noise and accidental reintroduction risk.

## 10. Recommended target architecture

### Authentication and ownership

Use Supabase Auth. One Simurg account may authorize multiple trusted devices. Every cloud row must carry `user_id uuid not null` derived from `auth.uid()`—never trusted from an arbitrary payload field. Device registration should create a random `device_id` under that user and permit revocation.

### Current record

```text
simurg_current
- user_id              primary/unique owner key
- revision             monotonically increasing bigint
- schema_version       integer/string
- payload              jsonb
- payload_hash         cryptographic hash of canonical payload
- updated_at           server timestamp
- updated_by_device    device ID owned by user_id
```

### Snapshots

```text
simurg_snapshots
- id                    uuid
- user_id               owner
- revision              source revision
- schema_version
- payload
- payload_hash
- device_id
- created_at             server timestamp
```

### RLS principle

For both current and snapshots, ownership policies should reduce to:

```sql
auth.uid() = user_id
```

`INSERT`/`UPDATE` checks must also validate that `updated_by_device` belongs to the authenticated user. Revoke `anon` access. Service role remains server-only.

### Conflict-safe protocol

1. Client stores `local_revision`, `schema_version`, canonical `payload_hash` and `device_id` beside DATA metadata.
2. Pull metadata first: cloud revision/hash/time/device.
3. Present a Pull preview when hashes differ: local/cloud timestamps, revisions and per-store count differences; never silently replace.
4. Before Push, create a server snapshot of the current cloud revision in the same transaction/function.
5. Push includes `expected_revision` and the new payload hash.
6. A database function/Edge Function atomically updates only when current revision equals expected revision and owner/device checks pass.
7. On mismatch, return a conflict response with metadata; do not overwrite.
8. Before applying Pull locally, create a local snapshot. Keep bounded restore history with explicit retention.
9. Conflict resolution options: keep local as a new revision after review, accept cloud, or perform a schema-aware record merge using stable IDs.
10. Verify the canonical hash after download before applying the payload.

Do not introduce Realtime until authentication, user isolation, stable IDs, revisions, snapshots and conflict UX are working. Realtime would otherwise accelerate destructive last-writer-wins behavior.

### Privacy minimization

- Separate raw Polar archives from the general user payload. Keep raw records server-side with short, documented retention; sync only necessary normalized fields to the browser.
- Allow export/delete by category and disclose what is stored locally, in current cloud state, in snapshots and in Polar archives.
- Avoid storing profile fields the UI/calculations do not use.
- Add retention policies for sync logs, raw Polar data and snapshots.
- Maintain a data-processing inventory and incident-response procedure for public-repository exposure.

## 11. Prioritized remediation roadmap

### P0 — Immediate

1. **Contain public personal data:** replace `INITIAL` with an empty or unmistakably synthetic fixture; remove duplicate tracked data artifacts from the current tree/deployment; invalidate public caches. Do not rewrite history without a separately approved plan.
2. **Incident/history decision:** determine repository visibility, forks/releases/caches, rotate any credential only if it was actually secret, and decide whether coordinated history rewrite and force-push are warranted.
3. **Close stored injection:** add a canonical schema validator, safe DOM rendering for identified sinks, payload limits and regression tests.
4. **Verify live `simurg_data` RLS/grants immediately:** if `anon` can read/write the shared row, disable that path or restrict it before further use. Preserve the Polar server integration while doing so.

### P1 — Data integrity and sync

5. Introduce a versioned DATA schema and migrations.
6. Adopt stable immutable IDs and one canonical set representation.
7. Add Supabase Auth, `user_id` ownership and trusted-device records.
8. Replace direct REST whole-object upsert with an atomic expected-revision sync API.
9. Add local/server snapshots, Pull preview, restore history and conflict resolution.
10. Consolidate duration parsing, readiness/source policy and import dispatchers.

### P2 — Maintainability and product consistency

11. Consolidate coaching/daily/weekly renderers and eliminate asynchronous wrapper chains.
12. Remove or quarantine unreferenced aggregate/legacy scripts after confirming deployment dependencies.
13. Standardize labels and source terminology.
14. Add privacy documentation, retention controls and automated secret/personal-fixture checks in CI.

## 12. Exact files likely to change in future implementation phases

No files below were changed by this audit. Expected future scope:

### Public-data containment and import/render safety

- `index.html` — empty/synthetic INITIAL, schema-gated restore/import, safe DOM rendering, cloud UI changes.
- `script.js`, `all_scripts.js`, `script_1.js` and other confirmed unreferenced `script_*.js` — remove/quarantine current public duplicates after dependency verification.
- `polar-workout.js` — route manual Polar JSON through the canonical validator while preserving dashboard behavior.
- `polar-accesslink.js` — consume versioned stores and persist only validated normalized records; preserve capability/token boundary.
- `simurg-signal-model.js` — consume canonical set/session schema.
- `workout-source-policy.js` — consume canonical duration/set schema.
- New, narrowly scoped modules such as `data-schema.js`, `safe-render.js`, `sync-client.js` plus tests.

### Authenticated revisioned Cloud Sync

- `index.html` or extracted Cloud Sync client module — Auth session, device ID, metadata preview and conflict UX.
- New Supabase migration(s) for `simurg_current`, `simurg_snapshots`, trusted devices, RLS and transactional revision function.
- New/updated Edge Function for authenticated compare-and-swap Push/Pull metadata if database RPC is not exposed directly.
- `sw.js` and asset query versions only when runtime assets actually change.

### Polar privacy minimization (later, not a rewrite)

- `supabase/functions/_shared/polar.ts` — only if field minimization/retention policy requires normalized-output changes.
- `supabase/functions/polar-sync/index.ts` — only if raw-data retention or client-output minimization is approved.
- New migration for raw-data/sync-log retention automation.

### Git history response

- Repository history and hosting/release caches, under a separate explicit authorization. This is an operational action, not a normal source patch, and was not performed.

## Audit limitations

- No live Supabase dashboard, table policies, logs, backups or Edge Function environment/deployment state were inspected.
- No browser localStorage, actual cloud payload, user account, GitHub forks, Pages caches or third-party logs were accessed.
- Source review was static and focused; it did not execute hostile inputs, penetration tests or dependency vulnerability scans.
- Record classification is based on coherence and lack of a synthetic label; only the data owner can conclusively identify provenance.
- Approximate history/revision counts may change as the repository evolves.

## Privacy Phase 1 Remediation Status

Status date: 2026-07-18  
Scope: current working tree and files that can be served from the current GitHub Pages source; no Git history, browser storage, cloud payload or deployed environment mutation

### Files changed

- `index.html` — replaced the live `INITIAL` personal workout dataset with a structurally complete empty schema.
- `script.js` — replaced its duplicate `INITIAL` dataset with the same empty schema and changed one legacy activity placeholder to an explicitly synthetic 2099 fixture.
- `all_scripts.js` — replaced the tracked aggregate copy of `INITIAL` with the empty schema.
- `script_1.js` — replaced the tracked legacy copy of `INITIAL` with the empty schema.
- `sw.js` — advanced the cache identity so a future authorized deployment activates a new cache and removes the prior cached source.
- `docs/security/SIMURG_PRIVACY_SECURITY_AUDIT.md` — recorded this remediation status.
- `docs/security/SIMURG_PRIVACY_PHASE_1_VERIFICATION.md` — added the manual verification and post-push privacy checklist.

### Personal data removed

- Removed approximately 42 unique set-level workout records from the live default dataset.
- Removed four serialized copies of that dataset (approximately 168 embedded row instances across current tracked files).
- Removed the remaining legacy placeholder that reused an identified personal workout date and plausible activity measurements; it is now unmistakably synthetic.
- The empty default contains no workout, Apple Health/Watch, Polar workout, Polar activity, profile, HRV, sleep, recovery, pain, form, RPE, daily-note or location record.
- Program template exercise names remain because they are application configuration, not dated performance records. No real dates, weights, repetitions or notes remain attached to them in the current default source.

### Runtime behavior preserved

- Startup still evaluates `localStorage.getItem('atlas_summary_reports')` first.
- If existing local data is present, it remains the source of `DATA`; no clear, reset or destructive migration was added.
- If local data is absent, `DATA` now starts with `schemaVersion: 1` and empty, compatible stores for all existing runtime categories.
- Gym program templates remain available because they are generated independently from `DATA.workouts`.
- Workout Logger, Daily, Weekly, Monthly and Coaching continue to use their existing empty-state paths.
- Polar AccessLink connection state, OAuth, sync and dashboard code were not changed.
- Universal Import, JSON backup/restore and Cloud Sync code were not changed.
- Service-worker fetch/navigation behavior and asset versions were not changed; only the matching registration/cache identity advanced to `privacy-phase-1-1`.
- No Cloud Push/Pull was performed during remediation or verification.

### Remaining Git history exposure

The former records remain reachable in earlier Git objects and may remain in clones, forks, Pages caches or downloaded source archives. Current-tree removal does not retract those copies. A history rewrite, force push or cache/deployment operation was explicitly out of scope and was not performed. Any history remediation requires separate approval, coordination and rollback planning.

### Remaining Supabase/RLS work

- The live `simurg_data` RLS/grants still require dashboard verification.
- Cloud Sync still uses an unauthenticated fixed `main` record and whole-payload last-writer-wins behavior.
- Existing cloud payloads were not read, changed or deleted.
- Supabase Auth, per-user ownership, revisions, hashes, snapshots and conflict handling remain future work.

### Verification completed in this phase

- Parsed all four `INITIAL` constants and confirmed zero workout/Apple/Polar records plus the complete expected empty store structure.
- Confirmed the localStorage-first fallback expression in `index.html` is unchanged.
- Scanned tracked current files for the two identified personal dates; no current-tree match remains.
- Classified remaining exercise-name matches as structural program templates, synthetic tests or redacted audit documentation rather than dated personal records.
- Ran existing lightweight Node/static test suite and JavaScript syntax checks; results are recorded in the Phase 1 verification document.

### Verification still required

- Manual fresh-profile mobile and desktop startup with empty storage.
- Manual existing-profile startup using a backed-up local dataset, without pressing Cloud Push/Pull.
- Polar connection/dashboard smoke test without changing OAuth or sync state.
- Universal Import smoke test with an explicitly synthetic payload, followed by local cleanup/restore.
- After a future authorized push/deploy: inspect GitHub Pages source and network-loaded assets, repeat the current-tree privacy scan, and account for CDN/service-worker caches.

## Privacy Phase 1B — Polar Sample Neutralization

Status date: 2026-07-18

### Scope and changes

- `index.html` `fillPolarSample()` now emits an explicitly synthetic Polar Recovery fixture.
- `index.html` `samplePayload()` now returns the same synthetic fixture and no longer contains a plausible historical Polar/Apple Health session, sleep-stage collection or dated health profile.
- `index.html` legacy Polar Bridge card no longer renders fixture JSON into its textarea during startup. The empty textarea falls back to `samplePayload()` only when the user explicitly clicks **Test Payload Kaydet**.
- `script.js` and `all_scripts.js` duplicate `fillPolarSample()` helpers use the identical fixture.
- The helper feature, import parser, explicit save button and legacy UI remain present.

### Synthetic fixture contract

Every retained fixture uses:

- `type` and `importType`: `polar_recovery`;
- `source`: `synthetic_test_fixture`;
- `fixture: true` and `synthetic: true`;
- the neutral future date `2099-01-01`;
- device label `Synthetic Polar Device`;
- note `SYNTHETIC TEST DATA — NOT USER DATA`;
- the same neutral test-only metric values across all copies.

The fixture contains no location, coordinate, user name, device ID or account identifier. It is not inserted into DATA during startup. `fillPolarSample()` only fills the Universal Import textarea after its sample button is clicked; Bridge `samplePayload()` is persisted only after the explicit test-save click.

### Preserved behavior

- Live Polar AccessLink response handling, OAuth, sync and connection functions were not changed.
- Cloud Sync, localStorage priority, DATA initialization, Gym, Logger and Coaching were not changed.
- No localStorage or cloud payload was read, cleared or overwritten during implementation or validation.

### Phase 1B verification result

- All changed fixture objects parsed successfully and were structurally identical.
- Helper definitions and explicit UI call sites remain present.
- No automatic startup invocation of `fillPolarSample()` or `simurgSavePolarBridgeTestPayload()` exists.
- Previous realistic Polar sample combinations and the fixed legacy sample date no longer occur in the three scoped files.
- Existing lightweight tests, diff whitespace checks and syntax validation passed, subject to the documented mixed HTML/JS nature of the unreferenced `script.js` artifact.

## Privacy Phase 1C — Remaining Tracked Sample Cleanup

Status date: 2026-07-18

### Scope and changes

- `script_23.js` was checked against `index.html`, the service-worker asset list, static and dynamic imports, and build/concatenation references. No runtime loading path was found; it remains a legacy archive/development artifact and a candidate for a separately approved later cleanup.
- The legacy `fillPolarSample()` copy in `script_23.js` now uses the same explicit 2099 synthetic fixture as the active helper copies. A nearby source comment identifies it as synthetic test data that is not loaded at runtime.
- `README_POLAR_HOME_DASHBOARD_V1.txt` now documents that same explicit synthetic fixture instead of a plausible dated health example.
- No historical algorithm, parser, threshold, UI helper or unrelated legacy function was removed or changed.

### Preserved behavior

- No startup path, localStorage priority, DATA initialization, UI event, Cloud Sync payload, Polar AccessLink/OAuth handling or service-worker behavior changed in Phase 1C.
- The sample/helper feature remains available only through its existing explicit user action in runtime-loaded files.
- Structural health field names and calculation constants remain because they are application schema/logic, not embedded user records.

### Verification result

- All retained Polar fixtures use the identical `2099-01-01` fixture with `synthetic: true`, `fixture: true`, `source: synthetic_test_fixture` and the required synthetic-data note.
- The tracked working tree contains no remaining identified personal Polar/health record from the Phase 0 inventory.
- Remaining relevant matches are limited to structural schema/calculation terms, program templates, explicit synthetic fixtures and redacted security documentation.
- Git history, forks, clones, old deployments/caches, existing browser storage and cloud/Supabase data remain outside current-tree cleanup and require separate verification or authorization.

| File | Match remains | Classification | Action required |
|---|---|---|---|
| `index.html`, `script.js`, `all_scripts.js` | Synthetic Polar markers and structural health fields only | Explicitly synthetic fixture / structural field name | None for current-tree privacy cleanup |
| `script_23.js` | Synthetic Polar markers and historical calculation fields only | Explicitly synthetic fixture / structural legacy logic | Consider archive deletion only in a separately approved cleanup |
| `README_POLAR_HOME_DASHBOARD_V1.txt` | Synthetic example only | Explicitly synthetic fixture | None |
| `script_1.js` and other runtime source | Schema, calculations and empty defaults only | Structural field name | None |
| `tests/` | Test-scoped dates and metrics only | Synthetic test fixture | Keep test-only and out of runtime assets |
| Other `README*.txt` | Feature terminology only | Structural documentation | None |
| `docs/security/` | Redacted findings and synthetic marker references | Security documentation with redacted description | Preserve for audit trail |

No match was classified as potentially personal, a realistic unlabelled health sample, a real workout record, or a real date/note/location combination.
