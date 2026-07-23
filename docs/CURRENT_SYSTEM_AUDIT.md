# SIMURG OS Current-System Audit

Audit date: 2026-07-23  
Repository: `gorkemcalik10/simurg-os-mobile`  
Audited branch: `main`  
Scope: read-only inspection of the current working tree and local runtime

This document describes the code that actually executes today. It does not treat
old design documents, disabled templates, or unreferenced script copies as current
runtime authority.

Companion maps:

- [Mobile system map](MOBILE_SYSTEM_MAP.md)
- [Desktop system map](DESKTOP_SYSTEM_MAP.md)
- [Data and integrations map](DATA_AND_INTEGRATIONS_MAP.md)

## Executive summary

SIMURG OS is a local-first, single-page web application. `index.html` is still the
primary application bundle: it contains the base DOM, the initial data model,
most legacy renderers, persistence, import/export, Gym/Logger behavior, and several
generations of inline overrides. Current presentation and integrations are then
layered on by external scripts.

The current active system is functional on the audited mobile and desktop sizes:

- Mobile navigation, Home tabs, Gym, Logger, Polar, Menu, and Polar Workout exit
  behavior worked at 390 × 844.
- Desktop Home date controls and all nine sidebar destinations worked at
  1440 × 900.
- No console error, unhandled exception, failed same-origin request, or horizontal
  overflow was observed during the audited paths.
- The authenticated cloud controller is the only active cloud implementation.
  It uses `simurg_user_data`, explicit Push/Pull, per-user revision metadata, and
  does not automatically move local data.
- Polar AccessLink and the Polar-first workout-source policy are active. Older
  Polar Bridge/sample code still exists and part of the bridge lifecycle is active,
  although its old cards are hidden.

The application is not ready to be treated as security-hardened. The two most
important findings are:

1. Imported/user-controlled strings reach active `innerHTML` renderers without a
   single enforced escaping boundary. A stored DOM-XSS payload could expose local
   health data, the persistent Supabase session, and the Polar device capability.
2. General JSON restore replaces the complete `DATA` object without comprehensive
   schema validation. Cloud Pull is safer because it confirms and creates a backup,
   but it also replaces the complete root after only shallow validation.

## 1. Runtime architecture

### 1.1 Active load order

The effective startup sequence is:

1. `simurg-signal-model.js?v=4`
2. First inline stylesheet and the base application DOM in `index.html`
3. Active inline scripts in document order, including:
   - `INITIAL`, localStorage-first `DATA`, date state, base calculations
   - base `render()` and `save()`
   - Gym, Logger, reports, import/export, and modal behavior
   - mobile shell generations that remain outside disabled templates
   - active Polar Bridge helper
   - `simurgWhoopMobileV8Script`, which owns the current mobile router
   - `simurgCanonicalLifecycleScript`, which restores the canonical base render
4. `polar-workout.css?v=11`
5. `polar-workout.js?v=12`
6. `workout-source-policy.js?v=2`
7. `premium-standard.css?v=31`
8. `premium-standard.js?v=32`
9. `polar-accesslink.css?v=4`
10. `polar-accesslink.js?v=5`
11. `desktop-alignment.css?v=23`
12. `desktop-alignment.js?v=25`
13. Supabase JS v2.95.0 from the pinned CDN URL
14. `simurg-cloud-auth.js?v=1`
15. Service-worker registration for `sw.js?v=cloud-auth-phase-2b-1`

The order matters. In particular:

- The signal model is loaded before consumers but resolves globals at call time.
- `polar-workout.js` installs an outer Universal Import wrapper.
- `workout-source-policy.js` replaces shared activity-load/readiness-facing helpers.
- `premium-standard.js` becomes the main Home and mobile presentation layer.
- `desktop-alignment.js` becomes the desktop navigation and report controller.
- Cloud auth is deferred until the Supabase CDN dependency is available.

### 1.2 Important files and responsibilities

