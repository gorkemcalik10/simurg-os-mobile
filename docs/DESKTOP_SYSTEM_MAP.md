# SIMURG OS Desktop System Map

Audit date: 2026-07-23  
Runtime verified at: 1440 × 900 with fresh local state

Desktop presentation is owned by `desktop-alignment.js/css` above 900 px, with
shared data and calculations supplied by the base application, premium renderer,
signal model, and workout-source policy.

## 1. Exact visible sidebar

| Order | Label | Desktop key / mount | Purpose |
|---:|---|---|---|
| 1 | Ana | `home` / base Home | Historical day dashboard |
| 2 | Antrenman Günlüğü | `logger` / `desktopLegacyLogger` | Workout review and weekly navigation |
| 3 | Polar Verileri | `polar` / `desktopPolarData` | Polar source/status and workout access |
| 4 | Günlük Özet | `daily` / `desktopDailySummary` | Selected-day summary |
| 5 | Haftalık Özet | `weekly` / `desktopWeeklySummary` | Weekly performance report |
| 6 | Aylık Değerlendirme | `monthly` / `desktopMonthlyReview` | Monthly review |
| 7 | Program Analizi | `program` / `desktopLegacyProgram` | Program Intelligence |
| 8 | Koçluk | `coaching` / `desktopLegacyCoaching` | Coaching decision surface |
| 9 | Veri Merkezi | `data` / base Data | Local/cloud/import administration |

Identifiers containing `Legacy` are current active mount names, not evidence that
the visible screen is unreachable.

The base sidebar contains additional old buttons. Desktop setup hides unrecognized
ones and appends the canonical set above. Thus the visible navigation is correct,
but hidden duplicate navigation nodes remain in the DOM.

## 2. Desktop controller behavior

`SimurgDesktop` keeps private desktop state for selected logger/report weeks,
selected Polar date/workout/tab, and initialization status.

`showDesktop(key)`:

1. Updates the active sidebar item.
2. Activates the relevant section/mount.
3. Calls that screen's renderer.

`renderAll()` eagerly renders every major desktop screen. It runs at desktop start
and can run after general data changes. This makes cross-screen data consistent but
is more expensive and tightly coupled than rendering only the active destination.

## 3. Screen inventory

| Screen | Entry point | Main content | Editable? | Primary data source | Status |
|---|---|---|---|---|---|
| Ana / Overview | Sidebar Ana | Selected-date rings, activity/training, recent workout, trends | Read-only | Premium Home model, signals, source policy | Active and complete |
| Ana / Recovery | Home tab | Recovery score/signals/trend/interpretation | Read-only | Polar nightly/recovery, fallback recovery | Active and complete |
| Ana / Sleep | Home tab | Sleep score, duration/stages/trend | Read-only | Polar sleep/nightly | Active and complete |
| Ana / Load | Home tab | Cardio load, strain/tolerance/load trend | Read-only | Polar load and training signals | Active and complete |
| Antrenman Günlüğü | Sidebar | Week/date cards, workout groups/exercises, volume/trend/raw performance, source session, coach summary | Mostly read-only; existing edit paths | Workouts, signals, source policy | Active and complete |
| Polar Verileri | Sidebar | AccessLink/source status and Polar workout/history entry | Connection/sync actions | Polar capability and `DATA.polar*` | Active and complete |
| Polar Workout detail | Polar action | Date/workout navigation and General/Heart/Zones/Load | Read-only; import/export actions | `DATA.polarWorkouts` | Active and complete |
| Günlük Özet | Sidebar | Day card, activity/recovery/sleep/load/training overview | Read-only/export | Shared day signals and `DATA` | Active and complete |
| Haftalık Özet | Sidebar | Weekly metrics, trends, distribution, highlights, note/export | Note/export only | Shared week signals | Active and complete |
| Aylık Değerlendirme | Sidebar | Monthly metrics/trends/top exercises | Read-only | Shared month signals | Active and complete |
| Program Analizi | Sidebar | Weekly delta, recovery debt, quality, focus, coach verdict/export | Read-only/export | Derived training/readiness calculations | Active and complete |
| Koçluk | Sidebar | Verdict, next targets, readiness, deload/risk, Phoenix/PR context | Read-only | Signals, targets, notes | Active and complete |
| Veri Merkezi | Sidebar | Auth, cloud, local state, import/export, Polar tools | Yes; explicit actions | LocalStorage, Supabase, parsers | Active and complete |
| Older progress/reports screens | Hidden old nav | Older report DOM/renderers | Read-only | `DATA` | Legacy/unreachable |

## 4. Home structure and date navigation

Desktop Home uses the premium Home shell and shared `selectedDate`.

Header controls:

- Previous day
- Selected date label
- Next day
- Today

Tabs:

1. Overview
2. Recovery
3. Sleep
4. Load

The selected date persists across tab changes. Previous/Next move one calendar day.
Today calls the premium local date handler and `renderHome()` rather than rebuilding
all reports. These controls and all four tabs worked during the audit.

