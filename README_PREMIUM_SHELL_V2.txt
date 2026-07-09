SIMURG OS PREMIUM SHELL V2

Base: SIMURG_OS_PREMIUM_SHELL_V1.

Scope: mobile-only Logger progression.

What changed:
- Logger became a premium Session Summary screen on mobile.
- Added top hero card with selected day, program, date, sets, volume, reps, and activity duration.
- Added Coach Summary card under the Logger hero.
- Existing workout details remain available for correction/editing.
- + Set quick entry is hidden inside Logger mobile because primary workout entry belongs to Gym.
- Gym, Recovery, Polar, Data Center and core data storage were not rewritten.
- Desktop layout was not intentionally changed.

Testing:
Run python3 -m http.server 8000 inside this folder and open /index.html?v=premium2 on iPhone.