| File or area | Current responsibility | Runtime status |
|---|---|---|
| `index.html` | Base DOM/CSS, `INITIAL`, `DATA`, persistence, Gym, Logger, reports, import/export, mobile router, legacy layers | Active; principal monolith |
| `simurg-signal-model.js` | Normalized day/week/month signals, cross-source session dedupe, readiness inputs, PR/risk/target models, caches | Active |
| `premium-standard.js/css` | Current Home, shared premium cards, Gym/Logger/Data refinements, localization, refresh coordination | Active |
| `desktop-alignment.js/css` | Desktop sidebar, desktop screen mounts, report renderers, desktop-only layout/state | Active above 900 px |
| `workout-source-policy.js` | Polar-first workout selection and Polar/Gym/Apple Health source fusion | Active |
| `polar-workout.js/css` | Polar workout history/detail, date navigation, tabs, manual Polar import/export | Active |
| `polar-accesslink.js/css` | AccessLink connection card, OAuth entry, sync/disconnect, normalized payload merge | Active |
| `simurg-cloud-auth.js` | Email/password auth, session restore, Check/Push/Pull, revision metadata | Active |
| `sw.js` | App-shell caching and navigation fallback | Active |
| `manifest.json`, `icons/` | Install metadata and PWA icons | Active |
| `supabase/functions/*` | Polar connect/callback/sync/disconnect server endpoints | Active server source; deployment state not inferred |
| `supabase/migrations/002_simurg_user_data_auth.sql` | Proposed/current per-user cloud table and RLS definition | Repository authority; live execution not confirmed |
| `tests/*` | Source contracts, syntax, signal model, navigation, cloud, layout | Active local test suite |
| `script.js`, `all_scripts.js`, `script_*.js` | Historic extracted/duplicate bundles | Tracked/public but not loaded by `index.html` |

### 1.3 Global state and controllers

| State/controller | Owner | Purpose |
|---|---|---|
| `DATA` | `index.html` | Complete local application payload |
| `INITIAL` | `index.html` | Empty/default schema used only when no saved payload exists |
| `selectedDate`, `weekStart` | `index.html` | Shared selected-day/week state used by base and premium renderers |
| `SimurgSignalModel` | `simurg-signal-model.js` | Cached normalized data facade |
| `SimurgWorkoutSource` | `workout-source-policy.js` | Canonical per-day physical-session source selection |
| `SimurgReadiness` | `premium-standard.js` | Current readiness resolver |
| `SimurgPremium` | `premium-standard.js` | Premium rendering/refresh facade |
| `SimurgDesktop` | `desktop-alignment.js` | Desktop navigation, state, and renderer facade |
| `SimurgPolarAccessLink` | `polar-accesslink.js` | Device capability and AccessLink actions |
| `SimurgCloudAuth` | `simurg-cloud-auth.js` | Auth and explicit cloud actions |
| `window.__simurgCurrentMobileKey` / `__simurgStableNavKey` | mobile router | Stable current mobile navigation key |

`DATA` is loaded with:

```text
localStorage["atlas_summary_reports"] if present
otherwise a deep copy of INITIAL
```

Existing localStorage therefore takes priority over defaults.

### 1.4 Render and override chain

The current application does not have one component tree. It has a chain of global
functions and DOM-replacement renderers:

- Base `render()` updates broad sections.
- Active `save()` updates `_meta.lastLocalUpdate`, writes the complete `DATA`
  payload, invalidates signal caches, and calls broad rendering.
- `simurgCanonicalLifecycleScript` restores the intended base render after earlier
  inline wrappers.
- That base render still calls premium and desktop refresh entry points.
- `SimurgPremium.refreshAll()` touches Home, Gym, Logger, Coaching, Data Center,
  reports, Program Intelligence, and Polar-related helpers.
- On desktop, `SimurgDesktop.renderAll()` eagerly rebuilds all major desktop
  screens, including inactive destinations.

This is functional but creates high coupling: one save can rebuild unrelated
screens, and small changes can accidentally reactivate older DOM.

### 1.5 Disabled, legacy, duplicate, and misleading code

Four large archives are correctly wrapped in `<template data-runtime-disabled>`
and do not execute:

