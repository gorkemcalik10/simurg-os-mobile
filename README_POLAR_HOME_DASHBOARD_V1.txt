SIMURG OS — Polar Home Dashboard v1

Base: SIMURG_OS_APP_ICON_CORE_MATCHED_V1

Added:
- New Ana Sayfa / Daily Coaching home screen inspired by Polar/WHOOP-style decision-first mobile UX.
- New Toparlanma Detayı screen for Polar Loop recovery signals.
- recoveryEntries data store keyed by date.
- Universal Import support for importType/type: polar_recovery, recovery, polar.
- Polar sample JSON helper in Data Center.
- Workout Logger Seans Kontekst panel using readiness, sleep, HRV, resting HR, physical load and coach note.
- Apple Watch session data remains preserved at the bottom / existing panels.
- Existing modules and Cloud Sync structure preserved.

Example Polar Recovery JSON:
{
  "importType": "polar_recovery",
  "source": "polar_loop_gen2",
  "date": "2026-07-12",
  "sleepDurationMinutes": 432,
  "sleepScore": 78,
  "nightlyRecharge": 76,
  "hrvMs": 62,
  "restingHr": 48,
  "activityLoad": 61,
  "energy": 72,
  "notes": "Polar Loop sabah recovery girişi"
}
