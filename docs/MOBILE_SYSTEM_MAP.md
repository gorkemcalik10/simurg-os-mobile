# SIMURG OS Mobile System Map

Audit date: 2026-07-23  
Runtime verified at: 390 × 844 with fresh local state

This map describes visible current mobile UI. Disabled templates and hidden legacy
cards are listed separately and are not presented as current product screens.

## 1. Mobile ownership and startup

The canonical active mobile router is `window.simurgV8Go` from
`simurgWhoopMobileV8Script` in `index.html`.

For each navigation:

1. Close the mobile Menu.
2. Remove the active Polar Workout detail state.
3. Deactivate normal sections.
4. Activate the requested section.
5. Set `body[data-simurg-active-screen]`.
6. Set `html[data-simurg-active-key]`.
7. Update stable navigation keys and active bottom item.
8. Refresh the target screen.
9. Reset that screen's scroll position.

The app opens with Home visually active. On a fresh load, body/html active-state
attributes may remain unset until the first navigation even though the correct Home
section and bottom item are active. This is currently harmless but means DOM-state
consumers should not assume those attributes exist during first paint.

The primary mobile breakpoint is `max-width: 860px`. Premium CSS includes some
rules through 900 px, while desktop begins above 900 px; 861–900 px needs explicit
manual coverage.

## 2. Exact visible navigation

### Bottom navigation

| Order | Label | Stable key / target | Result |
|---:|---|---|---|
| 1 | Ana | `home` | Current Home with four tabs |
| 2 | Gym | `gym` | Editable Gym workout-entry screen |
| 3 | Günlük | `workout` | Workout Logger/history and Activity Session |
| 4 | Polar | `polar` | AccessLink connection and Polar workout entry/history |
| 5 | Menü | menu overlay | Opens secondary destinations |

### Menu destinations

| Order | Label | Target | Purpose |
|---:|---|---|---|
| 1 | Koçluk | `coaching` | Daily/weekly coaching decision and targets |
| 2 | Program | `program` | Program intelligence and plan analysis |
| 3 | Haftalık | `weekly` | Weekly performance summary |
| 4 | Aylık | `monthly` | Monthly review |
| 5 | Veri Merkezi | `data` | Local/cloud/Polar/import/export controls |

Menu opens above the current section and does not itself replace the active content
until a destination is selected.

## 3. Screen inventory

| Screen | Entry point | Main content | Editable? | Primary data source | Status |
|---|---|---|---|---|---|
| Ana / Genel Bakış | Ana | Selected-day readiness/decision, recovery/sleep/load summaries, plan, latest training/activity | Read-only | Signal model, `DATA`, source policy | Active and complete |
| Ana / Toparlanma | Home tab | Readiness/recovery signals and trend/interpretation | Read-only | Polar nightly/recovery, recovery fallback, signal model | Active and complete |
| Ana / Uyku | Home tab | Sleep duration/score/stages/trend and empty handling | Read-only | Polar sleep and nightly recharge | Active and complete |
| Ana / Yük | Home tab | Cardio load, strain/tolerance, recent load context | Read-only | Polar Cardio Load, workout source, signal model | Active and complete |
| Gym | Bottom Gym | Date/day program, exercise/set entry, edit/save/auto-next behavior | Yes | `DATA.workouts`, programs, targets | Active and complete |
| Günlük | Bottom Günlük | Weekly/date selection, grouped exercises, volume/trend/raw performance, Activity Session, Coach summary | Mostly read-only; existing edit controls remain | Workouts, source policy, signal model, notes | Active and complete |
| Polar | Bottom Polar | AccessLink status/actions, source counts, workout/history access | Connection/sync actions | Polar capability plus `DATA.polar*` | Active and complete |
| Polar Workout | Polar workout/history action | Date/workout navigator and Overview/Heart/Zones/Load detail | Read-only; import/export actions available | `DATA.polarWorkouts` | Active and complete |
| Koçluk | Menu | Coach verdict, next targets, readiness/activity, risk/deload, Phoenix/PR context | Read-only | Signal model, targets, notes | Active and complete |
| Program | Menu | Weekly change, recovery debt, quality, focus, coach verdict | Read-only | Workouts/activity/readiness calculations | Active and complete |
| Haftalık | Menu | Weekly aggregates, trends, distribution, notes/export where exposed | Mostly read-only; note/export actions | Signal model, workouts/activity | Active and complete |
| Aylık | Menu | Monthly aggregate metrics and trends | Read-only | Signal model and monthly aggregations | Active and complete |
| Veri Merkezi | Menu | Auth, Check/Push/Pull, JSON/CSV import/export, Universal Import, Polar helpers, local status | Yes; explicit actions | LocalStorage, Supabase, import parsers | Active and complete |
| Recovery base section | Not a bottom item | Older recovery DOM remains available to shared renderers | Read-only | Recovery/Polar | Hidden |
| Daily Summary base section | No current Menu item | Older daily report DOM still exists | Mixed | `DATA` | Hidden on canonical mobile nav |
| Reports/base Progress | No current Menu item | Older report implementation | Read-only | `DATA` | Legacy/unreachable |

## 4. Home flow

Home defaults to the current local date and presents four tabs:

1. Genel Bakış
2. Toparlanma
3. Uyku
4. Yük

Changing tabs preserves the selected date. Home uses premium renderer state but reads
the shared `selectedDate`. The model fuses:

- Polar workout/activity/sleep/nightly/cardio-load data
- Gym workouts/program state
- legacy recovery and Apple Health fallback records
- `SimurgWorkoutSource.day(date)`
- `SimurgSignalModel.day(date)`
- `SimurgReadiness.resolve(date)`