The Home data model combines activity, Gym training, Polar sessions, sleep,
nightly recharge, Cardio Load, and readiness. Empty days use compact stable states.

There is no current desktop “Latest” button in the audited Home header.

## 5. Workout review screen

Antrenman Günlüğü is a review-oriented desktop surface:

- previous/next week, date range, Today, and export controls
- program/day cards and selected-day navigation
- grouped muscle/exercise cards and set details
- muscle-group volume and volume trend
- Raw Performance
- source-aware Polar/Gym/Apple Health Activity Session
- Coach summary/logic

The right rail is a single desktop region containing volume/trend and source-session
cards. Current CSS uses constrained/sticky behavior and internal overflow. No
horizontal overflow was observed at 1440 × 900. Populated, very tall right-rail
content at 1280/1728/1920 was not repeated in this audit.

Desktop export actions include weekly/report exports or copy actions exposed by the
relevant report renderer, plus Data Center JSON/CSV exports.

## 6. Daily, weekly, and monthly reports

### Günlük Özet

Selected-day overview of training, activity, recovery, sleep, and load. Uses shared
day signals, preserving partial/unavailable values.

### Haftalık Özet

Aggregates valid physical sessions and workout records for the selected week,
including volume, sets/reps/RPE, trends, distribution, and narrative notes.

### Aylık Değerlendirme

Aggregates month metrics and trends from `SimurgSignalModel.month(...)`. It is
read-only and shares calculation semantics with other desktop summaries.

## 7. Program Analizi

The active Program Intelligence screen contains:

- weekly change analysis
- recovery debt
- program quality
- weekly focus
- coach verdict / next-week strategy
- report/export affordance where present

It is calculated from current workout/activity/recovery data. It does not maintain
an independent cloud table.

## 8. Koçluk

The current coaching screen combines:

- Coach Verdict
- Next Session Target
- Readiness & Activity
- Injury Risk & Deload
- Phoenix/weekly report
- Progress/PR motivation

It is read-only decision support derived from the signal model, recent workload,
RPE/form/pain, and target state. Target safety logic prevents stored targets from
bypassing pain/posture protections.

## 9. Veri Merkezi

The desktop Data Center exposes:

- email/password sign in
- persistent session state and sign out
- Check Cloud, Push, Pull
- local update/status
- Universal Import
- JSON backup/restore and CSV export
- Polar AccessLink status/helper areas
- synthetic/legacy test helpers still present in source

With no authenticated session:

- sign in remains enabled
- sign out, Check Cloud, Push, and Pull are disabled
- local data remains available and is not cleared

## 10. Shared and duplicated implementation

### Shared

- One global `DATA` object and localStorage payload
- shared date/workout/program collections
- signal model day/week/month calculations
- workout-source policy
- Polar AccessLink stores
- cloud controller
- base `save()` and import/export

### Duplicated or layered

- Base DOM and renderers remain in `index.html`.
- Premium renderers replace or refine several base mobile sections.
- Desktop alignment creates dedicated mounts and renderers for most reports.
- Hidden original sidebar buttons coexist with appended desktop buttons.
- Some old external `script*.js` copies contain duplicate implementations but are
  not loaded.
- Disabled template archives contain additional complete UI generations.

## 11. Responsive boundaries

| Width | Intended owner | Audit conclusion |
|---|---|---|
| ≤ 860 px | Mobile V8 router/shell | Clear and runtime-verified at 390 px |
| 861–900 px | Mixed premium rules; no single explicit controller | Active with known issue / needs manual test |
| ≥ 901 px | Desktop alignment | Clear and runtime-verified at 1440 px |

All desktop-specific rules should remain inside `@media (min-width: 901px)`, but the
base monolith contains shared rules whose cascade still affects both modes.

## 12. Desktop-specific risks and unfinished areas

| Issue | Evidence | Severity/status |
|---|---|---|
| Eager all-screen rendering | `renderAll()` rebuilds inactive reports after shared changes | High |
| Hidden duplicate navigation | Old and appended buttons coexist | Low |
| 861–900 gap | Mobile and desktop controller thresholds do not meet | Medium |
| Misleading `desktopLegacy*` names | Active current mounts appear legacy to maintainers | Low |
| Stored DOM-XSS | Shared imported/editable strings can reach desktop/base HTML builders | Critical |
| Whole-payload replacement | Import/Pull can invalidate all report inputs | Critical |
| Personal greeting | Presentation embeds a name outside `DATA` | Low |
| Populated rail/breakpoint coverage | Only 1440 × 900 empty-state runtime was exercised | Unclear and needs manual test |

## 13. Manual test gaps

Still required:

- desktop widths 1024, 1280, 1728, and 1920 with populated data
- long exercise/program/source names and large set lists
- right-rail bottom accessibility with a populated Polar session
- keyboard traversal through hidden duplicate nav nodes
- populated daily/weekly/monthly/program/coaching exports
- invalid and older-version JSON restore
- two-user cloud isolation and conflict handling
- live Polar multi-workout history and token expiry
