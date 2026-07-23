# SIMURG OS Critical Security Remediation Plan

Planning date: 2026-07-23  
Repository/branch inspected: `gorkemcalik10/simurg-os-mobile` / `main`  
Status: planning only; no application source change is part of this document

This plan addresses only:

1. Stored DOM-XSS through imported, restored, cloud-synced, Polar-derived, or
   user-edited values.
2. Unsafe whole-`DATA` JSON restore and insufficient import validation.

It intentionally excludes UI redesign, Polar OAuth/token changes, Supabase schema
changes, legacy deletion, and general refactoring.

Source line numbers are approximate and refer to the repository state audited on
the date above.

## 1. Security boundary and threat model

The relevant trust boundaries are:

- editable Gym/Logger fields
- pasted Universal Import JSON
- selected JSON backup files
- cloud-pulled JSON payloads
- manual Polar Workout and Polar Recovery imports
- legacy Polar Bridge/Shortcut payloads
- normalized Polar AccessLink responses
- existing localStorage restored at startup

All of these values can eventually be persisted in `DATA`. A value does not need to
come from a remote attacker to be dangerous: an untrusted backup shared with the
user is enough to create a stored payload.

The main consequence is broader than UI defacement. JavaScript running in the
application origin can read:

- the complete local health/workout payload
- the persistent Supabase browser session
- per-user cloud revision metadata
- the Polar AccessLink device capability

It can then invoke the application's authenticated cloud and Polar operations in the
same browser session.

## 2. XSS trace

### 2.1 Existing output helpers and their limits

The repository has multiple local escaping helpers:

- `escapeAttr()` and `gymSafe()` in active `index.html`
- private `esc()` functions in `premium-standard.js`
- private `esc()` in `desktop-alignment.js`
- private `esc()` in `polar-workout.js`
- private `esc()` in `polar-accesslink.js`
- private `esc()` in the active Polar Bridge script

They correctly encode HTML text/attribute metacharacters when used consistently.
They do **not** make a value safe for JavaScript embedded inside an inline
`onclick` attribute. HTML character references are decoded before the inline
handler is interpreted as JavaScript. Therefore code such as “escaped value inside
a quoted onclick argument” remains the wrong context even if it passed through
`esc()`.

The remediation must distinguish:

- text-node context
- normal attribute/property context
- enum/class/style context
- event behavior

One generic string replacement cannot safely serve all four.

## 3. A — Confirmed exploitable active paths

The following paths are active and receive persisted or external values without a
complete context-safe boundary.

### A1. Mobile/base Logger exercise cards and inline handlers

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `renderWorkout()` and `exCard()`, approximately 6309–6330 |
| Fields | `workouts[].exercise`, `workouts[].bodyPart`, and restored `reps`/`weight` |
| Origin | Gym editing, Universal Import, full JSON restore, Cloud Pull |
| Screen | Mobile Günlük; base Logger DOM also renders during broad desktop refresh |
| Current escaping | None for exercise/body-part text. Exercise is also embedded in multiple inline `onclick` strings. The attempted quote replacement is not a JavaScript-context encoder. |
| Exploitability | **Direct/high confidence.** Markup executes when the card HTML is inserted; quote-based handler injection can execute when the card/menu/add-set control is clicked. Hidden DOM is not a protection against event attributes such as image error handlers. |
| Minimal remediation | Render exercise/body-part labels as text nodes or escape text centrally. Remove user-derived values from inline handler source; store the record/exercise identity in a property or safe `data-*` attribute and bind a delegated event listener. |

### A2. Workout edit modal attribute injection

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `openEditExercise()` and `openEditSet()`, approximately 7451–7452 |
| Fields | `exercise`, `bodyPart`, `notes`, `reps`, `weight` |
| Origin | User edits, import, backup restore, Cloud Pull |
| Screen | Logger exercise/set edit modal |
| Current escaping | `modalTitle.textContent` is safe. Every dynamic `<input value>` and the selected `<option>` are inserted without attribute escaping. |
| Exploitability | **Direct/high confidence.** A quote can break out of `value`; HTML/event attributes can be introduced as soon as the modal is opened. |
| Minimal remediation | Build the small form with DOM nodes and assign `.value`/`.textContent`. If keeping a template temporarily, use a context-correct attribute encoder for every value and never embed event source. DOM property assignment is preferred. |

### A3. Program/day names in active base navigation and reports

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `renderProgramDays()` 6286–6297; `renderWeeklyReport()` 7122–7150 |
| Fields | `programNames[day]`, program labels from `customGymPrograms` |
| Origin | Program-name editor, full backup restore, Cloud Pull |
| Screen | Gym/Logger week-day cards and Weekly report |
| Current escaping | Program display text is unescaped. The date/day handler arguments are developer-generated and safe. |
| Exploitability | **Direct/high confidence.** A program name is persisted, then inserted as HTML on the next broad render. |
| Minimal remediation | Keep static button structure; assign program label with `textContent`, or use centralized HTML text escaping at the exact interpolation. Continue to map day keys through the fixed seven-day enum. |

### A4. Logger group/right-rail category rendering

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `renderRight()`, approximately 6340–6378 |
| Fields | `workouts[].bodyPart` |
| Origin | Gym body-part editor, import, restore, Cloud Pull |
| Screen | Mobile Logger muscle distribution, tooltips, Raw Performance |
| Current escaping | Body-part key is inserted into visible text and `data-tip` without escaping. |
| Exploitability | **Direct/high confidence.** Attribute breakout and markup insertion are both possible during normal Logger render. |
| Minimal remediation | Assign tooltip through `dataset.tip` and labels through `textContent`; validate known body-part enums but retain a safely rendered custom `Other` label for compatibility. |

### A5. Daily Summary HTML

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `renderDailyReport()`, approximately 7050–7120 |
| Fields | workout `exercise`, `bodyPart`, `day`; activity `duration`; best exercise; activity/source labels |
| Origin | Gym, Universal Import, manual Polar import, full restore, Cloud Pull |
| Screen | Daily Summary base/mobile path and shared report refresh |
| Current escaping | Some activity names and source labels use `escapeAttr()`. Exercise chips, best exercise, body-part focus, workout day, and duration do not. |
| Exploitability | **Direct/high confidence** for workout fields. Activity duration is also a viable string sink when imported/restored. |
| Minimal remediation | Escape all textual fields or construct the repeated cards with text nodes. Keep date handler arguments only after ISO-date validation; use delegated events rather than inline source where practical. |

