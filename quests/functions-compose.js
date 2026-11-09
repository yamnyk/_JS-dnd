import { missingExport, wrongResult, passed, show, wrongCallCount, wrongArgCount } from './messages.js';

// Small functions the check hands over. `source` is how they are shown in a failure message.
const DOUBLE = { source: '(x) => x * 2', run: (x) => x * 2 };
const ADD_ONE = { source: '(x) => x + 1', run: (x) => x + 1 };
const MINUS_THREE = { source: '(x) => x - 3', run: (x) => x - 3 };
const SQUARE = { source: '(x) => x * x', run: (x) => x * x };
const LABEL = { source: '(x) => `n=${x}`', run: (x) => `n=${x}` };
const LENGTH = { source: '(text) => text.length', run: (text) => text.length };
const ADD_A = { source: "(text) => text + 'a'", run: (text) => text + 'a' };
const ADD_B = { source: "(text) => text + 'b'", run: (text) => text + 'b' };
const ADD_C = { source: "(text) => text + 'c'", run: (text) => text + 'c' };
// Left out of the random picks: a long chain of squares leaves the range where numbers are exact.
const NUMBERS = [DOUBLE, ADD_ONE, MINUS_THREE];

// [functions in the order they are given to compose, input]. The order matters in every case that has
// more than one function, so doing it left to right gives another answer. Zero, one, two, and three
// functions are all here, and so is a function that changes the type of the value.
const FIXED = [
  [[DOUBLE, ADD_ONE], 3],
  [[ADD_ONE, DOUBLE], 3],
  [[], 5],
  [[], 'text'],
  [[], 0],
  [[], { id: 1 }],
  [[], [1, 2]],
  [[DOUBLE], 4],
  [[SQUARE], -3],
  [[SQUARE, MINUS_THREE], 5],
  [[MINUS_THREE, SQUARE], 5],
  [[DOUBLE, ADD_ONE, MINUS_THREE], 10],
  [[MINUS_THREE, ADD_ONE, DOUBLE], 10],
  [[LABEL, DOUBLE], 4],
  [[DOUBLE, LENGTH], 'abc'],
  [[LENGTH, LABEL], 4],
  [[ADD_A, ADD_B, ADD_C], ''],
  [[ADD_C, ADD_B, ADD_A], 'x'],
];

const pick = (n) => Math.floor(Math.random() * n);
const randomCase = () => [Array.from({ length: pick(6) }, () => NUMBERS[pick(NUMBERS.length)]), pick(11) - 5];
const reference = (fns, input) => fns.reduceRight((result, fn) => fn.run(result), input);

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'functions-compose',
  rung: 2,
  subject: 'functions',
  tier: 'hard',
  complexity: 3,

  async check(mod) {
    if (typeof mod.compose !== 'function') return missingExport('compose', typeof mod.compose);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomCase());
    for (const [fns, input] of cases) {
      const names = fns.map((fn) => fn.source).join(', ');
      const call = `compose(${names})(${show(input)})`;
      const argumentCounts = [];
      const spies = fns.map(({ run }) => (...received) => {
        argumentCounts.push(received.length);
        return run(received[0]);
      });
      const composed = mod.compose(...spies);
      if (typeof composed !== 'function')
        return wrongResult(`typeof(compose(${names}))`, '"function"', show(typeof composed));
      // Building the new function must not run any of the functions it was given.
      if (argumentCounts.length !== 0) {
        return wrongCallCount(`compose(${names})`, 0, argumentCounts.length);
      }
      // The second call has to give the same answer as the first.
      for (let round = 0; round < 2; round++) {
        argumentCounts.length = 0;
        const wanted = reference(fns, input);
        const gave = composed(input);
        if (gave !== wanted) return wrongResult(call, show(wanted), show(gave));
        if (argumentCounts.length !== fns.length) {
          return wrongCallCount(call, fns.length, argumentCounts.length);
        }
        const tooMany = argumentCounts.find((count) => count !== 1);
        if (tooMany !== undefined) return wrongArgCount(call, tooMany);
      }
    }
    return passed('check.pass.everyTest');
  },
};
