# Simurg Performance Math Contracts

Status: implemented v1 engine contract, validated with deterministic synthetic scenarios; no Performance UI integration in this phase.

## Verdict

The two-score design is implemented against the current local/cloud `DATA` model. Pre-Training Readiness is computed from date-safe Sleep Intelligence facts and one Polar ANS Charge composite. Post-Training Daily Balance remains unavailable until an exact-date session has a usable modality-specific signal and at least 10 comparable prior days in the same raw-method branch. Neither score is a Coach decision input.

## 1. Pre-Training Readiness (`Antrenmana Hazırlık`)

### Availability

Readiness is `insufficient` unless both Sleep Capacity and Recovery are available. Missing one component never reweights the other.

Sleep Capacity requires:

- exact-date deep, REM, and light sleep; actual sleep is their sum and never time in bed;
- consistent positive time in bed and actual sleep not greater than time in bed;
- an exact-date sleep goal, a reliably dated prior profile goal effective on/before the selected date, or latest profile goal only when the selected date is the current date;
- sleep timing consistency from at least 5 valid nights in the trailing 14-day window;
- sleep-stage baseline from at least 5 valid prior nights in the trailing 14 days.

Recovery requires an exact-date Polar `ansCharge` in `[-10,+10]`. `ansChargeStatus`, HRV, Night HR, breathing, and Nightly Recharge may be displayed as evidence but never contribute additional score weight.

### Sleep Capacity

Let:

- `r = clamp(actualSleepMinutes / sleepGoalMinutes, 0, 1)`
- `E = clamp(sleepEfficiencyPercent, 0, 100)`
- `C = clamp(sleepConsistencyScore, 0, 100)`
- `S = clamp(100 - 2 × mean(|currentStageShare - baselineStageShare|), 0, 100)` across deep, REM, and light sleep.

Then:

```text
SleepCapacity = round(
  0.35 × 100 × r²
  + 0.20 × 100 × r
  + 0.25 × E
  + 0.15 × C
  + 0.05 × S
)
```

This is algebraically the existing safe Energy sleep-capacity construction. The former sleep-debt term is documented as part of the single duration-adequacy domain (`100 × r`), not as independent evidence. All inputs and the final value are clamped to `0…100`.

### Recovery construction chosen

```text
Recovery = round(clamp(50 + 5 × clamp(ansCharge, -10, +10), 0, 100))
```

Thus Polar-usual recovery (`ANS Charge = 0`) maps to 50; `-10` maps to 0 and `+10` maps to 100.

Why this is preferred over direct HRV + Night HR:

| Criterion | Direct HRV + Night HR | Polar ANS Charge |
|---|---|---|
| Availability | Needs Simurg history and a local baseline | Exact-date field already normalized by Polar |
| Historical safety | Safe only with strict prior-only baseline filtering | Date-stamped result; Polar compares with prior personal levels |
| Interpretability | Requires arbitrary deviation-to-score slopes | Official bounded `-10…+10`, usual around zero |
| Double-counting | Two correlated autonomic signals must be combined | One composite; HRV/HR/breathing remain evidence only |
| Preferred | No | Yes |

### Readiness formula

```text
PreTrainingReadiness = round(clamp(
  0.5625 × SleepCapacity
  + 0.4375 × Recovery,
  0, 100
))
```

The `56.25/43.75` weights are retained. They exactly renormalize the existing `45/35` Sleep/Recovery relationship after removing the old 20% prior-load domain. A 10-point Sleep change moves Readiness by 5.625 points; a 10-point Recovery change moves it by 4.375 points. Equal weights would change those sensitivities by only 0.625 points, so preserving continuity is preferable until outcome calibration exists.

### Confidence and display

- `high`: Sleep requirements pass; ANS Charge and valid `ansChargeStatus` plus exact-date HRV and Night HR evidence exist.
- `medium`: Sleep requirements pass and ANS Charge exists, but one or more contextual recovery fields are absent.
- `insufficient`: either score is unavailable or invalid.
- Round once, after the weighted calculation. Bands use the displayed integer:
  - `0–19`: Çok kötü
  - `20–39`: Kötü
  - `40–59`: Orta
  - `60–79`: İyi
  - `80–100`: Çok iyi

Equal-width bands are recommended for v1 because there is no Simurg outcome dataset that would justify non-linear clinical-looking thresholds. Recalibrate only against future observed outcomes, not aesthetics.

Readiness contains no same-day completed load and no prior-load contributor.

## 2. Actual Load normalization

All percentiles use only records with `record.date < selectedDate`, within the prior 365 days. A comparable baseline needs at least 10 values; `10–19` is medium confidence and `20+` high confidence. Values below 10 are `insufficient`. Percentiles use deterministic midranks:

```text
Percentile(x, H) = round(100 × (count(h < x) + 0.5 × count(h = x)) / |H|)
```

The result is clamped to `0…100`.

### Gym strength