### A6. Weekly and coaching-derived workout labels

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | active `renderCoachPanels()` override 7844–7868; active `renderPhoenixReport()` override 7870–7877; base `renderWeeklyReport()` 7122–7150 |
| Fields | exercise name, body part, activity source/type, program name |
| Origin | Gym, Apple/Polar/manual import, restore, Cloud Pull |
| Screen | Mobile Koçluk, next targets, Phoenix/weekly coaching, Weekly |
| Current escaping | Dynamic exercise/focus/activity strings are inserted directly into HTML. Most recommendation sentences and numeric risk fields are internally generated. |
| Exploitability | **Direct/high confidence.** A stored exercise or category renders in coaching even if the user does not reopen the edit form. |
| Minimal remediation | Escape text at the renderer boundary; preserve generated markup only for developer-controlled labels. Use enum mapping for risk/status CSS classes. |

### A7. PR, analytics, and Raw Performance renderers

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `renderProgressMotivation()` 7262–7276; `renderReports()` 7278–7325; `renderRight()` 6340–6378 |
| Fields | exercise name, body part, PR text derived from exercise/session |
| Origin | Gym/import/restore/Cloud Pull |
| Screen | Logger Raw Performance, monthly/progress/coaching areas that consume the base report DOM |
| Current escaping | Exercise/body-part keys are unescaped. Numeric PR text is generated, but it is concatenated with the unescaped exercise. |
| Exploitability | **Direct/high confidence.** These functions are called by the broad base render and can parse the payload even when a newer desktop surface is visually dominant. |
| Minimal remediation | Reuse the centralized text encoder for report fragments, or create each PR row with text nodes. |

### A8. Readiness/activity text in base panels

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `renderReadinessHtml()` / `renderReadinessPanel()`, approximately 6961–6975 |
| Fields | workout/activity type/source; readiness advice if supplied by a future external resolver |
| Origin | Apple/Polar imports, full restore, source-policy output |
| Screen | shared readiness/coaching panels |
| Current escaping | `typeText`, advice, status, and reasons are inserted directly. Current advice/reasons are mostly generated enums, but type/source can be external. |
| Exploitability | **Direct for imported type/source; conditional for internally generated advice.** |
| Minimal remediation | Escape type/source text. Treat readiness status as a validated enum. Keep generated numeric/style values clamped. |

### A9. Universal Import completion summary

| Item | Detail |
|---|---|
| Source | `index.html` |
| Function/range | `setImportSummary()` / `summarizeImport()`, approximately 8014–8054 |
| Fields | newly imported exercise names, activity type, duration, imported source label |
| Origin | pasted Universal Import JSON |
| Screen | Data Center immediately after import |
| Current escaping | Summary fragments are joined and assigned directly to `innerHTML`; no escaping is applied to the imported strings. |
| Exploitability | **Immediate/high confidence.** The payload can execute directly after the user clicks Universal Import, before they navigate to another screen. |
| Minimal remediation | Build summary pills as elements with `textContent`, or escape every external field before forming the summary. Keep bold/count markup developer-controlled. |

### A10. Polar Workout session selector inline JavaScript context

| Item | Detail |
|---|---|
| Source | `polar-workout.js` |
| Function/range | `workoutSelectorHtml()`, approximately 76; normalization/import approximately 86–129 |
| Fields | `startTime`, used as the workout key |
| Origin | manual Polar workout import, AccessLink sync, full restore, Cloud Pull |
| Screen | Polar Workout when a day contains multiple sessions |
| Current escaping | Visible type/time uses `esc()`. The key also uses `esc()` but is embedded inside quoted JavaScript in `onclick`; HTML escaping is not a JavaScript-context guarantee. |
| Exploitability | **Click-triggered/high confidence for manual or restored malicious data.** |
| Minimal remediation | Replace the inline handler with a delegated listener and assign the key through a DOM property or safely encoded dataset. Validate time format independently; do not rely on validation alone for rendering safety. |

### A11. Premium Home Polar activity inline JavaScript context

| Item | Detail |
|---|---|
| Source | `premium-standard.js` |
| Function/range | `activityCard()`, approximately 86–92 |
| Fields | Polar activity `date` and `startTime` |
| Origin | AccessLink, manual Polar import, restore, Cloud Pull |
| Screen | Mobile and desktop Home activity card |
| Current escaping | All visible text is escaped. Date/start time are escaped as HTML but placed inside inline JavaScript arguments. |
| Exploitability | **Click-triggered.** Manual Polar import currently accepts non-empty date/start-time strings without enforcing their formats. |
| Minimal remediation | Use a normal event listener with element dataset/property values. Enforce ISO date and time formats in the import validator as defense in depth. |

### A12. Program/status classes and styles derived from data

| Item | Detail |
|---|---|
| Source | primarily `index.html`; some premium/desktop helpers |
| Function/range | readiness/coaching/report template ranges above |
| Fields | status/tone/class names and style percentages |
| Origin | mostly internal calculations; potentially malformed full restore values |
| Screen | Home, Coaching, Program, reports |
| Current escaping | Inconsistent. Newer helpers clamp numbers and map classes; older base templates concatenate values. |
| Exploitability | **Lower than text sinks but real if an unvalidated restore supplies arbitrary strings to a class/style path.** CSS injection is constrained by modern parsing but should not be accepted as a security boundary. |
| Minimal remediation | Map class names from fixed enums and clamp numeric style values. Never pass arbitrary imported class/style text through an HTML encoder and assume it is validated. |

## 4. B — Active paths that are currently safe

These active HTML-generating paths already apply an appropriate text boundary for
the examined fields. They should receive regression tests, not blind rewrites.

| Source/function | Input | Why currently safe | Residual action |
|---|---|---|---|
| `index.html` `renderGymMode()` 6667–6728 | exercise/body-part/program override fields | `gymSafe()` is applied to text and attribute values; numeric set rows are normalized | Keep; add malicious-name regression. Prefer event listeners in future, but current handler keys are generated IDs. |
| `index.html` `renderSingleActivityCard()` 6856–6883 | activity name, source, note, stat values | `escapeAttr()` covers visible/attribute values; handler arguments are produced with `JSON.stringify` and placed in a single-quoted attribute | Test both quote types. Moving to delegated events would eliminate mixed-context complexity. |
| `index.html` monthly renderer 9120–9174 | top exercise/body part | `esc2()` applied | Keep and test. |
| `index.html` Program Intelligence 9406–9469 | focus/body part and generated verdict | `esc()` applied; numeric fields generated | Keep and test. |
| `index.html` Data Health result 9529–9584 | issue strings containing record fields | issues are escaped before joining | Keep and test. |
| `index.html` Smart Progression 9886–10009 | exercise/target strings | `esc()` applied before insertion | Keep and test. |
| `premium-standard.js` Home content helpers except `activityCard` handler | program/activity/source/coach text | visible fields pass through private `esc()` | Retain; fix only the dynamic event context and `cleanCoaching()` reparsing. |
| `desktop-alignment.js` main renderers | exercise, notes, targets, Polar labels | private `esc()`/`value()` applied consistently; dates used in handlers are generated week values and indices/enums are internal | Regression-test; no broad rewrite. |
| `polar-workout.js` visible metric/detail renderers | Polar name/device/source/notes/load/zone data | private `esc()` used | Fix only session-key event context and validate imported date/time. |
| `polar-accesslink.js` `cardHtml()` 127–142 | server status/error/category values | all external text uses `esc()`; handlers are static | No Patch A source change expected unless tests expose a missed field. |
| Active Polar Bridge renderers 15518–15748 | Bridge device/source/workout/notes | private `esc()` is used for visible imported values; styles are clamped | Retain; input/prototype validation belongs to Patch B. |
| `simurg-cloud-auth.js` UI updates | email/status/errors | uses `textContent`; email is masked; error length is capped | No Patch A change. |