| Archive | Approximate location in `index.html` | Status |
|---|---:|---|
| `simurgLegacyHomeRecoveryArchive` | 4,730–5,582 | Disabled |
| `simurgLegacyWhoopMobileArchive` | 10,738–11,482 | Disabled |
| `simurgLegacyPremiumShellArchive` | 11,483–13,430 | Disabled |
| `simurgLegacyVisualSystemArchive` | 13,432–14,286 | Disabled |

Consequences:

- Router wrappers inside those templates are not active.
- Source search without template awareness gives incorrect conclusions.
- `script.js`, `all_scripts.js`, and numbered script copies contain old cloud and
  UI implementations but are not referenced by the active page.
- Desktop mount IDs such as `desktopLegacyLogger` and
  `desktopLegacyCoaching` include “Legacy” in the identifier but are current
  runtime mounts.
- The source sidebar contains older buttons. Desktop alignment hides unrecognized
  originals and appends its canonical buttons, leaving hidden duplicate nodes.
- Old Polar Bridge/sample structures are not fully dead. Their old visual cards are
  hidden, but initialization and persistence helpers remain active.

## 2. Current UI summary

### Mobile

Visible bottom navigation, in exact order:

1. Ana
2. Gym
3. Günlük
4. Polar
5. Menü

Visible Menu destinations:

1. Koçluk
2. Program
3. Haftalık
4. Aylık
5. Veri Merkezi

Home contains four tabs: Genel Bakış, Toparlanma, Uyku, Yük.

See [MOBILE_SYSTEM_MAP.md](MOBILE_SYSTEM_MAP.md) for the full screen inventory.

### Desktop

Visible sidebar navigation, in exact order:

1. Ana
2. Antrenman Günlüğü
3. Polar Verileri
4. Günlük Özet
5. Haftalık Özet
6. Aylık Değerlendirme
7. Program Analizi
8. Koçluk
9. Veri Merkezi

See [DESKTOP_SYSTEM_MAP.md](DESKTOP_SYSTEM_MAP.md) for the full screen inventory.

## 3. Service worker and cache behavior

The service worker cache identity is `simurg-cloud-auth-phase-2b-1`.

- Install precaches the listed same-origin core assets and calls `skipWaiting()`.
- Activate deletes every cache whose name is not the current application cache,
  then claims clients.
- Non-GET requests are ignored.
- Supabase requests bypass the cache.
- Page navigations are network-first with cached `index.html` fallback.
- On localhost, JS/CSS/HTML requests are network-first.
- In production, same-origin static assets are cache-first.
- The external Supabase CDN script is not available from the offline app cache.

The active `index.html` asset query strings matched `CORE_ASSETS` during this audit.

## 4. Runtime verification performed

### Browser checks

Fresh local state was exercised at:

- Mobile: 390 × 844
- Desktop: 1440 × 900

Verified:

- Mobile Home tabs and all bottom navigation destinations
- Mobile Menu destinations
- Polar main screen, workout detail open, detail back, and bottom-nav exit
- Desktop Home Previous, Next, Today, and all four tabs
- All nine desktop sidebar destinations
- Data Center signed-out control states
- No horizontal overflow on the exercised screens
- No console warnings/errors or failed same-origin asset requests

### Automated checks

`node tests/run-tests.js` passed all reported contracts, including:

- 45 active inline scripts plus external runtime syntax
- signal-model normalization/dedupe/cache behavior
- cache label and active asset-version equality
- canonical mobile router and scroll reset
- Home date navigation
- source-aware Activity Session
- authenticated cloud constraints and localStorage-first startup

`git diff --check` passed before documentation creation. Direct `node --check`
also passed for all active external JS files and `sw.js`.

## 5. Findings ranked by severity

### Critical

#### C1. Stored DOM-XSS boundary is not enforced

**Evidence:** active base and premium paths construct `innerHTML` from imported or
editable workout, program, note, and activity strings. Escaping is used in some
newer desktop helpers, but not consistently at the storage-to-DOM boundary.

**Impact:** a malicious backup/import or edited record could execute in the app
origin. That origin can read the complete local health/workout payload, persistent
Supabase session material, and the Polar device capability, then invoke authenticated
cloud or Polar actions.

**Areas:** `index.html`, premium renderers, import paths, modal/edit renderers.

