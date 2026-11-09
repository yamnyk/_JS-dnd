import { missingExport, wrongResult, passed, show, wrongCallCount, wrongArgCount } from './messages.js';

// Small functions the check hands over. `source` is how the call is shown in a failure message.
const DOUBLE = { source: '(x) => x * 2', run: (x) => x * 2 };
const ADD_ONE = { source: '(x) => x + 1', run: (x) => x + 1 };
const MINUS_THREE = { source: '(x) => x - 3', run: (x) => x - 3 };
const DOUBLE_PLUS_ONE = { source: '(x) => x * 2 + 1', run: (x) => x * 2 + 1 };
const SQUARE = { source: '(x) => x * x', run: (x) => x * x };
const ADD_A = { source: "(text) => text + 'a'", run: (text) => text + 'a' };
const FUNCTIONS = [DOUBLE, ADD_ONE, MINUS_THREE, DOUBLE_PLUS_ONE];

// [function, value, times]. A times of null means "leave the third argument out", so the default is used.
// Covers the examples, the default, zero, one, a falsy value, a text, and a function that is not
// commutative with itself, so calling it on the original value every time gives another answer.
const FIXED = [
  [DOUBLE, 1, 3],
  [ADD_ONE, 5, null],
  [ADD_ONE, 5, 0],
  [ADD_ONE, 5, 1],
  [DOUBLE, 3, 2],
  [DOUBLE, 3, null],
  [MINUS_THREE, 10, 4],
  [DOUBLE_PLUS_ONE, 0, 4],
  [DOUBLE_PLUS_ONE, 7, 0],
  [SQUARE, 3, 2],
  [ADD_A, '', 3],
  [ADD_A, 'x', 0],
  [ADD_A, 'x', null],
  [ADD_ONE, 0, 6],
  [ADD_ONE, -4, 10],
];

const pick = (n) => Math.floor(Math.random() * n);
const reference = (fn, value, times) => {
  let result = value;
  for (let i = 0; i < times; i++) result = fn(result);
  return result;
};

function randomCase(i) {
  const fn = FUNCTIONS[pick(FUNCTIONS.length)];
  // Every fifth case leaves times out, and every seventh asks for zero.
  const times = i % 5 === 0 ? null : i % 7 === 0 ? 0 : pick(7);
  return [fn, pick(21) - 10, times];
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'functions-apply-n',
  rung: 2,
  subject: 'functions',
  tier: 'medium',
  complexity: 2,

  async check(mod) {
    if (typeof mod.applyN !== 'function') return missingExport('applyN', typeof mod.applyN);
    const cases = [...FIXED];
    for (let i = 0; i < 21; i++) cases.push(randomCase(i));
    for (const [{ source, run }, value, times] of cases) {
      const wantedTimes = times === null ? 1 : times;
      const call = `applyN(${source}, ${show(value)}${times === null ? '' : `, ${times}`})`;
      const wanted = reference(run, value, wantedTimes);
      const argumentCounts = [];
      const spy = (...received) => {
        argumentCounts.push(received.length);
        return run(received[0]);
      };
      const gave = times === null ? mod.applyN(spy, value) : mod.applyN(spy, value, times);
      if (gave !== wanted) return wrongResult(call, show(wanted), show(gave));
      if (argumentCounts.length !== wantedTimes) {
        return wrongCallCount(call, wantedTimes, argumentCounts.length);
      }
      const tooMany = argumentCounts.find((count) => count !== 1);
      if (tooMany !== undefined) return wrongArgCount(call, tooMany);
    }
    return passed('check.pass.everyTest');
  },
};
