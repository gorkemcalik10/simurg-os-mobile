# Training Lab v2 Final Controlled Production Import Playbook

This is the production gate for a licensed anatomy package. It does not change the 32-muscle analysis engine. The 22-region package is presentation data only.

## Locked product invariants

- The analysis layer remains exactly 32 canonical muscle mappings; the presentation layer remains exactly 22 visual regions.
- Production uses the complete V1 fallback unless a full V2 package passes technical validation and recorded visual approval.
- V2 approval requires a licensed source, matching SHA-256, accepted base plus 22 masks, generated contours, a green validator, completed mobile/desktop V1-V2 review, and a green full regression suite.
- Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain unresolved documentation-only product decisions. This workflow must not change their mappings.

## 1. Approve and inventory the anatomy master

Obtain one licensed front/back master from an approved provider. Store the purchase or license record outside the public asset directory. Record these required fields in a local metadata JSON file:

```json
{
  "sourceUrl": "https://provider.example/anatomy-package",
  "license": "commercial license or contract reference",
  "author": "creator or provider name",
  "sha256": "64-character independently recorded SHA-256",
  "notes": "optional internal provenance note"
}
```

`sourceUrl` must use HTTPS. `sha256` is mandatory and must match the delivered master byte-for-byte. A hash calculated only after an unexplained file appears is an integrity value, not proof of provenance; compare it with the provider checksum or the checksum recorded when the approved file was received.

Do not place license contracts, invoices or personal data in `assets/`.

Place the incoming package outside the repository while it is under review. The only repository destination is `assets/training-lab-v2/`, and only the acceptance command may populate its production files. Do not manually copy candidate images into that destination.

Record SHA-256 before editing or exporting the approved delivery. On macOS, run `shasum -a 256 /approved/input/anatomy-master.png`; on systems with GNU coreutils, run `sha256sum /approved/input/anatomy-master.png`. Compare the result with the provider checksum or the independently recorded receipt checksum, then put that exact lowercase 64-character value in `source-metadata.json`. A mismatch stops the import.

## 2. Export the fixed atlas

- Export a non-interlaced, 8-bit RGBA PNG at exactly 1024 × 1536.
- Keep the front figure in `x=0..511` and the back figure in `x=512..1023`.
- Do not crop, scale, pad or reposition either view after masks are created.
- Both halves must contain visible, non-flat image content. The acceptance gate rejects empty or single-color atlas halves.

## 3. Export all 22 masks from the same canvas

Export one full-canvas transparent PNG per manifest region into a clean directory. Use the exact filenames from `assets/training-lab-v2/anatomy-manifest.json`.

- Every mask remains 1024 × 1536 and uses 8-bit alpha.
- Pixels outside the region stay transparent.
- Front masks cannot cross into the back half, and back masks cannot cross into the front half.
- Do not duplicate a mask under another region name.
- Do not add extra PNG files to the mask directory.

The acceptance tool measures alpha bounds automatically. Never type bounds into the manifest by hand.

The import package must have exactly this structure before the dry run (the input folder may live outside the repository):

```text
approved-anatomy-package/
├── anatomy-master.png
├── source-metadata.json
└── masks/
    ├── abs.png
    ├── adductors.png
    ├── anterior_deltoid.png
    ├── biceps.png
    ├── calves.png
    ├── forearms.png
    ├── glutes.png
    ├── hams.png
    ├── hip_flexors.png
    ├── lats.png
    ├── lower_traps.png
    ├── middle_deltoid.png
    ├── obliques.png
    ├── pectoralis_clavicular.png
    ├── pectoralis_sternal.png
    ├── posterior_deltoid.png
    ├── quads.png
    ├── rotator_cuff.png
    ├── spinal_erectors.png
    ├── triceps_lateral.png
    ├── triceps_long.png
    └── upper_traps.png
```

After acceptance, the repository output is exactly:

```text
assets/training-lab-v2/
├── README.md
├── anatomy-base.png
├── anatomy-manifest.json
├── masks/       # the exact 22 PNG filenames above
└── contours/    # the same 22 region IDs, with .json extensions
```

