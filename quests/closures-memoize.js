import { missingExport, wrongResult, passed, show, wrongCallCount } from './messages.js';

// Functions the check hands over. `source` is how they are shown in a failure message, `make` gives a fresh
// copy per scenario so the ones that keep a count start from zero every time.
const DOUBLE = { source: '(x) => x * 2', make: () => (x) => x * 2 };
const SQUARE = { source: '(x) => x * x', make: () => (x) => x * x };
const PAIR = { source: '(a, b) => a * 100 + b', make: () => (a, b) => a * 100 + b };
// Gives another answer for every different list of arguments, so a mix-up of two calls shows in the result.
const ARGS = {
  source: '(...args) => JSON.stringify(args)',
  make:
    () =>
    (...args) =>
      JSON.stringify(args),
};
const NEXT = {
  source: '() => ++count',
  make: () => {
    let count = 0;
    return () => ++count;
  },
};
const ZERO = { source: '() => 0', make: () => () => 0 };
const EMPTY = { source: "() => ''", make: () => () => '' };
const NO = { source: '() => false', make: () => () => false };
const NULL = { source: '() => null', make: () => () => null };
const NOTHING = { source: '() => undefined', make: () => () => undefined };

// A scenario is a list of steps. ['make', memo, function] builds a memoized function. ['call', memo, args]
// calls it. The functions are shared by name, so two memoized functions can be built from the same one.
// The expected values and the expected number of runs come from a reference model with a Map.
const make = (memo, fn) => ['make', memo, fn];
const call = (memo, ...args) => ['call', memo, args];

// Texts that hold a character someone could use to glue arguments into one key. ('a' + sep + 'b') is one
// argument, ('a', 'b') is two.
const SEPARATORS = [',', '|', ':', ';', ' ', '-', '_', '/', '.', '#', '+', '&', '=', '"', '[', ']', ', '];
const separated = SEPARATORS.map((sep) => [
  make('m', ARGS),
  call('m', `a${sep}b`),
  call('m', 'a', 'b'),
  call('m', `a${sep}b`),
  call('m', 'a', 'b'),
  call('m', `${sep}`),
  call('m', '', ''),
]);

// Covers: the same arguments twice, different arguments, going back to an earlier call, (1, 23) against
// (12, 3), 1 against '1', text with separators, no arguments, results that are falsy or undefined,
// the first result kept when a later run would give another, memoized functions that must have their own
// cache, and one that is never called.
const FIXED = [
  [make('m', DOUBLE), call('m', 2), call('m', 2), call('m', 3), call('m', 2), call('m', 3), call('m', 3)],
  [make('m', PAIR), call('m', 1, 23), call('m', 12, 3), call('m', 1, 23), call('m', 12, 3)],
  [make('m', PAIR), call('m', 12, 3), call('m', 1, 23), call('m', 12, 3), call('m', 1, 23)],
  [make('m', ARGS), call('m', 1, 23), call('m', 12, 3), call('m', 123), call('m', 1, 2, 3), call('m', 12, 3)],
  [make('m', ARGS), call('m', 1), call('m', '1'), call('m', 1), call('m', '1'), call('m', 0), call('m', '0')],
  [make('m', ARGS), call('m', 'a'), call('m', 'a', 'a'), call('m', 'a'), call('m', 'a', 'a')],
  [
    make('m', ARGS),
    call('m', 1, 2),
    call('m', 2, 1),
    call('m', 1, 2),
    call('m', 2, 1),
    call('m', 'a', 'b'),
    call('m', 'b', 'a'),
  ],
  ...separated,
  [
    make('m', NEXT),
    call('m', 1),
    call('m', 1),
    call('m', 2),
    call('m', 1),
    call('m', 2),
    call('m', 'x'),
    call('m', 'x'),
  ],
  [make('m', NEXT), call('m'), call('m'), call('m', 1), call('m')],
  [make('m', ARGS), call('m'), call('m')],
  [make('m', ZERO), call('m', 7), call('m', 7), call('m', 7), call('m', 8), call('m', 8)],
  [make('m', EMPTY), call('m', 7), call('m', 7), call('m', 7), call('m', 8), call('m', 8)],
  [make('m', NO), call('m', 7), call('m', 7), call('m', 7), call('m', 8), call('m', 8)],
  [make('m', NULL), call('m', 7), call('m', 7), call('m', 7), call('m', 8), call('m', 8)],
  [make('m', NOTHING), call('m', 7), call('m', 7), call('m', 7), call('m', 8), call('m', 8)],
  [make('m', ZERO), call('m'), call('m'), call('m', 0), call('m', 0)],
  [make('m', EMPTY), call('m'), call('m')],
  [make('m', NOTHING), call('m'), call('m')],
  [make('m', DOUBLE)],
  [make('a', DOUBLE), make('b', DOUBLE), call('a', 2), call('b', 2), call('a', 2), call('b', 2)],
  [make('a', DOUBLE), call('a', 5), call('a', 5), make('b', DOUBLE), call('b', 5), call('b', 5), call('a', 5)],
  [
    make('a', NEXT),
    make('b', NEXT),
    call('a', 1),
    call('b', 1),
    call('a', 1),
    call('b', 1),
    call('b', 2),
    call('a', 2),
  ],
  [
    make('a', DOUBLE),
    make('b', SQUARE),
    call('a', 3),
    call('b', 3),
    call('a', 3),
    call('b', 3),
    call('a', 4),
    call('b', 4),
  ],
  [make('a', SQUARE), make('b', DOUBLE), call('b', 3), call('a', 3), call('b', 3), call('a', 3)],
  [make('a', ZERO), make('b', NEXT), call('a', 1), call('b', 1), call('a', 1), call('b', 1)],
];

