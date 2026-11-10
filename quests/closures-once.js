import { missingExport, wrongResult, passed, show, wrongCallCount } from './messages.js';

// Functions the check hands over. `source` is how they are shown in a failure message, `make` gives a fresh
// copy per scenario so the ones that keep a count start from zero every time.
const ADD = { source: '(a, b) => a + b', make: () => (a, b) => a + b };
const SQUARE = { source: '(x) => x * x', make: () => (x) => x * x };
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
const NOTHING = { source: '() => undefined', make: () => () => undefined };
const ZERO = { source: '() => 0', make: () => () => 0 };
const EMPTY = { source: "() => ''", make: () => () => '' };
const NO = { source: '() => false', make: () => () => false };
const NULL = { source: '() => null', make: () => () => null };

// A scenario is a list of steps. ['make', wrapper, function] builds a wrapper with once. ['call', wrapper,
// args] calls it. The functions are shared by name, so two wrappers can be built from the same function.
// The expected values and the expected number of runs come from a reference model.
const make = (wrapper, fn) => ['make', wrapper, fn];
const call = (wrapper, ...args) => ['call', wrapper, args];

// Covers: arguments passed on the first call (none, one, several), later arguments ignored, the first result
// kept when a later run would give another, results that are falsy or undefined (the function must still
// run only once), a wrapper that is never called, and wrappers that must stay apart (different functions,
// the same function, and calls in a mixed order).
const FIXED = [
  [make('w', ADD), call('w', 2, 3), call('w', 10, 20), call('w'), call('w', 2, 3)],
  [make('w', NEXT), call('w'), call('w'), call('w'), call('w', 9)],
  [make('w', NOTHING), call('w'), call('w'), call('w', 1)],
  [make('w', ZERO), call('w'), call('w'), call('w')],
  [make('w', EMPTY), call('w'), call('w'), call('w')],
  [make('w', NO), call('w'), call('w'), call('w')],
  [make('w', NULL), call('w'), call('w'), call('w')],
  [make('w', ARGS), call('w'), call('w', 1), call('w', 1, 2, 3)],
  [make('w', ARGS), call('w', 1, 2, 3), call('w'), call('w', 4)],
  [make('w', ARGS), call('w', 'x'), call('w', 'y', 'z')],
  [make('w', SQUARE), call('w', 4), call('w', 5), call('w', 4)],
  [make('w', ADD)],
  [make('a', NEXT), make('b', NEXT), call('a'), call('b'), call('a'), call('b'), call('b')],
  [make('a', ADD), make('b', SQUARE), call('a', 1, 2), call('b', 5), call('a', 7, 8), call('b', 6)],
  [make('a', ADD), make('b', SQUARE), call('b', 5), call('a', 1, 2), call('b', 6), call('a', 7, 8)],
  [make('a', ZERO), make('b', NEXT), call('a'), call('b'), call('a'), call('b')],
  [make('a', NEXT), call('a'), call('a'), make('b', NEXT), call('b'), call('a'), call('b')],
  [make('a', NOTHING), make('b', NOTHING), call('a'), call('b'), call('a'), call('b')],
];

const pick = (n) => Math.floor(Math.random() * n);
const FUNCTIONS = [ADD, SQUARE, ARGS, NEXT, NOTHING, ZERO, EMPTY, NO, NULL];
const randomArgs = () => Array.from({ length: pick(4) }, () => (pick(2) === 0 ? pick(10) : 'ab'.charAt(pick(2))));

function randomScenario() {
  const wrappers = ['a', 'b'].slice(0, 1 + pick(2));
  const steps = wrappers.map((wrapper) => make(wrapper, FUNCTIONS[pick(FUNCTIONS.length)]));
  const times = 2 + pick(7);
  for (let i = 0; i < times; i++) steps.push(call(wrappers[pick(wrappers.length)], ...randomArgs()));
  return steps;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'closures-once',
  rung: 3,
  subject: 'closures',
  tier: 'medium',
  complexity: 3,

  async check(mod) {
    if (typeof mod.once !== 'function') return missingExport('once', typeof mod.once);
    const scenarios = [...FIXED];
    for (let i = 0; i < 20; i++) scenarios.push(randomScenario());
    for (const steps of scenarios) {
      // Each function exists twice: the one the player's code gets (a spy that counts its runs), and the
      // one the reference model runs.
      const spies = new Map();
      const wrappers = new Map();
      const reference = new Map();
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
          written.push(`${name} = once(${fn.source})`);
          const wrapper = mod.once(spy.fn);
          if (typeof wrapper !== 'function') {
            return wrongResult(`typeof(${written.join('; ')})`, '"function"', show(typeof wrapper));
          }
          wrappers.set(name, wrapper);
          reference.set(name, { spy, done: false, result: undefined });
        } else {
          written.push(`${name}(${detail.map((item) => show(item)).join(', ')})`);
          const model = reference.get(name);
          if (!model.done) {
            model.done = true;
            model.result = model.spy.reference(...detail);
            model.spy.wanted += 1;
          }
          const gave = wrappers.get(name)(...detail);
          if (!Object.is(gave, model.result)) return wrongResult(written.join('; '), show(model.result), show(gave));
        }
        for (const spy of spies.values()) {
          if (spy.runs !== spy.wanted) return wrongCallCount(written.join('; '), spy.wanted, spy.runs);
        }
      }
    }
    return passed('check.pass.everyTest');
  },
};
