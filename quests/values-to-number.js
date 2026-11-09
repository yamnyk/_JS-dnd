import { missingExport, wrongResult, passed } from './messages.js';

// Each case builds its input fresh, so the player's function never gets a shared array or object.
const FIXED = [
  ['"42"', () => '42', 42],
  ['" 7 "', () => ' 7 ', 7],
  ['""', () => '', null],
  ['"abc"', () => 'abc', null],
  ['null', () => null, null],
  ['5', () => 5, 5],
  ['0', () => 0, 0],
  ['"0"', () => '0', 0],
  ['"  "', () => '  ', null],
  ['"12px"', () => '12px', null],
  ['"-3.5"', () => '-3.5', -3.5],
  ['NaN', () => NaN, null],
  ['undefined', () => undefined, null],
  ['true', () => true, null],
  ['false', () => false, null],
  ['[]', () => [], null],
  ['{}', () => ({}), null],
];

const letters = 'abcdefghijklmnopqrstuvwxyz';
const pick = (n) => Math.floor(Math.random() * n);
const randomWord = () => Array.from({ length: 1 + pick(6) }, () => letters[pick(letters.length)]).join('');
const padding = () => ' '.repeat(pick(3));
const randomNumber = () => (pick(2001) - 1000) / 10;

const MAKERS = [
  () => {
    const n = randomNumber();
    return [n, n];
  },
  () => {
    const n = randomNumber();
    return [`${padding()}${n}${padding()}`, n];
  },
  () => [randomWord(), null],
  () => [`${pick(1000)}${randomWord()}`, null],
  () => [padding(), null],
];

// JSON.stringify drops undefined and turns NaN into null, so those two are spelled out.
const show = (value) => (value === undefined || Number.isNaN(value) ? String(value) : JSON.stringify(value));

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'values-to-number',
  rung: 1,
  subject: 'values',
  tier: 'hard',
  complexity: 3,

  async check(mod) {
    if (typeof mod.toNumberOrNull !== 'function') return missingExport('toNumberOrNull', typeof mod.toNumberOrNull);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      const [input, wanted] = MAKERS[i % MAKERS.length]();
      cases.push([show(input), () => input, wanted]);
    }
    for (const [label, make, wanted] of cases) {
      const gave = mod.toNumberOrNull(make());
      if (gave !== wanted) return wrongResult(`toNumberOrNull(${label})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