One active operation deserves a small correction even though it does not introduce
new attacker text: `premium-standard.js cleanCoaching()` (approximately 269–275)
reads and reassigns `node.innerHTML` merely to add sentence spacing. Reassigning
existing HTML causes another parse. It should operate on text nodes, not HTML.

## 5. C — Static/developer-controlled HTML

The following uses of HTML strings do not incorporate runtime user/external values:

- current mobile Menu and bottom navigation construction in `index.html`
- static empty states
- static Data Center card shells
- static report copy bars whose handler names are internal constants
- static alert sheet shell
- static Gym “add set” row
- canonical desktop nav button definitions
- fixed Home tab enums and fixed Polar tab enums

These should not be converted mechanically. A narrow test can assert that any
dynamic handler-producing helper accepts only a fixed internal enum.

## 6. D — Legacy or unreachable paths

### Disabled template archives

HTML sinks inside these ranges are not executable:

- `simurgLegacyHomeRecoveryArchive`, approximately 4730–5582
- `simurgLegacyWhoopMobileArchive`, approximately 10738–11482
- `simurgLegacyPremiumShellArchive`, approximately 11483–13430
- `simurgLegacyVisualSystemArchive`, approximately 13432–14286

They should remain unchanged in Patch A. Editing them would increase diff size
without reducing current exploitability.

### Unloaded external copies

`script.js`, `all_scripts.js`, and numbered `script_*.js` files are not referenced
by active `index.html`. Their sinks are legacy/unreachable in the current runtime.
They should not be remediated in these two patches; a future removal/archive decision
requires a separate task.

### Hidden legacy import panels

The dedicated workout and Apple Watch textareas/cards are hidden. Their functions
remain callable and are still wrapped by some active enhancements. Patch B should
either route them through the same validation boundary or explicitly leave them
unreachable; it must not silently maintain an unsafe callable bypass.

## 7. Exact JSON restore/import map

### 7.1 General JSON backup restore

| Stage | Current behavior |
|---|---|
| Entry | Data Center “JSON İçe Aktar” opens hidden `#importFile`; `onchange="importJSON(event)"` |
| Source | `index.html`, `importJSON()`, approximately 7493–7499 |
| File handling | First selected file is read completely with `FileReader.readAsText()` |
| Parse | Raw `JSON.parse(r.result)` in `FileReader.onload` |
| Accepted root | Anything JSON can parse: object, array, `null`, scalar |
| Required fields | None |
| Validation | None |
| Migration/default filling | None |
| Assignment | Direct `DATA = parsedValue` |
| Persistence | Calls active `save()`, serializing the complete value to `atlas_summary_reports` |
| Render | `save()` invalidates signals and invokes broad base/premium/desktop rendering |
| Unknown fields | Preserved wholesale |
| Pre-mutation backup | None |
| Rollback | None |
| Error behavior | No local `try/catch` in the async `onload`; parse/render errors can be unhandled after selection |
| Cloud effect | Does not write auth or revision localStorage keys directly. The resulting payload can later be explicitly pushed to the authenticated user's row. |

**Exact weakness:** an arbitrary JSON root is assigned to the live global before any
shape, prototype-key, size, depth, or field validation. The normal save/render path
then makes the replacement durable and begins dereferencing expected collections.

### 7.2 Startup localStorage restore

`index.html` initializes `DATA` with one `JSON.parse()` of
`atlas_summary_reports`, otherwise `INITIAL`. It fills only a small set of missing
legacy collections (`appleWatch`, notes, and program objects).

- Existing localStorage correctly takes priority.
- A malformed JSON string can prevent startup.
- A valid but wrong-shaped root can fail later renderers.
- No migration registry or full validation runs.

Patch B should preserve localStorage priority. To minimize compatibility risk, the
first remediation should validate imports before they are persisted; startup
quarantine/recovery UI can be a separate follow-up unless tests prove it is required
for safe rollback.

### 7.3 Universal Import — workout

| Property | Current behavior |
|---|---|
| Entry | Pasted `#universalJsonBox`, `universalImport()` |
| Active base | final inline Universal Import override around 7774–7810, with later wrappers |
| Accepted root | array; object with `workouts`/`items`; workout/strength kind |
| Required | non-empty workout array; each row requires `date`; missing exercise defaults to `Exercise` |
| Normalization | day/body part defaults; `sets/reps/weight` converted to numbers; notes default string |
| Unknown fields | Retained on each row because normalization mutates/returns the original object |
| Mutation | Appends into `DATA.workouts`, with heuristic duplicate detection |
| Backup | Undo wrapper clones pre-import data but stores the snapshot only after the mutation and only if counted collection lengths changed |
| Corruption risk | Invalid objects can partially mutate before a later row throws; arbitrary strings remain in exercise/body-part/notes/date |

### 7.4 Universal Import — Apple Health / legacy Apple Watch

| Property | Current behavior |
|---|---|
| Accepted root | one watch/activity object, array recognized as activities, wrapper objects under `appleWatch`, `watch`, or `activities`, segmented object |
| Required | date |
| Normalization | type/aliases, numeric energy/HR/distance, duration, RPE, notes |
| Unknown fields | Retained through object spread and record normalization |
| Mutation | Appends/dedupes in `DATA.appleWatch` |
| Backup | Same delayed/conditional Universal Import undo behavior |
| Risk | Arbitrary activity/duration/notes/source strings remain; nested objects and prototype keys are not rejected before spreads |

The older direct `importWatchJson()` path is hidden but callable. It is summarized
by a wrapper but does not receive the Universal Import undo snapshot.

### 7.5 Universal Import — daily and weekly notes

| Route | Accepted root | Required/current validation | Mutation |
|---|---|---|---|
| Daily | kind `daily`, or presence of coach/readiness/energy-like fields | date only | Original object appended to `DATA.dailyNotes` |
| Weekly | kind `weekly`, or weekly/Phoenix marker | no strong required field | Original object appended to `DATA.weeklyNotes` |