#### C2. Whole-payload restore has insufficient schema validation

**Evidence:** general JSON import parses and assigns the complete `DATA` root before
save. Cloud Pull adds confirmation and an automatic local backup, but validates only
that the root is a plain object plus a small set of defaults.

**Impact:** malformed or wrong-version data can erase expected collections, break
renderers, or overwrite the complete local state. Cloud revision safety prevents
concurrent server overwrite; it does not validate payload semantics.

**Areas:** base `importJSON`, Universal Import wrappers, `simurg-cloud-auth.js`.

### High

#### H1. Global override and broad-render architecture is fragile

One mutation can trigger base render, premium refresh, and eager desktop `renderAll`.
The active authority depends on script order and disabled-template boundaries.
Regression risk is high even when an individual function is correct.

#### H2. Polar client capability is a browser possession secret, not a user identity

The random AccessLink client ID/key is held in localStorage and authorizes server
function calls. It is not bound to the current Supabase Auth user. This is adequate
for the current device-capability design but magnifies same-origin XSS and shared
browser-profile risk.

#### H3. Polar token refresh is not implemented in the inspected sync path

The server stores encrypted refresh-token/expiry fields, but the inspected sync
function uses the current access token and marks a 401 as token error. Long-lived
connections may require reconnecting after expiry.

#### H4. Workout record identity and set semantics are inconsistent

Workout rows have no stable IDs. Some calculations treat each row as one set while
the signal model can multiply by a `sets` field. Import/edit/dedupe paths therefore
have a risk of duplicates and mismatched totals.

#### H5. Full-object cloud sync has a large conflict and replacement radius

Revision compare-and-swap correctly blocks silent concurrent overwrites, but every
Push/Pull is still a complete payload operation. One invalid local root affects all
domains at once.

### Medium

#### M1. Responsive ownership is ambiguous from 861–900 px

The active mobile router/style boundary is primarily 860 px, while desktop alignment
starts above 900 px. Premium styles also use 900 px in places. The intermediate
range does not have one clearly documented owner.

#### M2. Active Polar Bridge lifecycle can mutate local shape during startup

The legacy bridge initializes `DATA.polarBridge` and can persist it even without an
explicit user import. Its visible legacy cards are hidden, but it still participates
in Polar rendering and can race with AccessLink insertion.

#### M3. Raw/normalized Polar health data has multiple retention locations

Normalized records and selected raw fragments may exist locally, while server-side
raw payload tables archive Polar responses. A repository-visible retention/deletion
policy was not found.

#### M4. No in-app account creation flow

Email/password sign-in, restore, and sign-out exist, but account provisioning must
currently happen outside the application. This is a product/operations gap, not an
RLS bypass.

#### M5. PWA cache ownership is broad

Activation deletes every other cache visible to this service-worker origin. That is
safe for a dedicated origin but can remove unrelated caches if the scope/origin is
shared.

#### M6. External Supabase runtime is not offline-cached and has no SRI

Offline local features can still render, but cloud auth cannot initialize without
the CDN script. A strict CSP is also difficult because the application relies on
many inline scripts.

#### M7. Duplicate tracked runtime copies can be accidentally reintroduced

Unreferenced `script*.js` files contain obsolete implementations, including old
cloud behavior. They are dead today but remain public and easy to load accidentally.

#### M8. Documentation drift exists

At least one current-schema document still describes the retired shared
`simurg_data/main` model, while active code uses `simurg_user_data`.

### Low

#### L1. Hidden duplicate navigation nodes remain in desktop DOM

The visible sidebar is correct, but older hidden buttons plus appended canonical
buttons complicate accessibility inspection and future event binding.

#### L2. Personalized greeting remains in source presentation

The visible greeting includes a personal first name even with an empty `INITIAL`.
This is a privacy/white-label issue rather than a DATA leak.

#### L3. Mixed-language labels remain

The current system intentionally mixes Turkish UI with some English source/status
labels. The localization walker improves this but can also mutate text after render.

## 6. Areas requiring manual or live-environment confirmation

The following cannot be established from repository inspection and an empty local
runtime alone:

