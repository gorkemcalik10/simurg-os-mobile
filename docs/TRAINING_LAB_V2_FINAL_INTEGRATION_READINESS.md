# Training Lab v2 Final Integration Readiness

Status: ready for a licensed real-asset package; production renderer remains on V1 by design.

## Locked product invariants

- The analysis layer remains exactly 32 canonical muscle mappings; the presentation layer remains exactly 22 visual regions.
- Production uses the complete V1 fallback unless a full V2 package passes technical validation and recorded visual approval.
- V2 approval requires a licensed source, matching SHA-256, accepted base plus 22 masks, generated contours, a green validator, completed mobile/desktop V1-V2 review, and a green full regression suite.
- Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain unresolved documentation-only product decisions. No mapping changed.

## End-to-end audit

| Link | Repository implementation | Gate |
|---|---|---|
| Licensed anatomy master | source metadata + independent SHA-256 reconciliation in the acceptance tool | HTTPS source, author, license, matching hash |
| 22 alpha masks | exact filename and count enforcement | full-canvas 8-bit alpha PNG, unique content, correct view |
| Automatic bounds | measured from decoded alpha | coverage, view boundary, one-pixel export tolerance |
| Contour / hit area | generated from the accepted alpha bytes | closed contour, canvas contract, complexity limits |
| Manifest | generated during transactional acceptance | schema, source, checksums, bounds, canonical reconciliation |
| Registry loading | 22-region presentation registry | fixed IDs, views, canvas, canonical references |
| Renderer activation | manifest validation plus base/mask/contour runtime preflight | all-or-nothing V2 package; V1 on any failure |
| Visual approval | manifest activation record and comparison fixture | reviewer, timestamp and fixture required |

No link is missing before asset arrival. The intended blocking conditions are the absent licensed master, absent real masks/contours, and pending visual approval.

The import sequence is mechanically ordered: dry-run produces a deterministic fingerprint; publish requires that exact fingerprint and rechecks the prepared technical contract plus unchanged input hashes; the repository validator runs after the transactional write; visual approval remains a later, independent activation gate.

## Complexity review

- The legacy SVG paths remain necessary only as the complete V1 rollback renderer and V1 comparison baseline.
- Per-region legacy hit-path fallback inside an otherwise active V2 package was unnecessary and unsafe. Runtime contour preflight now falls back the entire renderer to V1 if any contour is missing or invalid.
- Stable V2 file paths are retained for repository clarity, while runtime requests are keyed by `assetVersion`. This prevents service-worker cache entries from mixing package generations without introducing duplicated asset directories.
- Candidate comparison mode remains separate from production activation because visual review must be possible before approval.

## Internal diagnostics

The validator emits a machine-readable readiness report with:

- `rendererMode`: `V1 fallback` or `V2 candidate`
- `v2Blocked` and `blockedReasons`
- `missingAssets`
- individual validation `errors`
- `activationStatus` and `activationApproved`
- `failedValidationGates` and `nextRequiredHumanAction`

Run `node scripts/report-training-lab-v2-readiness.js` for the concise operational summary. It intentionally exits successfully while V2 is blocked by missing real assets, because blocked V1 fallback is the correct pre-import state. Use the validator itself as the technical pass/fail gate.

The browser exposes the same non-user-facing state through `SimurgTrainingLabUI.getRendererDiagnostics()`. Normal Training Lab UI copy never includes technical failure details.

## Final step before real asset import

Obtain the approved 1024 × 1536 RGBA front/back master, its independently recorded SHA-256 and license/source metadata, then export the exact 22 full-canvas masks from that unchanged master. The first repository-affecting command must be preceded by a successful `--dry-run` using the identical input package, and publish must receive that dry-run's `--expected-fingerprint`. Follow `TRAINING_LAB_V2_REAL_ASSET_ONBOARDING.md` exactly.
