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
  "type": "polar_recovery",
  "importType": "polar_recovery",
  "source": "synthetic_test_fixture",
  "fixture": true,
  "synthetic": true,
  "date": "2099-01-01",
  "device": "Synthetic Polar Device",
  "sleepDurationMinutes": 480,
  "sleepScore": 70,
  "nightlyRecharge": 65,
  "hrvMs": 50,
  "restingHr": 60,
  "activityLoad": 40,
  "energy": 70,
  "notes": "SYNTHETIC TEST DATA — NOT USER DATA"
}