Mobile Home exposes compact date navigation rather than the full desktop
Previous/Next/Today row. Missing signals display dashes, unavailable labels, or
compact empty treatment instead of fabricated health values.

## 5. Gym workout-entry flow

The Gym screen is the principal editable workout path:

1. Select the day/date with its existing day navigation.
2. Load the programmed day and any custom override.
3. Add or edit exercises and set rows.
4. Enter repetitions, weight, RPE/form/pain where supported.
5. Save through the shared `save()` path.
6. The whole `DATA` payload is persisted locally and signal caches are invalidated.
7. Premium Home/Logger and desktop reports can refresh from the changed records.

Programs come from built-in day definitions plus `customGymPrograms` and
`programNames`. Auto-next targets are stored lazily. Gym writes local workout
records; cloud synchronization occurs only when the user later presses Cloud Push.

Known data concern: workout rows do not have stable IDs and set-count semantics are
not identical in all aggregators.

## 6. Workout Logger and history flow

The Günlük entry is the current mobile workout-review surface. It supports week/date
selection and presents, in current order/layout, selected training context, grouped
exercises, muscle-group volume, trends/raw performance, a source-aware Activity
Session, and coaching summary.

`SimurgWorkoutSource.day(date)` determines the visible session source:

- Polar + Gym
- Polar
- Gym
- Apple Health

Legacy “Apple Watch Load” and “Legacy” labels are not part of the active source-aware
card. Raw types such as `FUNCTIONAL_TRAINING` pass through the display-label resolver
without changing stored values.

The selected session is primarily review-only, although existing exercise editing
entry points remain available where the base Logger exposes them.

## 7. Polar flows

### Polar main screen

The active Polar screen contains:

- Polar AccessLink connection/status card
- Connect, sync, disconnect actions as allowed by state/origin
- last-sync and per-category source counts
- Polar workout/history entry

The old visible blocks “Polar Recovery”, Shortcut waiting, and Polar Bridge
instructions are hidden with no intended layout gap.

### Polar Workout detail

Opening a workout:

1. Activates `#polar-workout`.
2. Sets body screen state to `polar-workout`.
3. Hides normal sections.
4. Selects a day and, if necessary, one of multiple workouts that day.

Tabs are:

1. Genel
2. Kalp
3. Bölgeler
4. Yük

Date navigation and workout selection are held in the Polar Workout module. Partial
zone data is retained; unclassified time is displayed without forcing category
percentages to 100. Missing values remain unavailable rather than synthetic.

The detail back action calls the stable mobile router for Polar. Any bottom-nav item
also exits detail first, so the hidden detail cannot remain over the requested
screen. This was verified locally.

### Legacy Polar behavior

The old Shortcut/Bridge cards are hidden, but active bridge code can still create
and persist `DATA.polarBridge`. The explicit synthetic sample helper remains in Data
Center. AccessLink is the current live integration.

## 8. Reports, coaching, program, and Data Center

### Haftalık

Read-only weekly performance aggregation using the shared signal model and workout
data. Notes/export affordances can modify only their specific stored note or produce
an export.

### Aylık

Read-only monthly summary. Current tests protect the mobile chart/layout contract,
but populated month behavior still warrants manual inspection.

### Program

Read-only Program Intelligence: change analysis, recovery debt, quality, focus, and
coach verdict. It consumes calculations and does not create a separate program-data
store.

### Koçluk

Read-only decisions and recommended next targets derived from readiness, recent
activity, pain/form/RPE signals, training volume, and stored/derived targets.

### Veri Merkezi

Editable/action-oriented screen:

- Email/password sign in and sign out
- Check Cloud, Push, Pull
- local-data status
- JSON backup/restore and CSV export
- Universal Import
- Polar sample/helper and legacy bridge test tools
- Polar AccessLink status where mounted

Signed-out users cannot press Check, Push, or Pull. No automatic cloud action is
performed on session restoration.

## 9. Mobile-specific empty and error behavior

- Home signal cards use stable placeholders for unavailable values.
- Polar Workout shows a compact no-workout state when the selected date has no data.
- Partial Polar fields do not receive fabricated values.
- AccessLink exposes category counts so zero upstream records can be distinguished
  from a failed client merge.
- Errors from cloud and Polar actions are shown in their cards; console remained
  clean in the empty local audit.

## 10. Known mobile risks and inconsistencies

| Issue | Evidence | Severity |
|---|---|---|
| Stored DOM-XSS possibility | Editable/imported strings reach active `innerHTML` paths without universal escaping | Critical |
| Whole-payload import replacement | General JSON restore lacks complete schema/version validation | Critical |
| 861–900 px ownership gap | Mobile primarily ends at 860; desktop begins above 900 | Medium |
| First-paint active attributes absent | Home is visually active before body/html state is set | Low |
| Broad refresh after save | A Gym edit can refresh unrelated mobile and desktop renderers | High |
| Legacy bridge data mutation | Hidden bridge lifecycle can create/persist `polarBridge` | Medium |
| Personal greeting in presentation | A first name is embedded in current UI source | Low |
| Installed iOS behavior not exercised | Safe areas, keyboard, resume, and offline CDN need device testing | Unclear and needs manual test |

## 11. Manual test gaps

This audit did not use personal or live cloud/Polar data. Still required:

- populated Gym create/edit/save across app restart
- imported malicious/invalid text and invalid JSON
- multi-workout Polar day and partial zone/load/sleep payloads
- live AccessLink OAuth, expired token, reconnect, disconnect
- two-user cloud isolation and revision conflict
- iOS installed-PWA keyboard/safe-area/background behavior
- mobile widths 861–900 and very small devices