An exact-date Gym session is grouped by `sessionId`; legacy rows without one form one session for that date. Every counted row must have a positive set count, canonical exercise identity, and RPE in `1…10`. No missing RPE or duration is imputed.

```text
SessionRPE = set-count-weighted mean of valid row RPE values
Primary session raw = reliable duration minutes × SessionRPE
Fallback session raw = effective working-set count × SessionRPE
Gym day raw = sum of distinct same-method session raw values
GymActualLoad = Percentile(GymDayRaw, comparablePriorGymDays)
```

A session duration is reliable only when an explicit duration resolves to `5…360` minutes and repeated row-level values for the session agree within two minutes. If every session that day has reliable duration, the whole day uses the duration branch. Otherwise the whole day uses the working-set fallback. Duration and fallback values are never placed in the same percentile distribution.

Prior days must use the same raw method and same session-count bucket (`1` or `2+`). A reliable program/session-family signature is preferred when it yields at least 10 observations; otherwise the engine uses the broader same-method Gym baseline and lowers confidence. Kilograms, repetitions, and Training Lab volume/load profiles remain contextual evidence and never enter the universal raw load.

### Cardio/endurance

The canonical exact-date raw input hierarchy is:

1. exact-date official `polarCardioLoad.daily[date].cardioLoad`;
2. otherwise, the sum of distinct exact-date Polar workout Training Load Pro `cardioLoad` values.

The official daily value is selected only when it clearly represents distinct cardio work for that date. On a Gym day containing a Polar strength mirror, that daily total is not treated as a separate cardio modality; distinct non-strength per-session loads are used when present. `strain`, `tolerance`, and `cardioLoadRatio` are chronic-load context and are never same-day Actual Load. A cardio baseline prefers the same canonical activity-family set and requires the same session-count bucket (`1` or `2+`); a broader cardio baseline lowers confidence.

```text
CardioActualLoad = Percentile(CardioRawLoad, comparablePriorCardioDays)
```

### Multiple sessions, mixed days, and duplicates

- Multiple distinct same-modality sessions: sum the modality's raw canonical loads first, then percentile-rank against comparable `2+`-session days. Do not average session percentiles.
- Distinct Gym + cardio/endurance: both modality percentiles are required. If either modality has an insufficient baseline, the mixed day is insufficient rather than silently dropping work.
- Final formula: `MixedActualLoad = round(clamp(max(Gym, Cardio) + 0.30 × min(Gym, Cardio), 0, 100))`.
- Alpha simulations at `0.25/0.30/0.35` produced `70+70 → 88/91/95`, `80+20 → 85/86/87`, and `40+40 → 50/52/54`. Alpha `0.30` is the middle, non-extreme setting. It is monotonic, keeps the primary load fully visible, and adds a restrained secondary contribution. Probabilistic union tied at `70 + 70` but over-accumulated two moderate `40` loads to `64`; the old mean did not accumulate at all.
- Same physical Gym session in both stores is classified as strength and excluded from the cardio branch. Count only the Gym internal-load branch and retain Polar as context.
- Gym/Polar identity resolution is ordered: shared explicit `sessionId`; otherwise canonical strength compatibility plus close, substantially overlapping intervals and compatible duration; otherwise explicit distinct or ambiguous evidence. Name-only similarity is never enough.
- A strength Polar session is mirrored by timing only when starts differ by at most 20 minutes, interval overlap is at least 70% of the shorter session, and duration difference is at most the greater of 10 minutes or 25% of the longer session. Clearly non-overlapping intervals remain distinct.
- If identity/timing evidence cannot establish mirrored versus distinct, Actual Load returns `ambiguous_session_identity`; Load Fit and Daily Balance stay unavailable while valid Readiness remains available.
- A clearly distinct Polar strength session is preserved in dedup metadata and returns `distinct_strength_session_load_unsupported` instead of being discarded or fabricated as a cardio/Mixed percentile.
- Rest/no exact-date completed session: no post-training score. Daily activity alone is not a completed training session.

## 3. Load Fit and Daily Balance

Let `R` be the valid date-stamped Pre-Training Readiness snapshot and `L` the normalized same-day Actual Load.

```text
TargetLow  = max(0, R - 10)
TargetHigh = min(100, R + 10)
```

Load Fit uses a four-times steeper overshoot slope than undershoot:

```text
LoadFit = 100                                      if TargetLow ≤ L ≤ TargetHigh
LoadFit = clamp(100 - 0.75 × (TargetLow - L), 0, 100)  if L < TargetLow
LoadFit = clamp(100 - 3.00 × (L - TargetHigh), 0, 100) if L > TargetHigh
LoadFit = round(LoadFit)
```

Daily Balance is:

```text
DailyBalance = round(clamp(0.35 × R + 0.65 × LoadFit, 0, 100))
```