## 4. Dry-run acceptance

```sh
node scripts/accept-training-lab-v2-assets.js \
  --master /approved/input/anatomy-master.png \
  --masks /approved/input/masks \
  --metadata /approved/input/source-metadata.json \
  --asset-version training-lab-v2-<release-id> \
  --dry-run
```

The dry run verifies metadata and the expected master hash; validates RGBA dimensions, front/back content and the complete mask set; measures bounds; checks mask alignment; and generates contour documents in memory. It writes nothing.

Save the dry-run output with the release evidence. In particular, record `sha256`, `packageFingerprint`, `assetVersion`, the 22 region results, and the reported view statistics. `packageFingerprint` deterministically covers the asset version, approved master, provenance fields, region IDs, all 22 mask hashes, and all generated contour hashes.

## 5. Publish the accepted package

Run the exact same command without `--dry-run`, and pass the recorded fingerprint as `--expected-fingerprint <dry-run-packageFingerprint>`. Do not change the input package, metadata, or asset version between the two commands. Publish is rejected if the fingerprint is absent or differs, if an input file changes after validation, or if the prepared manifest no longer passes the technical contract. The publish is staged and swapped transactionally. It writes the master, exactly 22 masks, exactly 22 contour JSON files, and a manifest containing SHA-256 values for the master, every mask and every contour.

```sh
node scripts/accept-training-lab-v2-assets.js \
  --master /approved/input/anatomy-master.png \
  --masks /approved/input/masks \
  --metadata /approved/input/source-metadata.json \
  --asset-version training-lab-v2-<release-id> \
  --expected-fingerprint <dry-run-packageFingerprint>
```

Newly accepted assets remain at `activation.status = pending_visual_approval`. Technical acceptance alone cannot activate V2.

## 6. Validate and run regression tests

```sh
node scripts/validate-training-lab-v2-assets.js
node scripts/report-training-lab-v2-readiness.js
node tests/training-lab-asset-acceptance.test.js
node tests/training-lab-mapping-reconciliation.test.js
node tests/training-lab-anatomy-renderer.test.js
node tests/runtime-contracts.test.js
node tests/run-tests.js
```

The asset validator must report `valid: true`. Before approval it must also report `activationApproved: false`; that is expected.

The validator JSON names `rendererMode`, `blockedReasons`, `missingAssets`, `failedValidationGates`, and `nextRequiredHumanAction`. The readiness command emits a shorter operational report with the current renderer, activation blockers, missing assets, failed gates, and the next human action. These are internal diagnostics and are not rendered in normal user-facing UI. In a browser development console, the equivalent runtime snapshot is available from `SimurgTrainingLabUI.getRendererDiagnostics()`.

## 7. Complete visual approval

Use V1/V2 comparison mode and review every scenario in `tests/fixtures/training-lab-v2-visual-regression.json` at the listed mobile and desktop viewports. Check anatomy alignment, primary/secondary colors, hit areas, empty state and fallback behavior.

After the reviewer signs off, update the manifest activation record. This is the only production V2 activation switch; do not set runtime globals or alter renderer code to bypass it:

```json
{
  "status": "approved",
  "approvedBy": "reviewer identity",
  "approvedAt": "ISO-8601 timestamp",
  "visualRegressionFixture": "tests/fixtures/training-lab-v2-visual-regression.json"
}
```

Run the validator and full regression suite again. V2 may activate only when asset validation, regression tests and the recorded visual approval are all complete. If any gate fails, leave V1 fallback active.

Before changing the activation record, update the fixture `status` from `pending_real_assets` to `approved`, record the review evidence, and retain the reviewed screenshots/results with the release evidence. The final approval sequence is therefore: technical validator green → V1/V2 fixture review at every declared viewport and scenario → fixture status approved → activation record completed → validator green again → full suite green. Stop immediately and retain V1 fallback if any step fails. No deployment is part of this checklist.

V2 asset requests include the manifest `assetVersion` in their URL. Never reuse an asset version for different bytes. If a new package is incomplete or any contour fails runtime preflight, the renderer falls back as one unit to V1; it does not combine old and new anatomy files.
