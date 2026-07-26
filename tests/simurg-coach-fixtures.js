'use strict';

function dateString(value) {
  return value.getUTCFullYear()+'-'+String(value.getUTCMonth()+1).padStart(2,'0')+'-'+String(value.getUTCDate()).padStart(2,'0');
}
function addDays(value, amount) {
  const parts = value.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1]-1, parts[2]));
  date.setUTCDate(date.getUTCDate()+amount);
  return dateString(date);
}
function baseData() {
  return {
    schemaVersion: 1,
    workouts: [], metrics: [], nutrition: [], recovery: [], appleWatch: [], dailyNotes: [], weeklyNotes: [],
    customGymPrograms: {}, programNames: {}, exerciseLoadProfiles: {},
    polarWorkouts: { daily: {}, latest: null },
    polarActivity: { daily: {}, latest: null },
    polarProfile: { latest: { restingHeartRate: 55 } },
    polarSleep: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarNightlyRecharge: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarContinuousHr: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarCardioLoad: { daily: {}, latest: null, lastSyncAt: null, lastError: null },
    polarConnection: { connected: true, status: 'connected', lastSyncAt: null, lastError: null, source: 'Polar AccessLink' }
  };
}
function recoveryDay(data, date, values = {}) {
  data.polarNightlyRecharge.daily[date] = {
    date,
    heartRateVariabilityAvg: values.hrv == null ? 60 : values.hrv,
    heartRateAvg: values.restingHr == null ? 55 : values.restingHr,
    ansCharge: values.ansCharge == null ? 3 : values.ansCharge,
    nightlyRechargeStatus: values.nightlyRechargeStatus == null ? 3 : values.nightlyRechargeStatus
  };
  data.polarSleep.daily[date] = {
    date,
    durationSeconds: (values.sleepMinutes == null ? 450 : values.sleepMinutes) * 60,
    sleepScore: values.sleepScore == null ? 80 : values.sleepScore,
    deepSleep: 5400,
    remSleep: 7200,
    lightSleep: 14400
  };
  data.polarCardioLoad.daily[date] = {
    date,
    cardioLoad: values.cardioLoad == null ? 40 : values.cardioLoad,
    strain: values.strain == null ? 40 : values.strain,
    tolerance: values.tolerance == null ? 40 : values.tolerance,
    cardioLoadRatio: values.cardioLoadRatio == null ? 1 : values.cardioLoadRatio,
    cardioLoadStatus: 'MAINTAINING'
  };
}
function addBaseline(data, date, days = 28) {
  for (let offset = days; offset >= 1; offset -= 1) recoveryDay(data, addDays(date, -offset));
  return data;
}
function gymRow(date, overrides = {}) {
  return {
    date, day: 'Wednesday', exercise: 'Incline DB Press', bodyPart: 'Chest',
    sets: 3, reps: 8, weight: 22.5, rpe: 6.5, form: 'Good', pain: 'None',
    ...overrides
  };
}
function polarWorkout(date, overrides = {}) {
  return {
    date, type: 'polar_flow_workout', source: 'Polar Flow', startTime: '18:00',
    activityType: 'STRENGTH_TRAINING', workoutType: 'Strength training',
    durationMinutes: 55, activeCal: 360, avgHR: 118, maxHR: 154, cardioLoad: 32,
    ...overrides
  };
}

const TODAY = '2026-07-29';

function goodRecovery() {
  const data = addBaseline(baseData(), TODAY);
  recoveryDay(data, TODAY, { hrv: 69, restingHr: 51, sleepMinutes: 490, sleepScore: 90, cardioLoad: 34, strain: 34, tolerance: 42, cardioLoadRatio: 0.81 });
  data.workouts.push(gymRow(TODAY));
  data.polarWorkouts.daily[TODAY] = [polarWorkout(TODAY)];
  return { id: 'good_recovery', label: 'İyi recovery', date: TODAY, data };
}
function poorSleepLowHrv() {
  const data = addBaseline(baseData(), TODAY);
  recoveryDay(data, TODAY, { hrv: 42, restingHr: 64, sleepMinutes: 300, sleepScore: 48, cardioLoad: 55, strain: 58, tolerance: 38, cardioLoadRatio: 1.53 });
  return { id: 'poor_sleep_low_hrv', label: 'Kötü uyku + düşük HRV', date: TODAY, data };
}
function highCardioLoad() {
  const data = addBaseline(baseData(), TODAY);
  recoveryDay(data, TODAY, { hrv: 57, restingHr: 57, sleepMinutes: 430, sleepScore: 76, cardioLoad: 84, strain: 80, tolerance: 45, cardioLoadRatio: 1.78 });
  return { id: 'high_cardio_load', label: 'Yüksek Cardio Load', date: TODAY, data };
}
function painBadForm() {
  const data = addBaseline(baseData(), TODAY);
  recoveryDay(data, TODAY, { hrv: 71, restingHr: 50, sleepMinutes: 500, sleepScore: 92, cardioLoad: 30, strain: 30, tolerance: 44, cardioLoadRatio: 0.68 });
  data.workouts.push(gymRow(TODAY, { exercise: 'Flat DB Press', rpe: 6, form: 'Bad', pain: 'Mild' }));
  return { id: 'pain_bad_form', label: 'Ağrı + kötü form', date: TODAY, data };
}
function missingPolar() {
  const data = baseData();
  data.workouts.push(gymRow(TODAY, { exercise: 'Single Arm Cable Row', rpe: 7, form: 'Good', pain: 'None' }));
  return { id: 'missing_polar', label: 'Eksik Polar verisi', date: TODAY, data };
}
function racketSportDay() {
  const data = addBaseline(baseData(), TODAY);
  recoveryDay(data, TODAY, { hrv: 63, restingHr: 54, sleepMinutes: 450, sleepScore: 82 });
  data.appleWatch.push({
    date: TODAY, activityType: 'Tennis', duration: '01:20', activeCal: 620, avgHR: 136, maxHR: 174
  });
  return { id: 'racket_sport_day', label: 'Tenis/badminton sonrası gün', date: TODAY, data };
}
function repeatedPattern() {
  const data = addBaseline(baseData(), TODAY);
  const dates = [];
  for (let offset = 12; offset >= 1; offset -= 1) dates.push(addDays(TODAY, -offset));
  dates.forEach((date, index) => {
    const lowSleep = index % 3 === 0;
    recoveryDay(data, date, {
      sleepMinutes: lowSleep ? 330 : 455,
      sleepScore: lowSleep ? 55 : 82,
      hrv: lowSleep ? 50 : 62,
      restingHr: lowSleep ? 60 : 54
    });
    data.workouts.push(gymRow(date, {
      exercise: index % 2 ? 'Bench Supported DB Row' : 'Incline DB Press',
      rpe: lowSleep ? 8.7 : 6.4,
      reps: lowSleep ? 6 : 9
    }));
  });
  recoveryDay(data, TODAY, { hrv: 58, restingHr: 56, sleepMinutes: 420, sleepScore: 76 });
  return { id: 'repeated_pattern', label: 'Tekrarlanan geçmiş patern', date: TODAY, data };
}

module.exports = {
  TODAY,
  addDays,
  baseData,
  recoveryDay,
  addBaseline,
  gymRow,
  polarWorkout,
  scenarios: [
    goodRecovery(),
    poorSleepLowHrv(),
    highCardioLoad(),
    painBadForm(),
    missingPolar(),
    racketSportDay(),
    repeatedPattern()
  ]
};