Unknown nested fields and arbitrary strings are preserved. These objects can feed
coaching text. There is no dedicated daily-file importer; desktop Daily JSON export
can later be pasted into Universal Import if its markers match.

### 7.6 Manual Polar Workout import

| Stage | Current behavior |
|---|---|
| Owner | outer wrapper in `polar-workout.js`, approximately 322–348 |
| Detection | non-array with type `polar_flow_workout` or source `Polar Flow` |
| Validation | date must be non-empty; numeric fields are coerced; no ISO date/time validation |
| Shape handling | zones, zone summary, fuel, impact, HR series are shallow-copied |
| Mutation | dedupe/update by date + start time in `DATA.polarWorkouts.daily`; update latest |
| Backup | None: outer Polar wrapper handles and returns before the underlying Universal Import undo wrapper |
| Unknown fields | Top-level reduced by normalization; arbitrary nested keys survive in copied zone/fuel/impact objects |
| Risk | Prototype keys can reach `Object.assign`; malicious start time reaches an inline-handler context |

### 7.7 Manual Polar Recovery import

| Stage | Current behavior |
|---|---|
| Owner | active inline wrapper approximately 10304–10334 |
| Detection | recovery/Polar kind or presence of nightly/HRV/resting-HR fields |
| Validation | non-empty date; numbers coerced |
| Mutation | writes `DATA.recoveryEntries[date]` and selects date |
| Backup | None: this outer wrapper intercepts before the Universal Import undo wrapper |
| Unknown fields | Mostly reduced to selected normalized fields; notes/source remain arbitrary strings |
| Risk | Date is used as an object key without format/protected-key validation; no pre-mutation backup |

The sample button only fills the textarea with the explicit synthetic 2099 fixture.
It does not import automatically.

### 7.8 Polar Bridge / Shortcut and test payload

| Entry | Behavior |
|---|---|
| Programmatic | `window.simurgReceivePolarBridge(payload)` |
| Explicit test | `simurgSavePolarBridgeTestPayload()` parses textarea JSON or uses the synthetic fixture |
| Parsing | Accepts object or string; string parse falls back to `{raw: string}` |
| Unwrap | Accepts `payload`, `data`, `health`, and `summary` wrappers using object composition |
| Validation | Field-by-field loose normalization; absent/invalid date can fall back to today |
| Mutation | writes one normalized entry under `DATA.polarBridge.daily[date]` and persists |
| Backup | None |
| Risk | Prototype keys are not rejected before object composition. Visible bridge fields are escaped, but the stored structure joins the shared payload and cloud export. |

### 7.9 Polar AccessLink sync

The browser parses server JSON with `response.json()`. `mergeSync()` then:

- copies workouts into `polarWorkouts.daily`
- copies activity into `polarActivity.daily`
- shallow-merges profile and daily health categories
- updates connection/status metadata
- persists through the normal save path

There is no client-side schema validator beyond arrays/date presence and numeric
count normalization. The response is expected from the controlled Edge Function,
so this is a lower-likelihood boundary than a pasted backup. Patch B must not alter
OAuth/token logic. It may reuse non-mutating record validation for normalized sync
payloads only if compatibility tests cover real fixtures; otherwise this remains a
separately scheduled defense-in-depth item.

### 7.10 Cloud Pull

| Stage | Current behavior |
|---|---|
| Owner | `simurg-cloud-auth.js` `pullUserData()`, approximately 284–312 |
| Source | authenticated user's `simurg_user_data.payload` |
| Validation | root must be a plain object |
| Default filling | six collections/objects are repaired by `normalizePulledData()` |
| User control | explicit confirmation |
| Backup | full local JSON download before replacement |
| Assignment | `persistPulledData()` assigns complete `DATA` and calls `save()` |
| Rollback | catches persist/render failure, restores previous global and raw localStorage string, renders again |
| Unknown fields | preserved wholesale |
| Cloud metadata | revision metadata is a separate per-user localStorage key and is written only after successful persist |

Cloud Pull is materially safer than file restore, but a malicious or historically
corrupted plain object still passes. The current normalizer also mutates the pulled
object before the atomic persist attempt.

### 7.11 Undo Import

The Universal Import wrapper clones the pre-import `DATA`. If counted collection
lengths change, it stores the clone in `simurg_last_import_snapshot_v1` after the
import. Undo later parses that snapshot and assigns its `data` root directly, fills
six defaults, writes localStorage, invalidates, and renders.

Limitations:

- snapshot durability happens after mutation
- only count changes trigger it; an in-place update/dedupe replacement may not
- outer Polar wrappers bypass it
- undo payload receives no validation

It is useful recovery behavior but not a reliable transaction boundary.

## 8. Can imports overwrite cloud/auth metadata?

Today:

- General restore and imports write the main `DATA` key, not Supabase's session key.
- They do not directly overwrite `simurg_cloud_meta:<user-id>`.
- They do not directly overwrite the Polar capability key.
- An imported object can introduce misleading `auth`, `session`, `cloud`, or
  revision-like properties inside `DATA`.
- The complete resulting object is eligible for an explicit Cloud Push.
- Stored XSS can read and manipulate the actual separate metadata/session keys.

Patch B must explicitly prevent import/restore code from writing or accepting
protected auth/cloud namespaces as application payload controls. Cloud revision
metadata must remain owned only by `simurg-cloud-auth.js`, outside `DATA`.

## 9. Selected schema strategy: hybrid

### 9.1 Why not a strict top-level allowlist?

A strict allowlist is attractive but unsafe for compatibility in this repository:

- older real backups contain lazily introduced namespaces
- Polar stores have evolved and retain partial/unknown legitimate fields
- `customGymPrograms`, notes, target stores, and imported records have variant shapes
- silently dropping an unknown Polar field can destroy history

### 9.2 Why not fully permissive validation?

A root-object check plus recursive “JSON-like” validation does not protect:

- prototype-pollution keys
- wrong critical namespace types
- dangerous size/depth
- authentication/cloud metadata impersonation
- invalid dates/numbers used by renderers and inline styles

### 9.3 Chosen model

Use a **hybrid schema**:

1. Strictly validate critical known namespaces and security-sensitive fields.
2. Preserve unknown legitimate fields after recursive safety validation.
3. Reject, rather than silently strip, prohibited prototype/security keys.
4. Migrate a cloned candidate; never mutate the parsed object or live `DATA`.
5. Commit only after the complete candidate passes validation.

This provides compatibility without treating every arbitrary object as valid.

## 10. Validation contract

### 10.1 Parse and structural limits

Recommended initial limits, to be confirmed against representative private backups
before implementation:

- maximum input file/text size: 25 MiB
- maximum nesting depth: 32
- maximum traversed nodes: 250,000
- maximum object keys at one level: 25,000
- maximum array length: 100,000
- maximum individual string: 256 KiB

