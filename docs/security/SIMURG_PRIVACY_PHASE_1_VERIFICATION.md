# Simurg OS Privacy Phase 1 Verification

Use this checklist before any future commit/push and repeat the deployment section after an authorized GitHub Pages release. Do not use real personal data for testing. Do not press Cloud Push or Cloud Pull during this verification.

## 1. Safety preparation

- [ ] Confirm the working branch and review `git status`; do not switch branches for this check.
- [ ] Export or otherwise back up any browser-local Simurg data before testing.
- [ ] Use a separate browser profile/incognito context for the empty-storage test.
- [ ] Disable automatic interaction helpers/extensions that could click Cloud Sync controls.
- [ ] Prepare only an obviously synthetic import record, for example a date in 2099 and a label containing `Synthetic`.

## 2. Fresh browser with empty storage

- [ ] Open DevTools → Application → Local Storage for the application origin.
- [ ] Confirm `atlas_summary_reports` is absent. Do not remove it from a profile that contains real data; use the separate test profile.
- [ ] Load/reload the application.
- [ ] Confirm there is no historical workout, health, recovery, sleep, HRV, Apple, Polar or note content.
- [ ] Confirm no personal date, weight, repetition, exercise note or activity measurement appears.
- [ ] Confirm the page does not automatically create a populated `atlas_summary_reports` value.
- [ ] If a value is created after an explicit local action, confirm it contains only the new empty/synthetic test state.

## 3. Existing browser with local data

- [ ] In the normal profile, confirm `atlas_summary_reports` exists before loading the updated source.
- [ ] Record a non-sensitive count summary only (for example workout-day count), not the underlying records.
- [ ] Load/reload the application without using Cloud Push/Pull.
- [ ] Confirm existing local workouts and reports still appear.
- [ ] Confirm the non-sensitive counts match the pre-load summary.
- [ ] Confirm no automatic reset, replacement or empty INITIAL fallback occurred.
- [ ] Confirm no unexpected Cloud Sync network request occurred.

## 4. Mobile verification

Run near a 390 px viewport in the fresh empty-storage profile.

- [ ] Ana loads without an exception and shows a compact no-data/neutral state.
- [ ] Gym loads its planned program template even though no set records exist.
- [ ] Logger opens and shows a safe empty state rather than sample workout history.
- [ ] Daily, Weekly and Monthly open and show no-data states.
- [ ] Coaching does not present an invented readiness/risk decision as if health data existed.
- [ ] Polar opens and the AccessLink connection card is present.
- [ ] Menü and bottom navigation remain usable.
- [ ] No horizontal overflow, body-scroll lock regression or bottom-navigation obstruction is introduced.

## 5. Desktop verification

Run at representative widths of 1280 and 1728 px in the fresh empty-storage profile.

- [ ] Desktop Home loads without sample workout/health data.
- [ ] Home Overview, Recovery, Sleep and Load use their existing empty-state behavior.
- [ ] Workout Logger shows no embedded historical sessions.
- [ ] Gym displays its program template and accepts no automatic record until the user saves one.
- [ ] Daily, Weekly, Monthly, Program Intelligence and Coaching do not fabricate data-backed results.
- [ ] Data Center remains available and does not automatically invoke Push or Pull.
- [ ] Sidebar and navigation remain functional.

## 6. Polar verification

- [ ] Confirm the Polar AccessLink connection card renders.
- [ ] Confirm Polar Workout/history renders an empty state when the fresh profile has no synced workout.
- [ ] In an existing profile, confirm locally stored Polar data still renders without being cleared.
- [ ] Do not reconnect, disconnect or manually sync solely for this privacy test unless separately authorized.
- [ ] Confirm no access/refresh token appears in page source, local DATA export or DevTools console.

## 7. Universal Import verification

- [ ] Paste an unmistakably synthetic, schema-compatible test record.
- [ ] Confirm Universal Import remains available and processes the synthetic record.
- [ ] Confirm the imported record is the only new record in the fresh profile.
- [ ] Confirm no former default personal records reappear after import or reload.
- [ ] Remove the synthetic test through the normal UI or discard the separate test profile; do not touch the normal profile’s local data.
- [ ] Do not use Cloud Push/Pull.

### Allowed tracked Polar fixtures after Phase 1B

- [ ] Every Polar sample in tracked runtime source uses date `2099-01-01`.
- [ ] Every fixture includes `synthetic: true`, `fixture: true` and `source: synthetic_test_fixture`.
- [ ] Every fixture note contains `SYNTHETIC TEST DATA — NOT USER DATA`.
- [ ] No realistic legacy Polar/health sample values or dated activity/session combinations remain.
- [ ] Opening the app or Data Center does not insert a fixture into DATA.
- [ ] `fillPolarSample()` populates its textarea only after the explicit sample button click.
- [ ] `samplePayload()` reaches DATA only after **Test Payload Kaydet** is explicitly clicked.

Only explicitly synthetic 2099 Polar fixtures may remain in tracked runtime source. Any Polar/health fixture without all required markers is a privacy-scan failure.

### Privacy Phase 1C — Remaining Tracked Sample Cleanup

