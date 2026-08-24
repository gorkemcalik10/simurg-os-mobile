# Training Lab v2 Visual-only Product Decisions

## Locked product invariants

- The analysis layer remains exactly 32 canonical muscle mappings; the presentation layer remains exactly 22 visual regions.
- Production uses the complete V1 fallback unless a full V2 package passes technical validation and recorded visual approval.
- V2 approval requires a licensed source, matching SHA-256, accepted base plus 22 masks, generated contours, a green validator, completed mobile/desktop V1-V2 review, and a green full regression suite.
- Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain unresolved documentation-only product decisions. No mapping changed.

Status: open. Documentation only; no mapping or analysis behavior changed in this phase.

The 32 canonical muscles remain the analysis source. A visual override changes only presentation and must not create effective sets, muscle workload or coaching data. Adding canonical anatomy mapping is a separate analysis-engine decision and is out of scope here.

| Exercise | Current analysis data | Current presentation data | Decision required |
|---|---|---|---|
| Bird Dog (`bird_dog`) | No canonical anatomy mapping | No visual override; Exercise Library mentions Spinal Erectors | Decide whether to add a presentation-only core/spinal-erector view or leave it explicitly unmapped. |
| Sled Push (`sled_push`) | No canonical anatomy mapping | No visual override | Decide a presentation-only primary/secondary region set, or leave it explicitly unmapped until analysis semantics exist. |
| Kettlebell Swing (`kettlebell_swing`) | No canonical anatomy mapping | No visual override | Decide whether a glute/hamstring presentation is acceptable without implying analysis workload. |
| Battle Rope (`battle_rope`) | No canonical anatomy mapping | No visual override | Decide whether shoulder/arm/core presentation is useful or too ambiguous. |
| Dumbbell Thruster (`dumbbell_thruster`) | No canonical anatomy mapping | No visual override | Decide whether a compound quad/glute/shoulder presentation is acceptable without canonical analysis mapping. |

For each exercise, the product owner must choose one of two explicit outcomes:

1. Add a presentation-only override, labeled and tested as different from analysis data.
2. Keep the movement visually unmapped and make that limitation clear in Training Lab copy.

Do not add canonical muscle mappings through this decision record. Any future analysis change requires a separate specification, workload impact review and regression phase.