const pick = (n) => Math.floor(Math.random() * n);
const POOL = [0, 1, 2, 12, 23, -4, 'a', 'b', 'a,b', '', '1'];
const FUNCTIONS = [ARGS, NEXT, ZERO, EMPTY, NO, NULL, NOTHING];
const randomArgs = () => Array.from({ length: pick(4) }, () => POOL[pick(POOL.length)]);

function randomScenario() {
  const memos = ['a', 'b'].slice(0, 1 + pick(2));
  const steps = memos.map((memo) => make(memo, FUNCTIONS[pick(FUNCTIONS.length)]));
  const times = 4 + pick(8);
  const used = [];
  for (let i = 0; i < times; i++) {
    // Half of the calls repeat an earlier call on the same memoized function.
    const earlier = used.filter(([, memo]) => memo === memos[0]);
    const again = earlier.length > 0 && pick(2) === 0;
    const step = again ? earlier[pick(earlier.length)] : call(memos[pick(memos.length)], ...randomArgs());
    used.push(step);
    steps.push(step);
  }
  return steps;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'closures-memoize',
  rung: 3,
  subject: 'closures',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.memoize !== 'function') return missingExport('memoize', typeof mod.memoize);
    const scenarios = [...FIXED];
    for (let i = 0; i < 20; i++) scenarios.push(randomScenario());
    for (const steps of scenarios) {
      // Each function exists twice: the one the player's code gets (a spy that counts its runs), and the
      // one the reference model runs.
      const spies = new Map();
      const memos = new Map();
      const written = [];
      for (const [kind, name, detail] of steps) {
        if (kind === 'make') {
          const fn = detail;
          if (!spies.has(fn)) {
            const run = fn.make();
            const spy = { runs: 0, wanted: 0 };
            spy.fn = (...received) => {
              spy.runs += 1;
              return run(...received);
            };
            spy.reference = fn.make();
            spies.set(fn, spy);
          }
          const spy = spies.get(fn);
          written.push(`${name} = memoize(${fn.source})`);
          const memo = mod.memoize(spy.fn);
          if (typeof memo !== 'function') {
            return wrongResult(`typeof(${written.join('; ')})`, '"function"', show(typeof memo));
          }
          memos.set(name, { memo, spy, cache: new Map() });
        } else {
          written.push(`${name}(${detail.map((item) => show(item)).join(', ')})`);
          const model = memos.get(name);
          const key = JSON.stringify(detail);
          if (!model.cache.has(key)) {
            model.cache.set(key, model.spy.reference(...detail));
            model.spy.wanted += 1;
          }
          const wanted = model.cache.get(key);
          const gave = model.memo(...detail);
          if (!Object.is(gave, wanted)) return wrongResult(written.join('; '), show(wanted), show(gave));
        }
        for (const spy of spies.values()) {
          if (spy.runs !== spy.wanted) return wrongCallCount(written.join('; '), spy.wanted, spy.runs);
        }
      }
    }
    return passed('check.pass.everyTest');
  },
};