The proposed `35/65` weighting is retained after sensitivity checks. Load Fit is the majority driver, while 35% Readiness prevents a perfectly conservative low-readiness day from looking identical to a high-readiness well-used day. Raw load never enters Daily Balance directly. Increasing load improves the result only while it moves toward the readiness-appropriate range; after the upper bound it lowers the result sharply.

Daily Balance uses the same five display bands as Readiness. Its confidence is the lower of the Readiness snapshot confidence and Actual Load baseline confidence.

### Exact thresholds and confidence

- History window: strictly prior 365 days; the selected date is never included.
- Minimum baseline: 10 comparable prior days.
- Preferred same-family baseline: 10–19 `medium`, 20+ `high`.
- Broader fallback baseline: 10–19 `low`, 20+ `medium` because family comparability is weaker.
- Fewer than 10: `insufficient`.
- Unified score confidence is the lower of its required component confidences.

## 4. Historical and snapshot safety

The read-only provider is compatible with a later hybrid snapshot-first architecture:

1. Persist an immutable pre-training snapshot the first time a valid current-date Readiness is calculated, before completed training is included.
2. Store `date`, `calculatedAt`, `formulaVersion`, rounded and unrounded components, confidence, source dates, sleep-goal source/effective date, and an input fingerprint.
3. Post-training calculation must reference that snapshot ID/hash. It must not recompute morning readiness from post-session state.
4. For a historical date without a snapshot, reconstruct only from exact-date or prior-known inputs and strictly prior baseline rows; label it `reconstructed`. If any required input is not date-safe, return `insufficient`.
5. Persist a Daily Balance snapshot with formula version, readiness snapshot hash, modality classification, dedup decisions, comparable-baseline IDs, and actual-load inputs.

No snapshot namespace, persistence, Supabase change, or data mutation is added in this phase.

## 5. Coach separation contract

- Both metrics are `descriptive_ui` and `coachEligible: false`.
- Their provider must not import or call `SimurgCoachEngine`/`SimurgCoachClient`.
- Coach must not import the Performance provider, read `performanceIntelligence`, add these values to decision evidence, or send them in remote Coach payloads.
- The scores cannot promote or override a Coach decision.
- Existing Pain → Form → RPE → recovery/safety enforcement and the canonical decision source remain unchanged.

## 6. Training Lab modules to preserve

Keep these providers intact even if the mobile Training Lab UI is replaced later:

- `simurg-training-lab-analysis.js`: exercise-session grouping, PR events, progression, plateau, historical load-profile safety, and comparable volume.
- `simurg-exercise-history.js`: prior exercise sessions and summaries.
- `simurg-exercise-canonicalization.js` and `simurg-exercise-library.js`: stable identities and metadata.
- `simurg-gym-identity.js`: session/exercise/set identities.
- `simurg-volume-model.js`: date-aware load semantics and volume evidence.
- `simurg-muscle-anatomy.js`: canonical muscle/high-level-group signatures.
- `simurg-next-session-target.js`: next-session targets gated by canonical Coach decisions.
- `simurg-signal-model.js` and `workout-source-policy.js`: Polar session identity, exact-date aggregation, source preference, and deduplication primitives.

The existing `simurg-training-lab-ui.js`, renderer/assets, CSS, and navigation remain untouched in this phase.

## 7. Deterministic simulation matrix

| Scenario | Sleep | Recovery | Readiness | Actual Load | Load Fit | Daily Balance | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| High sleep + high recovery | 85 | 80 | 83 | — | — | — | Çok iyi readiness |
| Low sleep + high recovery | 35 | 80 | 55 | — | — | — | Orta readiness |
| High sleep + low recovery | 85 | 20 | 57 | — | — | — | Orta readiness |
| Low sleep + low recovery | 35 | 20 | 28 | — | — | — | Kötü readiness |
| Readiness 40, very high load | — | — | 40 | 95 | 0 | 14 | Çok kötü balance |
| Readiness 40, conservative load | — | — | 40 | 25 | 96 | 76 | İyi balance |
| Readiness 80, moderate/high load | — | — | 80 | 80 | 100 | 93 | Çok iyi balance |
| Readiness 80, very low load | — | — | 80 | 10 | 55 | 64 | İyi balance; conservative penalty only |
| Gym + Polar, same physical strength session | — | — | 70 | 70 (Gym only) | 100 | 90 | Duplicate excluded |
| Gym 70 + cardio 70 | — | — | — | 91 | — | — | Both modalities accumulate |
| Gym 80 + cardio 20 | — | — | — | 86 | — | — | Secondary contribution is restrained |
| Gym 40 + cardio 40 | — | — | — | 52 | — | — | Moderate loads accumulate meaningfully |
| Fewer than 10 comparable baselines | — | — | valid | — | — | — | Insufficient |
| Later profile sleep goal changes | historical inputs unchanged | — | unchanged/unavailable | — | — | — | No future leakage |

The matrix verifies that raw load is not monotonically rewarded: at Readiness 40, load 95 scores far below load 25; at Readiness 80, load 100 scores below load 80.
