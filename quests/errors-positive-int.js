import { missingExport, wrongResult, wrongThrow, wrongThrown, passed, show } from './messages.js';

// A thrown value by its name, never as a sentence.
const nameOf = (thrown) => (thrown instanceof Error ? thrown.name : typeof thrown);

function attempt(run) {
  try {
    return { value: run() };
  } catch (error) {
    return { threw: true, error };
  }
}

// The reference: not a whole number is a TypeError, a whole number below 1 is a RangeError, else no error.
function wantedError(value) {
  if (!Number.isInteger(value)) return TypeError;
  return value < 1 ? RangeError : null;
}

// Covers the examples, every kind of value that is not a whole number (texts, fractions, NaN, both infinities,
// null, undefined, booleans, arrays, objects), the whole numbers below 1, the boundary 1, and large safe
// integers. A fraction below 1 is a TypeError, not a RangeError, and a text that looks like a number is a
// TypeError.
const FIXED = [
  3,
  1,
  2,
  100,
  9007199254740991,
  0,
  -1,
  -100,
  -9007199254740991,
  '3',
  '1',
  '0',
  '-1',
  '',
  'abc',
  '3.5',
  3.5,
  1.5,
  0.5,
  -0.5,
  -2.5,
  1.0000001,
  NaN,
  Infinity,
  -Infinity,
  null,
  undefined,
  true,
  false,
  [],
  [3],
  [1, 2],
  {},
  { value: 3 },
];

const pick = (n) => Math.floor(Math.random() * n);
const OTHERS = [
  '5',
  '',
  'x',
  ' 7 ',
  2.5,
  0.25,
  -7.75,
  NaN,
  Infinity,
  -Infinity,
  null,
  undefined,
  true,
  false,
  [],
  [5],
  {},
  { a: 1 },
];

function randomValue(i) {
  if (i % 4 === 0) return OTHERS[pick(OTHERS.length)];
  if (i % 4 === 1) return 0 - pick(1000);
  return 1 + pick(1000);
}

// The message rule applies to numbers and texts only: for them the message must contain the value as String shows it.
const mentionsValue = (value) => typeof value === 'number' || typeof value === 'string';

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'errors-positive-int',
  rung: 4,
  subject: 'errors',
  tier: 'medium',
  complexity: 3,

  async check(mod) {
    if (typeof mod.requirePositiveInt !== 'function') {
      return missingExport('requirePositiveInt', typeof mod.requirePositiveInt);
    }
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomValue(i));
    for (const value of cases) {
      const call = `requirePositiveInt(${show(value)})`;
      const Wanted = wantedError(value);
      const result = attempt(() => mod.requirePositiveInt(value));
      if (Wanted === null) {
        if (result.threw) return wrongThrown(call, show(value), nameOf(result.error));
        if (!Object.is(result.value, value)) return wrongResult(call, show(value), show(result.value));
        continue;
      }
      if (!result.threw) return wrongThrow(call, Wanted.name, undefined);
      if (!(result.error instanceof Wanted)) return wrongThrow(call, Wanted.name, nameOf(result.error));
      if (mentionsValue(value) && !String(result.error.message).includes(String(value))) {
        const wantedText = JSON.stringify(`...${String(value)}...`);
        return wrongThrow(
          call,
          `${Wanted.name}(${wantedText})`,
          `${nameOf(result.error)}(${JSON.stringify(String(result.error.message))})`,
        );
      }
    }
    return passed('check.pass.everyTest');
  },
};
