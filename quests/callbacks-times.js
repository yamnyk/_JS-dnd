import { missingExport, wrongResult, wrongCallCount, wrongArgCount, passed, show } from './messages.js';

// Small functions the check hands over. `source` is how the call is shown in a failure message. They return
// all kinds of values, falsy ones too, because times must not care what fn gives back.
const PLUS_ONE = { source: '(i) => i + 1', run: (i) => i + 1 };
const ZERO = { source: '() => 0', run: () => 0 };
const FALSE = { source: '() => false', run: () => false };
const NOTHING = { source: '() => undefined', run: () => undefined };
const DONE = { source: "() => 'done'", run: () => 'done' };
const NULL = { source: '() => null', run: () => null };
const FUNCTIONS = [PLUS_ONE, ZERO, FALSE, NOTHING, DONE, NULL];

// [n, function]. Covers the example, zero, one, two, and every kind of value fn can return, truthy or falsy.
const FIXED = [
  [3, PLUS_ONE],
  [3, ZERO],
  [3, FALSE],
  [3, NOTHING],
  [3, DONE],
  [3, NULL],
  [0, PLUS_ONE],
  [0, ZERO],
  [1, PLUS_ONE],
  [1, ZERO],
  [2, FALSE],
  [5, DONE],
  [7, NOTHING],
];

const pick = (n) => Math.floor(Math.random() * n);

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'callbacks-times',
  rung: 3,
  subject: 'callbacks',
  tier: 'easy',
  complexity: 2,

  async check(mod) {
    if (typeof mod.times !== 'function') return missingExport('times', typeof mod.times);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push([pick(10), FUNCTIONS[pick(FUNCTIONS.length)]]);
    for (const [n, { source, run }] of cases) {
      const call = `times(${n}, ${source})`;
      const calls = [];
      const spy = (...received) => {
        calls.push(received);
        return run(...received);
      };
      const gave = mod.times(n, spy);
      if (calls.length !== n) return wrongCallCount(call, n, calls.length);
      const tooMany = calls.find((received) => received.length !== 1);
      if (tooMany !== undefined) return wrongArgCount(call, tooMany.length);
      for (let k = 0; k < n; k++) {
        if (!Object.is(calls[k][0], k))
          return wrongResult(`${call}, call ${k + 1}`, `fn(${k})`, `fn(${show(calls[k][0])})`);
      }
      if (gave !== undefined) return wrongResult(call, 'undefined', show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