The validator should fail with a path-aware, user-safe error before any mutation.
Thresholds should be constants with tests, not scattered magic numbers.

### 10.2 Prototype-pollution protection

Reject these keys at every depth:

- `__proto__`
- `prototype`
- `constructor`

The scan must happen immediately after parsing and before:

- object spread
- `Object.assign`
- migration/default filling
- dedupe/indexing
- renderer access

### 10.3 Plain-object and array rules

- Backup root must be a plain object.
- Known collection namespaces must be arrays.
- Known map/store namespaces must be plain objects.
- `daily` stores must be plain objects keyed by valid ISO dates.
- A date bucket may hold the legacy single record or current array where the
  runtime already supports both.
- Records must be plain objects, never arrays/functions/class instances.
- Unknown values must still be JSON primitives, arrays, or plain objects within
  limits.

### 10.4 Critical top-level namespaces

Strict shape validation should cover at least:

| Namespace | Expected core shape |
|---|---|
| `schemaVersion` | positive integer when present; missing means legacy |
| `workouts` | array of plain workout records |
| `metrics` | array of dated plain records |
| `nutrition` | array of dated plain records |
| `recovery` | array of dated plain records |
| `appleWatch` | array of plain activity records |
| `dailyNotes` | array of dated plain records |
| `weeklyNotes` | array of plain records |
| `customGymPrograms` | plain object; date/day entries are plain objects/legacy arrays |
| `programNames` | plain object with bounded string values |
| `activityNotes` | plain object with bounded string values |
| `autoNextTargets` | plain object of target records |
| `recoveryEntries` | ISO-date-keyed plain object |
| `polarWorkouts` | `{daily: plain object, latest: null/object}` |
| `polarActivity` | `{daily: plain object, latest: null/object}` |
| `polarProfile` | `{latest: null/object}` plus safe unknown metadata |
| `polarSleep` | daily/latest/sync metadata store |
| `polarNightlyRecharge` | daily/latest/sync metadata store |
| `polarContinuousHr` | daily/latest/sync metadata store |
| `polarCardioLoad` | daily/latest/sync metadata store |
| `polarConnection` | plain connection/status/count metadata object |
| `polarBridge` | `{source: string, lastSync: string, daily: plain object}` |
| `_meta` | application-owned local metadata only |

### 10.5 Field rules

#### Dates

- Stored day/date keys: valid `YYYY-MM-DD` and real calendar date.
- Date-time fields: bounded ISO-compatible string or empty/null where currently
  allowed.
- Start time: validated `HH:MM`, `HH:MM:SS`, or existing ISO time/date-time forms.
- Legacy unparseable dates should cause a validation error with path, not be
  silently rewritten to today.

#### Numbers

- Must be finite; reject `NaN`/infinity-like strings after parsing/coercion.
- Non-negative for duration, calories, HR, reps, sets, weight, distance, and load
  unless a documented field uses another range.
- RPE: null/empty or 1–10.
- Percentages/scores: null/empty or reasonable domain range.
- Heart rate and sleep/load values should use broad compatibility bounds; implausible
  values can warn, while structurally dangerous values fail.

#### Strings

- Bounded length.
- Remain text; HTML is not stripped or rewritten because output encoding is the
  correct XSS control.
- Preserve Turkish characters, punctuation, quotes, ampersands, and angle brackets
  as literal data.

#### Booleans

- Real JSON booleans for connection/fixture/synthetic flags.
- Do not coerce arbitrary strings such as `"false"` to true.

#### Arrays

- Validate each item with a path and item schema.
- Heart-rate series can use a dedicated numeric/point schema and larger permitted
  length.
- Preserve multi-workout-per-day arrays.

### 10.6 Protected namespaces

Reject backup/import roots or unknown branches attempting to act as:

- Supabase auth/session state
- service-role/private credentials
- browser cloud revision metadata
- Polar device capability credentials
- localStorage key/value instructions

Examples of reserved root/control names include `auth`, `session`, `supabase`,
`cloudAuth`, `cloudSession`, `simurg_cloud_meta`, and
`simurg_polar_accesslink_client_v1`.

This protection must not reject legitimate display metadata such as
`polarConnection.tokenExpiresAt`. The rule should target application-control
namespaces, not every field containing the word “token”.

`_meta` should use a small allowed sub-schema for application data metadata. Cloud
revision remains exclusively in `simurg_cloud_meta:<user-id>`.

### 10.7 Unknown-field behavior

- Unknown top-level or nested fields are preserved only after the recursive safety
  scan and limits.
- Unknown fields never gain execution, localStorage, routing, or cloud-control
  semantics.
- Validator returns warnings for unknown namespaces so the user can see that a
  compatible extension was preserved.
- No unknown field is silently deleted from Polar history.

### 10.8 Migration behavior

Use ordered, pure migrations on a deep-cloned validated candidate:

1. Interpret missing `schemaVersion` as the oldest supported backup.
2. Add missing stable collections from `INITIAL`.
3. Convert only documented legacy shapes, such as single Polar day record versus
   array, when required by current readers.
4. Preserve legitimate unknown fields.
5. Set the current schema version only after successful migration.
6. Revalidate the migrated result.

Migrations must not call `save()`, render, localStorage, cloud, or network.

### 10.9 Atomic restore transaction

For full restore:

1. Check `File.size` before reading.
2. Parse with protected-key detection.
3. Validate and migrate a detached candidate.
4. Present warnings/confirmation.
5. Download a pre-import backup of current `DATA`.
6. Retain `previousData` and the previous localStorage string in memory.
7. Assign the validated candidate once.
8. Persist once.
9. Render once.
10. On any exception, restore both global and localStorage state and render the
    previous state.

For append-style Universal Import, stage mutations against a deep-cloned candidate,
validate the resulting complete candidate, then commit once. This prevents partial
row imports.

Cloud Pull should use the same full-payload validator and existing backup/rollback
boundary. Its revision metadata must be updated only after successful commit, as it
is today.

## 11. Patch A — Centralized safe text rendering / XSS remediation

### 11.1 Goal

Close confirmed active render sinks without redesigning screens or converting every
static HTML template.

### 11.2 Expected files

| File | Planned change |
|---|---|
| `index.html` | Load the shared safe-render helper; repair active base Logger/report/modal/import-summary sinks and dynamic user-derived handlers only |
| new `simurg-safe-dom.js` | Small browser/Node-compatible helpers for text encoding, DOM text/value assignment, safe dataset/property assignment, enum/class selection |
| `premium-standard.js` | Remove user-derived inline handler arguments from `activityCard()`; make `cleanCoaching()` operate on text nodes |
| `polar-workout.js` | Replace session-key inline handler with delegated event handling/data property |
| `tests/xss-rendering.test.js` | Sink/helper and hostile-fixture tests |
| `tests/runtime-contracts.test.js` and/or `tests/html-syntax.test.js` | Assert canonical handlers/load order and no regression in active scripts |
| `tests/run-tests.js` | Include the new test |
| `sw.js` | Add/version new active asset and bump cache identity once |

