'use strict';

const assert = require('node:assert/strict');
const activity = require('../simurg-activity-classification.js');

const cases = [
  ['FUNCTIONAL_TRAINING', 'strength'],
  ['Functional Training', 'strength'],
  ['functional_training', 'strength'],
  ['FuNcTiOnAl_TrAiNiNg', 'strength'],
  ['FITNESS', 'strength'],
  ['FiTnEsS', 'strength'],
  ['SWIMMING', 'swimming'],
  ['SwImMiNg', 'swimming'],
  ['TABLE_TENNIS', 'racquet'],
  ['Table Tennis', 'racquet'],
  ['OTHER_INDOOR', 'strength'],
  ['Other Indoor', 'strength'],
  ['Fonksiyonel Antrenman', 'strength'],
  ['Ağırlık Antrenmanı', 'strength'],
  ['Yüzme', 'swimming']
];

for (const [input, expected] of cases) {
  assert.equal(activity.key(input), expected, input);
}

assert.equal(activity.isStrength('FUNCTIONAL_TRAINING'), true);
assert.equal(activity.isStrength('SWIMMING'), false);
assert.equal(activity.isStrength('TABLE_TENNIS'), false);
process.stdout.write(`✓ ${cases.length} canonical provider and Turkish label cases passed.\n`);
