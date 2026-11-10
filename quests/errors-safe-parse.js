import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, wrongThrow, wrongThrown, passed, show } from './messages.js';

// Every error the check makes gets a number, so a failure message can tell the very same error from a copy.
const ids = new WeakMap();
let made = 0;
const makeError = (Type, message) => {
  const error = new Type(message);
  made += 1;
  ids.set(error, made);
  return error;
};

// A thrown value as a name and message, never as a sentence. A number after # marks an error the check made.
function describe(thrown) {
  if (!(thrown instanceof Error)) return typeof thrown === 'string' ? JSON.stringify(thrown) : typeof thrown;
  return `${thrown.name}(${JSON.stringify(String(thrown.message))})${ids.has(thrown) ? `#${ids.get(thrown)}` : ''}`;
}

function attempt(run) {
  try {
    return { value: run() };
  } catch (error) {
    return { threw: true, error };
  }
}

// The reference: only a SyntaxError is swallowed.
function reference(json, fallback) {
  try {
    return { value: JSON.parse(json), usedFallback: false };
  } catch (error) {
    if (error instanceof SyntaxError) return { value: fallback, usedFallback: true };
    throw error;
  }
}

// [json, fallback]. Covers the examples, every kind of fallback (including the falsy ones), text that is not
// valid JSON in many ways, and valid JSON that parses to a falsy value (0, false, null, an empty text, an empty
// array), which must be returned and not replaced by the fallback.
const FIXED = [
  ['{"a":1}', 'F'],
  ['nope', 'F'],
  ['nope', undefined],
  ['nope', null],
  ['nope', 0],
  ['nope', ''],
  ['nope', false],
  ['nope', { x: 1 }],
  ['', 'F'],
  ['   ', 'F'],
  ['{', []],
  ['{"a":1', 'F'],
  ['{"a":1,}', 'F'],
  ["{'a':1}", 'F'],
  ['{a:1}', 'F'],
  ['[1,2', 'F'],
  ['[1,]', 'F'],
  ['undefined', 'F'],
  ['NaN', 'F'],
  ['tru', 'F'],
  ['"abc', 'F'],
  ['0', 'F'],
  ['0', undefined],
  ['false', 'F'],
  ['false', null],
  ['null', 'F'],
  ['null', 0],
  ['""', 'F'],
  ['""', 0],
  ['[]', 'F'],
  ['{}', 'F'],
  ['"nope"', 'F'],
  ['  7  ', 'F'],
  ['[1,[2,3],{"k":"v"}]', 'F'],
  ['{"a":{"b":[true,null]}}', undefined],
  ['-12.5', 'F'],
];

// Values whose conversion to text throws something that is not a parse error. safeParse must let that
// error out unchanged. `source` is how the argument is shown in a failure message.
const TRAPS = [
  {
    source: '{ toString() { throw new RangeError("boom"); } }',
    Type: RangeError,
    make: (e) => ({
      toString: () => {
        throw e;
      },
    }),
  },
  {
    source: '{ [Symbol.toPrimitive]() { throw new TypeError("boom"); } }',
    Type: TypeError,
    make: (e) => ({
      [Symbol.toPrimitive]: () => {
        throw e;
      },
    }),
  },
  {
    source: '{ toString() { throw new Error("boom"); } }',
    Type: Error,
    make: (e) => ({
      toString: () => {
        throw e;
      },
    }),
  },
  {
    source: '{ get toString() { throw new RangeError("boom"); } }',
    Type: RangeError,
    make: (e) => ({
      get toString() {
        throw e;
      },
    }),
  },
];
const TRAP_FALLBACKS = ['F', undefined, 0, null];

const pick = (n) => Math.floor(Math.random() * n);
const VALUES = [0, 1, -5, 3.5, 'text', '', 'a,b', true, false, null, [], [1, 2, 3], {}, { a: 1, b: [2, { c: null }] }];
const BROKEN = [
  'nope',
  '{',
  '[1,2',
  '',
  ' ',
  "{'a':1}",
  '{a:1}',
  '{"a":1,}',
  '[1,]',
  'undefined',
  'NaN',
  '1 2',
  'tru',
  '"abc',
];
const FALLBACKS = [undefined, null, 0, '', false, 'none', -1, { x: 1 }, []];

function randomCase() {
  const fallback = FALLBACKS[pick(FALLBACKS.length)];
  const json = pick(2) === 0 ? JSON.stringify(VALUES[pick(VALUES.length)]) : BROKEN[pick(BROKEN.length)];
  return [json, fallback];
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'errors-safe-parse',
  rung: 4,
  subject: 'errors',
  tier: 'easy',
  complexity: 3,

  async check(mod) {
    if (typeof mod.safeParse !== 'function') return missingExport('safeParse', typeof mod.safeParse);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomCase());
    for (const [json, fallback] of cases) {
      const call = `safeParse(${show(json)}, ${show(fallback)})`;
      const wanted = reference(json, fallback);
      const result = attempt(() => mod.safeParse(json, fallback));
      if (result.threw) return wrongThrown(call, show(wanted.value), describe(result.error));
      const same = wanted.usedFallback
        ? Object.is(result.value, fallback)
        : isDeepStrictEqual(result.value, wanted.value);
      if (!same) {
        // A copy of the fallback looks the same when printed, so say what is wrong in code.
        if (wanted.usedFallback && isDeepStrictEqual(result.value, fallback)) {
          return wrongResult(`safeParse(${show(json)}, fallback) === fallback`, 'true', 'false');
        }
        return wrongResult(call, show(wanted.value), show(result.value));
      }
    }
    for (const [index, { source, Type, make }] of TRAPS.entries()) {
      const fallback = TRAP_FALLBACKS[index];
      const error = makeError(Type, 'boom');
      const call = `safeParse(${source}, ${show(fallback)})`;
      const result = attempt(() => mod.safeParse(make(error), fallback));
      if (!result.threw) return wrongThrow(call, describe(error), undefined);
      if (result.error !== error) return wrongThrow(call, describe(error), describe(result.error));
    }
    return passed('check.pass.everyTest');
  },
};
