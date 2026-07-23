const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const polar = fs.readFileSync(path.join(root, 'polar-workout.js'), 'utf8');
const premium = fs.readFileSync(path.join(root, 'premium-standard.js'), 'utf8');

const helperMatch = index.match(/function escapeAttr\(v\)\{[^\n]+\}/);
assert.ok(helperMatch, 'escapeAttr helper must remain available to active renderers');
const context = {};
vm.runInNewContext(`${helperMatch[0]};this.escapeAttr=escapeAttr;`, context);

const payloads = [
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '"><img src=x onerror=alert(1)>',
  "';alert(1);//",
  '</button><script>alert(1)</script>',
  'Göğüs & Omuz — İyi Form, Ağrı Yok'
];
const maliciousGymId = "x' onpointerenter='alert(1)";
const maliciousWorkoutDate = '<img src=x onerror=alert(1)>';
const maliciousLocalTimestamp = '<svg onload=alert(1)>';
const normalDate = '2026-07-23';

function decodeHtml(value) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

for (const payload of payloads) {
  const escaped = context.escapeAttr(payload);
  assert.equal(decodeHtml(escaped), payload, `visible text must round-trip: ${payload}`);
  assert.ok(!escaped.includes('<script'), 'escaped output must not create script elements');
  assert.ok(!escaped.includes('<img'), 'escaped output must not create image elements');
  assert.ok(!escaped.includes('<svg'), 'escaped output must not create svg elements');
}
for (const value of [maliciousGymId, maliciousWorkoutDate, maliciousLocalTimestamp, normalDate]) {
  assert.equal(decodeHtml(context.escapeAttr(value)), value, `encoded value must round-trip as text: ${value}`);
}

assert.match(index, /data-workout-action="edit-exercise"/);
assert.match(index, /data-workout-action="edit-set"/);
assert.match(index, /data-workout-action="add-set"/);
assert.doesNotMatch(index, /onclick="openEditExercise\('\$\{/);
assert.doesNotMatch(index, /onclick="addSetToExercise\('\$\{/);

assert.match(index, /data-report-date="\$\{escapeAttr\(date\)\}"/);
assert.doesNotMatch(index, /onclick="selectedDate='\$\{date\}/);
assert.match(index, /data-activity-action="note"/);
assert.match(index, /data-activity-action="delete"/);

for (const action of ['add-set', 'save', 'history', 'clear', 'delete']) {
  assert.match(index, new RegExp(`data-gym-action="${action}"`), `Gym ${action} action must use inert data`);
}
assert.match(index, /data-gym-key="\$\{gymSafe\(item\.key\)\}"/);
assert.match(index, /if\(action==='add-set'\) addGymSet\(key\)/);
assert.match(index, /else if\(action==='save'\) saveGymExercise\(key\)/);
assert.match(index, /else if\(action==='history'\) toggleGymHistory\(key\)/);
assert.match(index, /else if\(action==='clear'\) clearGymExercise\(key\)/);
assert.match(index, /else if\(action==='delete'\) deleteGymExercise\(key\)/);
assert.doesNotMatch(index, /onclick=['"]addGymSet\(/);
assert.doesNotMatch(index, /onclick=['"]saveGymExercise\(/);
assert.doesNotMatch(index, /onclick=['"]toggleGymHistory\(/);
assert.doesNotMatch(index, /onclick=['"]clearGymExercise\(/);
assert.doesNotMatch(index, /onclick=['"]deleteGymExercise\(/);

assert.match(index, /\$\{gymSafe\(trDate\(s\.date\)\)\}/);
assert.ok(
  (index.match(/\$\{escapeAttr\(trDate\(date\)\)\}/g) || []).length >= 4,
  'base and active Daily Summary date renderers must encode visible dates'
);
assert.match(index, /latestDate==='-'\?'-':escapeAttr\(trDate\(latestDate\)\)/);
assert.match(index, /b\.date\?escapeAttr\(trDate\(b\.date\)\):'-'/);
assert.match(index, /strong\.textContent=String\(value\?\?''\)/);
assert.doesNotMatch(index, /<b>\$\{lastLabel\}<\/b>/);

assert.match(polar, /data-pw-date="/);
assert.match(polar, /data-pw-session-index="/);
assert.doesNotMatch(polar, /onclick="polarWorkoutSelectSession\(/);
assert.doesNotMatch(polar, /onclick="polarWorkoutSelectDate\('/);

assert.match(premium, /data-gp-polar-date="/);
assert.match(premium, /data-gp-polar-start="/);
assert.doesNotMatch(premium, /onclick="simurgOpenPolarWorkoutFor\('/);

assert.match(index, /ex\.slice\(0,3\)\.map\(escapeAttr\)/);
assert.match(index, /types\.map\(escapeAttr\)\.join\(' \+ '\)/);
assert.match(index, /escapeAttr\(activityText\)/);
assert.match(index, /escapeAttr\(recommendation\)/);
assert.match(index, /escapeAttr\(first\.exercise\)/);
assert.match(index, /escapeAttr\(s\.notes\)/);

console.log('✓ Stored DOM-XSS source contracts (runtime execution is tested separately in browser)');