`desktop-alignment.js`, `polar-accesslink.js`, `simurg-cloud-auth.js`, Supabase
migrations, and Edge Functions are not expected to change in Patch A unless a test
demonstrates a concrete missed active sink.

### 11.3 Exact active functions expected to change

In `index.html`:

- `renderProgramDays`
- `renderWorkout`
- `exCard`
- `renderRight`
- `renderReadinessHtml`
- `renderDailyReport`
- `renderWeeklyReport`
- `renderProgressMotivation`
- `renderReports`
- active `renderCoachPanels`
- active `renderPhoenixReport`
- `openEditExercise`
- `openEditSet`
- `setImportSummary` / `summarizeImport`

Only external/user-controlled interpolations should change. Developer-owned static
HTML and layout remain intact.

### 11.4 Event strategy

For user-derived identity:

- stop generating JavaScript source strings
- bind one listener to a stable container
- read safe properties/dataset values
- look up the current record/session by validated identity

This applies to:

- exercise edit/add-set actions
- premium Home Polar activity open
- Polar Workout session selection

Fixed static navigation handlers can remain for this patch.

### 11.5 Automated tests

Each field must be rendered with:

- harmless HTML tags
- SVG/onload payload
- image/onerror payload
- single and double quotes
- angle brackets and ampersands
- normal Turkish text

Assertions:

- no executable element/event attribute appears
- visible text equals the original literal value
- clicks still select the correct exercise/session
- classes/styles come only from allowed enums/numbers
- safe existing renderers remain unchanged

### 11.6 Manual mobile tests

- Gym custom exercise/body-part edit and save
- Günlük group cards, exercise edit modal, add set
- Daily/Weekly/Program/Coaching reports with hostile literal text
- Universal Import summary
- Home latest Polar activity card
- Polar Workout multi-session picker
- bottom navigation and Polar detail exit
- Turkish exercise/program/note text

### 11.7 Manual desktop tests

- Antrenman Günlüğü groups, right rail, Raw Performance
- Home Polar activity card
- Daily/Weekly/Monthly/Program/Coaching render
- Data Center import summary
- keyboard activation of converted event controls
- no horizontal overflow at supported desktop widths

### 11.8 Compatibility and rollback

- No stored data transformation.
- No field deletion.
- Main risk is event wiring or literal-text display differences.
- Roll back the entire Patch A commit if a navigation/edit action regresses; no data
  rollback is needed because the patch changes rendering only.
- Keep one cache identity for Patch A so old HTML cannot load mismatched helpers.

### 11.9 Infrastructure impact

- Service-worker cache bump: **required** because active JS and `index.html` change.
- `CORE_ASSETS` and query versions must match.
- Supabase/Edge Function change: **none**.
- Polar OAuth/token change: **none**.

## 12. Patch B — Validated JSON restore pipeline

### 12.1 Goal

Create one tested parse/validate/migrate/commit boundary for complete restores and
route-aware validation for append imports, while preserving real backups and current
cloud revision behavior.

### 12.2 Expected files

| File | Planned change |
|---|---|
| new `simurg-data-validation.js` | Pure parser, protected-key scanner, limits, hybrid schemas, migration registry, candidate validation, structured errors/warnings |
| `index.html` | Load validator; replace unsafe `importJSON`; route Universal Import, hidden direct imports, Polar Recovery, Bridge test input, and undo restore through validation/staging |
| `polar-workout.js` | Validate manual Polar Workout objects before normalization/`Object.assign`; stage before persist |
| `simurg-cloud-auth.js` | Replace shallow `normalizePulledData()` with shared full validation/migration on a clone; keep confirmation, backup, rollback, and revision order |
| `tests/data-validation.test.js` | Schema, migration, limits, pollution, compatibility, atomic failure tests |
| `tests/cloud-auth.test.js` | Confirm Pull validation happens before assignment and revision metadata remains unchanged on failure |
| `tests/runtime-contracts.test.js` | Confirm localStorage-first startup and explicit Push/Pull behavior remain |
| `tests/run-tests.js` | Include the new test |
| `sw.js` | Cache/version update for new module and changed active assets |

`polar-accesslink.js` is not expected to change in the first Patch B. Its normalized
live response boundary should be covered by fixture tests and considered for a
separate defense-in-depth patch after real AccessLink compatibility is confirmed.

No Supabase migration or Edge Function change is required.

### 12.3 Functions expected to change

In `index.html`:

- `importJSON`
- `importWorkoutJson`
- `importWatchJson`
- `normalizeWorkoutRow` / `importWorkoutArray`
- active `importAppleWatch`
- active `universalImport` route
- Undo Import snapshot/restore boundary
- `importPolarRecovery` and its Universal Import wrapper
- `simurgSavePolarBridgeTestPayload`
- `simurgReceivePolarBridge` staging boundary if programmatic payloads remain supported

In `polar-workout.js`:

- `normalizeWorkout`
- `importPolarWorkout`
- Universal Import wrapper

In `simurg-cloud-auth.js`:

- replace `normalizePulledData`
- preserve `downloadLocalBackup`
- retain/improve `persistPulledData` rollback
- keep `pullUserData` revision write strictly after successful persist

### 12.4 Backup and rollback

- Full file restore: real downloaded pre-import backup before assignment.
- Universal append import: in-memory candidate plus durable pre-import snapshot before
  commit; snapshot should not depend only on collection count.
- Polar manual imports: same staged candidate/snapshot; no wrapper bypass.
- Cloud Pull: keep the existing downloaded backup and rollback behavior.
- Failed validation: no `DATA`, selected date, localStorage, cloud metadata, or render
  mutation.

### 12.5 Data compatibility risks

- Old backups may omit `schemaVersion`.
- Existing Polar day buckets may be one object or an array.
- Real historical notes/program objects may contain unknown fields.
- Some legacy numbers may be numeric strings.
- Existing dates may be malformed but currently tolerated.

Mitigation:

- test representative redacted real backup shapes
- distinguish migration warnings from hard security errors
- preserve safe unknown fields
- report exact invalid paths
- never silently delete Polar history
- allow documented numeric-string migration only in known numeric fields

### 12.6 Manual mobile tests

- current backup restore
- oldest supported backup restore
- failed restore while each mobile screen is open
- Universal workout/activity/daily/weekly import
- Polar Workout and Polar Recovery import
- Bridge synthetic fixture
- Gym edit after restore
- Home/Logger/Polar/Coaching data visibility
- app restart and localStorage priority
- Cloud Push/Pull after a validated restore

