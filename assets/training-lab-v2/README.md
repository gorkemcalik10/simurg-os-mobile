# Training Lab v2 anatomy assets

This directory intentionally contains no simulated anatomy artwork or empty file posing as a base image. The runtime remains on the legacy renderer until a real source package passes validation; the acceptance command creates `anatomy-base.png` only after the real package passes its gates.

The fixed product contract is 32 canonical analysis mappings and 22 visual regions. Production remains on the complete V1 fallback until licensed assets pass technical validation and mobile/desktop visual approval. Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain unresolved documentation-only decisions; importing assets must not change their mappings.

## Fixed asset contract

- One combined 1024 × 1536 atlas (2:3), origin at the top-left.
- Front view: `x=0, y=0, width=512, height=1536`.
- Back view: `x=512, y=0, width=512, height=1536`.
- Base: non-interlaced 8-bit PNG. Masks: non-interlaced 8-bit PNG with alpha.
- Every mask uses the full atlas canvas; transparent pixels outside its region are retained.
- Every ready region records its measured alpha `bounds` in atlas pixels. The validator allows one pixel of export tolerance.
- Region IDs, views and canonical muscle IDs must exactly match the registry.

Activation requirements:

1. Approve one front/back anatomy master and record its source URL, author, license reference, and SHA-256 in `anatomy-manifest.json`.
2. Export the base image at exactly 1024 × 1536 pixels without cropping, scaling, padding or moving either view.
3. Export all 22 masks from that same master image as transparent PNG files, using the region IDs in the manifest as filenames.
4. Set every region and the manifest to `ready` only after the files are final.
5. Create a source metadata JSON file with required `sourceUrl`, `license`, `author` and expected `sha256`. The URL must use HTTPS. The expected hash must come from the approved source inventory or an independently recorded transfer checksum; the acceptance tool never treats a calculated hash alone as provenance.
6. Run the acceptance pipeline. It verifies or calculates SHA-256, measures all bounds, creates contour files and writes the ready manifest without manual bounds entry:

   `node scripts/accept-training-lab-v2-assets.js --master <anatomy-master.png> --masks <mask-directory> --metadata <source-metadata.json> --dry-run`

7. Remove `--dry-run` only after reviewing the report, and add `--expected-fingerprint <dry-run-packageFingerprint>`. Publishing refuses a missing or mismatched dry-run fingerprint, rechecks unchanged input hashes and the technical manifest contract, is transactional, and preserves this README. Then run `node scripts/validate-training-lab-v2-assets.js` and the Training Lab regression tests.
8. Keep `activation.status` at `pending_visual_approval` while mobile and desktop V1/V2 comparisons are reviewed.
9. Only after recorded visual approval, set the approval identity, ISO timestamp and fixture path and change `activation.status` to `approved`. Runtime V2 activation is blocked until all four approval fields are valid.

The validator checks dimensions, alpha coverage, front/back boundaries, recorded region bounds, base/mask overlap and the complete 22-region contract. The visual regression fixture lives at `tests/fixtures/training-lab-v2-visual-regression.json` and remains pending until approved real assets exist.

For a diagnostic V1/V2 comparison, set `SimurgTrainingLabRendererDebug = 'compare'` and provide the validated manifest as `SimurgTrainingLabV2Manifest` before the Training Lab UI loads. Comparison mode may render a technically valid candidate while approval is pending; production rendering still remains on V1 until approval is recorded.

Contour JSON is generated directly from each accepted mask's alpha boundary. The renderer loads all 22 contour files asynchronously. If any contour cannot be loaded or fails its coordinate contract, the entire renderer returns to V1; production never mixes V2 masks with legacy hit paths.
