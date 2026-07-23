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

assert.match(index, /data-workout-action="edit-exercise"/);
assert.match(index, /data-workout-action="edit-set"/);
assert.match(index, /data-workout-action="add-set"/);
assert.doesNotMatch(index, /onclick="openEditExercise\('\$\{/);
assert.doesNotMatch(index, /onclick="addSetToExercise\('\$\{/);

assert.match(index, /data-report-date="\$\{escapeAttr\(date\)\}"/);
assert.doesNotMatch(index, /onclick="selectedDate='\$\{date\}/);
assert.match(index, /data-activity-action="note"/);
assert.match(index, /data-activity-action="delete"/);

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

console.log('✓ Stored DOM-XSS rendering contracts');