- [x] The unused legacy `script_23.js` helper uses the same explicit synthetic 2099 fixture and is marked as not loaded at runtime.
- [x] The Polar dashboard README example uses the same explicit synthetic 2099 fixture.
- [x] No identified personal record remains in the current tracked working tree.
- [x] Remaining Polar/health matches are structural fields or calculations, explicit synthetic fixtures, or redacted security documentation.

Final current-tree status:

| Check | Result |
|---|---|
| Current tracked tree free of identified personal records | Yes |
| Only explicitly synthetic fixtures remain | Yes |
| Git history cleanup still required | Yes |
| Supabase/RLS verification still required | Yes |

This status applies to the current working tree only. It does not attest to historical Git objects, forks, clones, prior deployments/caches, browser localStorage, existing cloud payloads or live Supabase policy state.

## 8. Existing lightweight/static checks

From the repository root:

```sh
node tests/run-tests.js
```

- [ ] All existing signal-model, runtime-contract, navigation, layout and syntax tests pass.
- [ ] Parse each tracked `const INITIAL` and confirm `workouts`, `appleWatch` and all Polar daily stores are empty.
- [ ] Confirm `index.html` still contains the localStorage-first fallback:
  `localStorage.getItem('atlas_summary_reports') || JSON.stringify(INITIAL)`.
- [ ] Confirm no application/runtime, Supabase or Polar function changed outside the Phase 1 data constants/sample.

Phase 1 automated result on 2026-07-18: **PASS**. The existing `tests/run-tests.js` suite passed all signal-model, runtime-contract, Home navigation, mobile navigation/scroll, activity-card layout and JavaScript syntax checks. A separate startup-contract check confirmed both fresh empty initialization and preservation of a synthetic pre-existing localStorage object. No browser or cloud write was performed.

Phase 1C automated result on 2026-07-18: **PASS**. All six retained Polar sample objects (active, duplicate legacy and documentation copies) parsed successfully, matched the same explicit synthetic fixture, and contained no identity or location fields. The tracked-tree scan found zero remaining Phase 0 workout dates or notes and zero legacy Polar sample dates/notes. `script_23.js` syntax, the full lightweight test suite and diff whitespace validation passed.

## 9. Source-code privacy scan

Run a value-minimizing scan: report filenames and counts only; do not print matching records.

- [ ] Search all tracked files for the personal dates identified in the Phase 0 private inventory; expect zero current-tree matches.
- [ ] Search for unique personal workout notes/combinations; expect zero record-shaped matches.
- [ ] Parse every `INITIAL` constant and confirm zero personal records.
- [ ] Review remaining exercise-name matches and classify them as structural program templates, clearly synthetic tests or redacted documentation.
- [ ] Review JSON, Markdown, backup, archive and generated files; no current personal payload should remain.
- [ ] Confirm no service-role key, OAuth client secret or Polar token was introduced.

Current Phase 1 classification after static scan:

| Path | Match remains? | Classification |
|---|---:|---|
| `index.html` | No identified personal date/record match | Empty runtime default; remaining exercise names are structural Gym/program templates |
| `script.js` | No identified personal date/record match | Empty legacy default; activity placeholder is explicitly synthetic |
| `all_scripts.js` | No identified personal date/record match | Empty tracked aggregate default; remaining names are structural code |
| `script_1.js` | No identified personal date/record match | Empty tracked legacy default; remaining names are structural code |
| `tests/` | Synthetic matches only | Test fixtures/code, not loaded by the application |
| `README*.txt` | Explicit synthetic Polar fixture and structural names only | Documentation, no dated personal performance record confirmed |
| `docs/security/` | Redacted references only | Audit metadata; no complete personal record or secret value |

## 10. GitHub Pages after a future authorized push

- [ ] Wait for the Pages workflow to finish successfully.
- [ ] Open the deployed app in a fresh browser profile with storage empty.
- [ ] Use “View Source” and DevTools Network to inspect `index.html` and every loaded JS asset.
- [ ] Confirm the deployed `INITIAL` is empty and no old duplicate source asset is being served.
- [ ] Check the active service worker/cache name and perform a controlled hard reload/update.
- [ ] Confirm the active cache identity is `simurg-privacy-phase-1-1` and the registration query is `privacy-phase-1-1`.
- [ ] Confirm old cached source is no longer returned after service-worker activation lifecycle completes.
- [ ] Repeat mobile, desktop, Polar and Universal Import smoke checks.
- [ ] Repeat the value-minimizing privacy scan against the deployed source bundle/assets.
- [ ] Remember that a normal push does not remove old Git commits, forks, clones or third-party caches.

## 11. Expected remaining risks after Phase 1

- Historical Git objects still contain the former embedded records.
- Existing GitHub forks/clones/downloads and previous Pages/CDN/service-worker caches may retain copies.
- Live `simurg_data` RLS/grants and existing cloud payload content remain unverified and unchanged.
- Cloud Sync remains unauthenticated, shared-record and last-writer-wins until a later approved phase.
- Import/restore HTML-injection risks documented in Phase 0 remain open; Phase 1 removes the embedded personal dataset but does not implement the security refactor.