### 12.7 Manual desktop tests

- restore from Data Center
- desktop Home historical date navigation after restore
- Logger grouped records and right rail
- Daily/Weekly/Monthly/Program/Coaching reports
- Polar multi-session history
- failed restore preserving the previously visible desktop report
- Cloud conflict after local validated restore

### 12.8 Infrastructure impact

- Service-worker cache bump: **required**.
- `index.html` query versions and `CORE_ASSETS` must be identical.
- Supabase schema/RLS change: **none**.
- Edge Function change: **none**.
- Cloud revision/conflict algorithm: **unchanged**.
- Polar OAuth/token logic: **unchanged**.

## 13. Concrete test matrix

### 13.1 XSS matrix

| Case | Entry field/source | Required assertion | Screens |
|---|---|---|---|
| Exercise name | Gym edit, Universal Import, full restore, Cloud Pull | Literal text only; edit/add-set clicks still resolve correct record | Gym, mobile/desktop Logger, reports, Coaching |
| Program/day name | Program editor, restore, Pull | Literal text; no new element/attribute | Gym day cards, Home plan, Weekly |
| Body part | Gym editor/import/restore | Literal label and tooltip; allowed class only | Logger muscle volume, Raw Performance |
| Workout note | Edit/import/restore | Input `.value` round trips; no attribute breakout | Edit modal, desktop note/target |
| Imported backup text | General restore | No script/event execution anywhere after broad render | All active screens |
| Cloud-pulled text | Authenticated test row | Same literal rendering; revision metadata valid | All active screens |
| Polar workout type/device/source | Manual import fixture | Literal values; detail and Home card still clickable | Home, Polar Workout, desktop Polar |
| Polar start time | Manual multi-session fixture | Session selection works without inline JS injection | Polar Workout |
| Activity type/duration | Apple Health Universal Import | Literal summary/card text | Data Center, Logger, Daily |
| HTML tag | representative fields | Tag displayed as text, not element | All relevant |
| SVG/onload | representative fields | No SVG node/event execution | All relevant |
| IMG/onerror | representative fields | No image node/event execution | All relevant |
| Quotes/angle brackets | representative fields | Exact round-trip text; no broken attributes | Modals, cards, buttons |
| Turkish characters | `Ç, Ğ, İ, ı, Ö, Ş, Ü`, punctuation | Exact visible text and edit round trip | Gym, Logger, reports |
| Safe static buttons | internal navigation | Behavior unchanged | Mobile nav/Menu, desktop sidebar |
| Keyboard use | converted dynamic controls | Enter/Space action works; focus visible | Home Polar card, session picker, exercise controls |

Use a test sentinel that records attempted execution; never use network exfiltration
in tests.

### 13.2 JSON restore/import matrix

| Case | Expected result | State guarantee |
|---|---|---|
| Valid current backup | Accepted without data loss | All known and safe unknown fields preserved |
| Valid older backup | Migrated with explicit warnings | Stable defaults added; history preserved |
| Malformed JSON | Rejected with readable error | `DATA`, localStorage, selected date unchanged |
| Array root | Rejected for full restore | Unchanged |
| `null` root | Rejected | Unchanged |
| Scalar root | Rejected | Unchanged |
| Deeply nested object | Rejected at configured limit/path | Unchanged |
| Oversized file/text | Rejected before full parse/read where possible | Unchanged |
| `__proto__` key | Rejected at any depth | No prototype change; unchanged |
| `prototype` key | Rejected at any depth | Unchanged |
| `constructor` key | Rejected at any depth | Unchanged |
| Wrong `workouts` type | Rejected | Unchanged |
| Wrong Polar store type | Rejected | Unchanged |
| Missing stable fields | Migrated/defaulted if supported | Existing unrelated fields preserved |
| Unknown safe top-level field | Preserved with warning | Round trip through export/cloud |
| Unknown safe Polar field | Preserved | No Polar-history deletion |
| Invalid calendar date | Rejected with path | No fallback to today |
| Numeric strings in documented legacy fields | Migrated if compatible | Stored as canonical finite number |
| Negative/overflow critical metrics | Rejected or warned per field policy | No unsafe style/calculation input |
| Corrupt workout row midway through array | Whole import rejected | No partial rows appended |
| Corrupt Polar day among valid days | Whole restore rejected | Existing Polar history unchanged |
| Multi-workout Polar day | Accepted | All sessions and selected-history behavior retained |
| Manual Polar Workout import | Accepted only after route schema | Pre-import snapshot exists |
| Manual Polar Recovery import | Accepted only after route schema | Pre-import snapshot exists |
| Apple segmented activity | Accepted and normalized | No partial segment commit |
| Daily/weekly note import | Accepted with bounded strings/valid dates | Correct collection only |
| Synthetic Bridge fixture | Accepted only on explicit action | Markers/date preserved; no startup insertion |
| Failed Bridge test input | Rejected | Existing bridge day unchanged |
| Restore then Cloud Push | Explicit Push works | Expected revision behavior unchanged |
| Restore then Cloud Pull | Existing confirm/backup/rollback works | Revision stored only after success |
| Stale-revision Push | Conflict remains blocked | No silent overwrite |
| Failed Cloud Pull validation | Error shown | Original `DATA`, localStorage, revision metadata unchanged |
| App restart after valid restore | LocalStorage remains priority | Validated restored data loads |
| Undo after validated Universal Import | Previous snapshot restored through validator | No unvalidated assignment |

## 14. Patch order and release gates

### Order

1. Patch A: close rendering execution sinks.
2. Manually verify all active mobile/desktop screens with hostile literal fixtures.
3. Patch B: add validated/staged restore and imports.
4. Verify real redacted current and older backups.
5. Verify cloud conflict and Polar manual imports.

Patch A should precede Patch B so that any legacy text successfully preserved by the
compatibility validator cannot execute during the first post-restore render.

### Patch A release gate

- all XSS matrix cases pass
- no user-derived inline JavaScript arguments remain in the identified active paths
- mobile and desktop navigation/edit actions work
- cache/asset versions match

### Patch B release gate

- current and older representative backups pass
- malicious/wrong-shaped fixtures fail before mutation
- full restore always creates a backup
- no partial Universal/Polar import is possible
- Cloud Pull validation failure preserves data and revision metadata
- multi-workout Polar history round trips unchanged

## 15. Supabase, Polar, and UI impact

- Supabase migration/RLS: no change in either patch.
- Cloud table/payload shape: no planned change; validated safe unknown fields remain.
- Cloud revision conflict: unchanged.
- Polar OAuth, callback, token encryption, sync endpoint, and disconnect: unchanged.
- UI design/layout: unchanged.
- Stored user data: Patch A does not mutate it. Patch B migrates only validated
  detached candidates during an explicit import/Pull.