- Whether migration `002_simurg_user_data_auth.sql` has been executed exactly as
  committed in the live Supabase project
- Live RLS behavior with two permanent users and an anonymous-auth user
- Real email/password session persistence across browser restarts
- A real Push/Pull revision conflict and restore from the automatic backup
- A full live Polar OAuth callback and token-expiry/refresh outcome
- Multi-workout Polar history with real partial zone/sleep/load payloads
- iOS installed-PWA safe-area, keyboard, and background-resume behavior
- Offline cold start when the Supabase CDN is unavailable
- Populated-state visual behavior at 861–900 px and additional desktop widths
- Accessibility with keyboard and screen reader across hidden duplicate DOM

No live Supabase or Polar mutation was performed.

## 7. Recommended next actions

### A. Must-fix stability/security

#### 1. Establish one trusted rendering/escaping boundary

- **Why now:** it closes the highest-impact path from imported data to origin-level
  code execution.
- **Areas:** active `innerHTML` builders in `index.html`, premium/desktop renderers,
  import display paths.
- **Risk:** Critical.
- **UI/data change:** no intended UI or data-model change.
- **Manual test:** import strings containing HTML, quotes, and script-like content;
  confirm they render as text in mobile and desktop edit/review flows.

#### 2. Version and validate complete payloads before replacement

- **Why now:** JSON restore and Cloud Pull can replace every data domain.
- **Areas:** general restore, Universal Import, cloud Pull, `INITIAL` migration.
- **Risk:** Critical.
- **UI/data change:** adds validation/error UI; preserves valid data.
- **Manual test:** valid old backup, valid current backup, wrong root type, missing
  collections, malicious strings, interrupted Pull, and backup restore.

#### 3. Validate cloud and Polar security in the live environment

- **Why now:** repository contracts cannot prove deployed RLS, function secrets,
  CORS, or token expiry behavior.
- **Areas:** Supabase migration/function deployment and AccessLink lifecycle.
- **Risk:** High.
- **UI/data change:** none for verification; token-refresh work may change server logic.
- **Manual test:** two permanent users, anonymous-auth denial, stale revision conflict,
  OAuth connect/sync/disconnect, expired token, and reconnect.

### B. Cleanup/maintainability

#### 4. Produce a canonical runtime boundary before removing legacy code

- **Why now:** the app currently depends on script order, broad refreshes, and hidden
  archives; refactoring without an authority map is risky.
- **Areas:** `index.html`, disabled templates, unreferenced `script*.js`,
  `SimurgPremium.refreshAll`, `SimurgDesktop.renderAll`.
- **Risk:** High.
- **UI/data change:** should be none; do this behind contract and browser tests.
- **Manual test:** exact mobile/desktop navigation matrix, imports, save/edit, Polar
  detail exit, and all reports after every extraction step.

### C. Product improvements

#### 5. Define stable workout IDs and one set-count contract

- **Why now:** current aggregation/dedupe behavior can produce different totals and
  complicates multi-source merging.
- **Areas:** `DATA.workouts`, import/edit paths, signal model, source policy, reports.
- **Risk:** High because it changes data semantics.
- **UI/data change:** migration required; totals may change after correction.
- **Manual test:** migrated backups, same-day duplicate exercises, multi-set rows,
  Polar + Gym fusion, weekly/monthly totals, PRs, targets, and cloud round trip.

## 8. Files and areas inspected

The audit inspected, without modifying application source:

- `index.html`
- `simurg-signal-model.js`
- `premium-standard.js`, `premium-standard.css`
- `desktop-alignment.js`, `desktop-alignment.css`
- `workout-source-policy.js`
- `polar-workout.js`, `polar-workout.css`
- `polar-accesslink.js`, `polar-accesslink.css`
- `simurg-cloud-auth.js`
- `sw.js`, `manifest.json`
- `script.js`, `all_scripts.js`, and tracked `script_*.js` copies
- `supabase/migrations/*`
- `supabase/functions/polar-*` and shared Polar function helpers
- `tests/*`
- relevant `docs/security/*` maps and migration plans, used only as secondary
  references and checked against runtime

Only the four audit documents requested for this task were created.
