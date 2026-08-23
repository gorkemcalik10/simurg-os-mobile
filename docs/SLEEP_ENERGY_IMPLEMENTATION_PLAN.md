# Simurg OS Sleep + Energy Intelligence

## Current integration map

The existing Polar AccessLink sync already retrieves and persists the required source domains:

- `polarSleep.daily`: sleep timing, score, continuity, cycles, interruptions, stages, goal and sleep charge.
- `polarNightlyRecharge.daily`: nightly heart rate, HRV, breathing rate, Nightly Recharge status and ANS charge.
- `polarCardioLoad.daily`: Cardio Load, strain, tolerance, ratio and Polar status.
- `polarActivity.daily`: steps, activity, calories, duration and inactivity alerts.
- `polarWorkouts.daily`: individual physical sessions and workout load.
- `workouts`: Gym RPE, form, pain, volume and exercise history.

These stores already participate in validation, local persistence, Cloud Sync and backup/restore. No new DATA root or migration is required for v1.

## Safe v1 boundary

`simurg-energy-engine.js` is a read-only deterministic interpretation layer. It does not mutate or persist DATA and it does not replace the existing Coach readiness result.

Its output contract contains:

- sleep facts: actual sleep, time in bed, efficiency, stages, timing and Polar quality signals;
- recovery facts: HRV, nightly/resting heart rate, breathing and ANS/Nightly Recharge signals;
- component scores: sleep, recovery and recent load;
- energy score, status, confidence, drivers, missing-data reasons and a bounded action;
- an explicit `insufficient` result instead of an invented score when core signals are missing.

Personal HRV and nightly-heart-rate comparisons require at least five historical samples in the prior 14 days. Recent load uses the canonical `SimurgSignalModel.day()` result for the prior three days. Current-day partial activity is intentionally excluded from the morning energy score.

## Files changed in the foundation step

- `supabase/functions/_shared/polar.ts`: preserves the existing duration field and adds explicit `timeInBedSeconds` and stage-derived `sleepDurationSeconds`.
- `simurg-energy-engine.js`: new standalone Sleep + Energy Intelligence engine.
- `index.html` and `sw.js`: load/cache the engine without changing existing view behavior.
- `tests/simurg-energy-engine.test.js`: covers sleep duration semantics, personal baselines, recent load and missing-data safety.
- test manifests: include the new runtime and validate load order/cache parity.

## Next implementation steps

1. Add a compact Energy card to Home using `SimurgEnergyEngine.resolve(selectedDate)`.
2. Add a Sleep Intelligence detail card to Recovery/Sleep using the engine's `sleep` facts; do not duplicate normalization in the UI.
3. Pass the energy result into Coach presentation as supporting context only. Existing pain, form, high-RPE and conservative missing-data overrides remain authoritative.
4. Add fixture-based UI tests for good, controlled, recovery and insufficient states.
5. After enough real Polar history exists, validate component calibration against the user's RPE/performance outcomes before changing weights or thresholds.

## Explicit non-goals for this step

- No Cloud schema or Supabase migration.
- No changes to Polar OAuth, sync identity, workout aggregation or Cardio Load precedence.
- No changes to existing Workout Recovery, Coach decision rules, Gym logging or Exercise Library.
- No UI redesign and no broad refactor.
