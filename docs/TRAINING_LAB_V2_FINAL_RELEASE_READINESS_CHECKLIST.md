# Training Lab v2 Final Release Readiness Checklist

Status: code path frozen; production V2 blocked by design pending real assets and human approval.

This checklist is the immutable acceptance order for the first real Training Lab v2 asset package. Steps may not be skipped, reordered, combined, or treated as implicit. A failed or incomplete step stops the sequence and leaves the complete V1 fallback active.

## Immutable acceptance order

1. **Licensed master received** — receive the approved 1024 × 1536 RGBA front/back anatomy master without modifying it.
2. **Provenance metadata recorded** — record the HTTPS source, author/provider, license reference, and independently supplied master digest.
3. **SHA-256 verified** — calculate the received master SHA-256 and require an exact match with the independently recorded digest.
4. **22 masks validated** — validate exactly 22 full-canvas 8-bit alpha PNG masks, their fixed region IDs and views, bounds, uniqueness, overlap, generated contours, and unchanged 32 canonical / 22 visual contract.
5. **Dry-run acceptance** — run the documented acceptance command with `--dry-run`; retain its complete output as release evidence and do not write repository assets.
6. **Fingerprint match** — preserve the dry-run `packageFingerprint` and require the identical package, metadata, asset version, master, masks, and generated contours to reproduce it.
7. **Publish** — publish transactionally using `--expected-fingerprint <dry-run-packageFingerprint>`; missing or mismatched fingerprints and changed inputs must fail closed.
8. **Repository validation** — run the repository V2 validator against the published bytes and require all technical gates and SHA-256 checks to pass while activation remains pending.
9. **Mobile/desktop visual approval** — complete every declared V1/V2 comparison scenario and viewport; record reviewer identity, ISO timestamp, approved fixture, and retained visual evidence.
10. **V2 activation decision** — only after steps 1–9 are complete, make the explicit release decision, record approval in the manifest, rerun repository validation and the full regression suite, and retain V1 fallback if any check fails.

## Frozen invariants

- Production V2 cannot activate without a technically valid complete package and recorded visual approval.
- A missing base image, mask, contour, manifest field, checksum, or runtime preflight result keeps the renderer wholly on V1 fallback.
- V1 and V2 assets cannot be combined: V2 uses an all-or-nothing package, and every V2 request is isolated by its unique `assetVersion`.
- Publish cannot proceed without the exact expected fingerprint and unchanged, revalidated inputs.
- The analysis layer remains exactly 32 canonical mappings and the presentation layer remains exactly 22 visual regions.
- Bird Dog, Sled Push, Kettlebell Swing, Battle Rope, and Dumbbell Thruster remain documentation-only product decisions.
- No anatomy asset, mask, mapping, Gym, Logger, Polar, Coach, Analytics, or production UI behavior is changed by this freeze.

## Freeze control

The Training Lab v2 code path is frozen at this pre-asset boundary. Until a licensed package enters step 1, changes are limited to evidence, validation results, and corrections required by a demonstrated release blocker. Any proposed gate relaxation, acceptance-order change, mapping change, or production activation bypass requires a new explicit review and superseding checklist; it must not silently edit this contract.
