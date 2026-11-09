import { missingExport, wrongResult, passed } from './messages.js';

// Each case builds its value fresh, so the player's function never gets a shared array or object.
const FIXED = [
  ['5', () => 5, 'number'],
  ['null', () => null, 'null'],
  ['[1]', () => [1], 'array'],
  ['undefined', () => undefined, 'undefined'],
  ['[]', () => [], 'array'],
  ['0', () => 0, 'number'],
  ['NaN', () => NaN, 'number'],
  ['""', () => '', 'string'],
  ['true', () => true, 'boolean'],
  ['{}', () => ({}), 'object'],
  ['() => 1', () => () => 1, 'function'],
  ['10n', () => 10n, 'bigint'],
];

const letters = 'abcdefghijklmnopqrstuvwxyz';
const pick = (n) => Math.floor(Math.random() * n);
const randomWord = () => Array.from({ length: pick(8) }, () => letters[pick(letters.length)]).join('');
const randomItems = () => Array.from({ length: pick(4) }, () => pick(10));

const MAKERS = [
  () => pick(2001) - 1000,
  () => randomWord(),
  () => pick(2) === 0,
  () => null,
  () => undefined,
  () => randomItems(),
  () => ({ [randomWord() || 'key']: pick(10) }),
];

const reference = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

// JSON.stringify drops undefined and turns NaN into null, so those two are spelled out.
const show = (value) => (value === undefined || Number.isNaN(value) ? String(value) : JSON.stringify(value));

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'values-describe',
  rung: 1,
  subject: 'values',
  tier: 'medium',
  complexity: 2,

  async check(mod) {
    if (typeof mod.describeValue !== 'function') return missingExport('describeValue', typeof mod.describeValue);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      const value = MAKERS[i % MAKERS.length]();
      cases.push([show(value), () => value, reference(value)]);
    }
    for (const [label, make, wanted] of cases) {
      const gave = mod.describeValue(make());
      if (gave !== wanted) return wrongResult(`describeValue(${label})`, JSON.stringify(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