- Legacy files/archives: retained.

## 16. Final planning conclusion

The smallest defensible solution is not a blanket replacement of `innerHTML`.
Current premium, desktop, AccessLink, and most Polar detail renderers already escape
their dynamic text. Patch A should repair only confirmed unsafe fields and remove
the three user-derived inline JavaScript contexts.

For restore safety, the correct fit is a hybrid schema: strict known namespaces and
security controls, recursively safe unknown-field preservation, pure versioned
migrations, and an atomic backup/commit/rollback boundary. This preserves existing
real backups and Polar history while preventing prototype pollution, wrong-root
replacement, partial imports, and cloud metadata interference.

## 17. Patch A implementation result

Patch A was implemented on the `security/xss-hardening` working tree without
changing `DATA`, serialization, calculations, import semantics, Cloud Sync,
Supabase, OAuth, or Polar mapping.

### Confirmed active sinks fixed

- Base Logger exercise/body-part output and edit modal values are encoded before
  entering HTML.
- Exercise edit, set edit, and add-set actions no longer place exercise names in
  inline JavaScript. They use numeric record indexes and delegated click/keyboard
  handlers.
- Program names, activity badges, readiness/risk explanations, Daily/Weekly
  reports, Raw Performance, PR summaries, Coaching targets, Phoenix focus text,
  and import summaries encode externally controlled display strings.
- Daily report navigation no longer embeds imported dates in inline JavaScript.
  It uses an ISO-date `data-report-date` value and a delegated handler.
- Mobile activity Note/Delete controls no longer embed activity type/date strings
  in inline handlers.
- Polar workout session selection uses a validated numeric list index and delegated
  handler. Polar date chips use validated ISO dates.
- Premium Home Polar activity cards use inert `data-*` values and a delegated
  handler instead of an externally influenced inline `onclick`.

### Active sinks intentionally left unchanged

- Static developer-controlled handlers for fixed tabs, navigation buttons, modal
  controls, and fixed program weekday constants remain inline. Their arguments do
  not originate from `DATA`, imports, cloud payloads, or Polar responses.
- Static `innerHTML` templates and already escaped premium/desktop/Polar output
  remain in place to avoid an unrelated renderer rewrite.
- Legacy templates under disabled archive containers were not modified because
  they are not loaded into the active runtime.

### Files changed

- `index.html`
- `polar-workout.js`
- `premium-standard.js`
- `sw.js`
- `tests/xss-rendering.test.js`
- `tests/run-tests.js`
- `docs/CRITICAL_SECURITY_REMEDIATION_PLAN.md`

### Helpers and event handling

- Added a small numeric `safeDataIndex` guard in the base runtime.
- Reused the existing `escapeAttr`/`esc` output helpers.
- Added scoped delegated handlers for Logger record actions, Daily report dates,
  mobile activity actions, Polar dates/sessions, and premium Polar activity cards.

### Patch A.1 residual correction

The initial Patch A review found and corrected four residual active paths:

- Imported custom Gym IDs were still embedded in inline Gym action handlers.
  Gym add-set, save, history, clear, and delete now use escaped inert
  `data-gym-action`/`data-gym-key` attributes and one allowlisted delegated click
  handler on `#gymModeList`.
- Gym History now encodes persisted workout dates before inserting their visible
  labels into HTML.
- Both base and active Daily Summary renderers encode persisted visible dates;
  the existing delegated, validated report-date navigation remains unchanged.
- Data Center local-status timestamps are now assigned with `textContent` through
  created DOM nodes, including invalid timestamp strings returned unchanged by
  the formatter.

The follow-up active date/time scan also encoded imported date labels in report,
coach, PR, snapshot, and import-summary HTML paths. Text-only date assignments and
internally generated fixed navigation dates were left unchanged.

### Patch A.1 verification

- Source-contract tests cover the malicious custom Gym ID, malicious workout
  date, malicious timestamp, normal ISO date, and normal Turkish Unicode text.
  These tests verify encoding and delegated-action structure; they do not by
  themselves prove browser execution safety.
- An isolated browser runtime loaded the hostile fixture through the real JSON
  import UI. The custom key round-tripped through `dataset`, and add-set, save,
  history open/close, clear, delete, and exercise-name editing dispatched through
  the allowlisted Gym handler.
- Daily Summary and Gym History displayed the malicious date as literal text with
  no generated `img`, `svg`, or inline event-handler node. This runtime pass also
  exposed and corrected two active analytics date outputs (`Latest Log` and best
  weight date) that the source-only review had missed.
- The Data Center status grid rendered with created DOM nodes and `textContent`;
  signed-out Cloud actions remained disabled. The hostile timestamp precedence
  cases are covered by source contracts because a real import intentionally
  records a fresh local-update timestamp.
- Mobile 390 × 844 and desktop 1440 × 900 navigation checks reported no
  document-level horizontal overflow. Polar workout open/back, mobile bottom
  navigation, desktop sidebar, Home tabs, and Daily date movement remained
  functional.
- The Patch A.1 index change uses Service Worker build/cache label
  `security-xss-hardening-2`; external Polar and premium asset versions are
  unchanged.

### Tests added

`tests/xss-rendering.test.js` covers the five hostile payloads from the remediation
request plus normal Turkish Unicode text. It verifies escaping round trips, absence
of executable element markup, removal of user-derived inline handlers, and the new
delegated-action contracts.

### Runtime and automated checks

- Active inline and external JavaScript syntax: passed.
- Full automated suite: passed.
- `git diff --check`: passed.
- Mobile browser check at 390 × 844: Home, Logger, Menu, and Data Center opened;
  bottom navigation remained available; no horizontal overflow or captured
  console error was observed. Signed-out Cloud Push/Pull/Check actions remained
  disabled.
- Desktop browser check at 1440 × 900: Home Overview/Recovery/Sleep/Load,
  Workout Logger, and Data Center opened without horizontal overflow or captured
  console errors. Signed-out cloud actions remained disabled.
- Responsive width checks at 861, 880, 900, 901, 1280, and 1440 pixels reported
  zero document-level horizontal overflow.
- Patch A.1 added an isolated hostile JSON import click-through for Gym and
  persisted-date render paths. A broader representative-backup matrix remains a
  manual release check and belongs to the later restore-validation boundary.

### Remaining uncertainty

This patch addresses the confirmed active sinks and source contracts inspected in
the current runtime. It is not a claim that every future renderer or third-party
browser behavior is free of XSS risk. Restore validation remains a separate
defense boundary.

### Patch B status

Patch B has not been implemented. General JSON restore and append-import schema
validation, size/depth limits, prototype-key rejection, migration, backup, atomic
commit, and rollback remain future work.
