import { mock } from 'node:test';
import { missingExport, wrongResult, passed, show, wrongCallCount, wrongThrown } from './messages.js';

// Time is simulated: the check turns on the mock clock, calls debounce, and moves the clock with tick. Nothing
// waits for real, and the clock is always reset before the check returns.
//
// A scenario is a list of steps. ['make', name, ms] calls debounce with a fresh spy. ['call', name, args]
// calls the debounced function. ['tick', n] moves the clock forward by n milliseconds. The reference model:
// every call replaces the waiting call and sets its due time to now + ms. When the clock reaches the due
// time, fn has run once with the arguments of that last call, and nothing waits any more.
const make = (name, ms) => ['make', name, ms];
const call = (name, ...args) => ['call', name, args];
const tick = (n) => ['tick', n];

// Covers: three calls inside ms (the last arguments win, one run), zero, one, two, and three arguments,
// arguments that must not be mixed with the ones of an earlier call, ms - 1 against ms, a call that restarts
// the wait (once, and again and again so fn never runs), a call after the quiet time (a second round, then a
// third one), a pause far longer than ms, time passing after the run (a repeating timer gives itself away),
// ms of 1, a function that is never called, and two debounced functions with the same and with different
// delays that must stay apart (a shared timer or a shared last call shows in every order of the calls).
const FIXED = [
  [make('a', 100), call('a', 1), call('a', 2), call('a', 3), tick(99), tick(1), tick(5000)],
  [make('a', 100), call('a', 7), tick(99), tick(1), tick(5000)],
  [make('a', 100), call('a'), tick(99), tick(1), tick(5000)],
  [make('a', 100), call('a', 'x', 1), tick(99), tick(1)],
  [make('a', 100), call('a', 'x', 1), call('a', 'y', 2), call('a', 'z', 3), tick(100)],
  [make('a', 100), call('a', 1, 2, 3), tick(100)],
  [make('a', 100), call('a', 1, 2), call('a'), tick(100)],
  [make('a', 100), call('a'), call('a', 1, 2), tick(100)],
  [make('a', 100), call('a', 1, 2), call('a', 5), tick(100)],
  [make('a', 100), call('a', 5), call('a', 1, 2), tick(100)],
  [make('a', 100), call('a', 1), call('a', 2), tick(100), call('a', 3), call('a', 4), tick(100)],
  [make('a', 100), call('a', 1), tick(60), call('a', 2), tick(60), tick(39), tick(1), tick(1000)],
  [make('a', 100), call('a', 1), tick(99), call('a', 2), tick(99), call('a', 3), tick(99), tick(1), tick(500)],
  [make('a', 100), call('a', 1), tick(1), call('a', 2), tick(1), call('a', 3), tick(1), call('a', 4), tick(99)],
  [make('a', 100), call('a', 1), tick(100), call('a', 2), tick(99), tick(1), tick(1000)],
  [make('a', 100), call('a', 1), tick(100), call('a', 2), tick(100), call('a', 3), tick(100), tick(1000)],
  [make('a', 100), call('a', 1), tick(500), call('a', 2), tick(500), call('a', 3), tick(500)],
  [make('a', 100), call('a', 1), tick(100), call('a', 2), call('a', 3), tick(100)],
  [make('a', 100), call('a', 1), tick(100), tick(100), tick(100), tick(100)],
  [make('a', 100), tick(1000)],
  [make('a', 100)],
  [make('a', 100), call('a', 9)],
  [make('a', 1), call('a', 1), tick(1), call('a', 2), call('a', 3), tick(1), tick(50)],
  [make('a', 1), call('a', 1), call('a', 2), tick(1), call('a', 3), tick(1)],
  [make('a', 1000), call('a', 1), tick(999), tick(1), tick(99999)],
  [make('a', 100), call('a', 1), make('b', 100), call('b', 2), tick(99), tick(1), tick(500)],
  [make('a', 100), make('b', 100), call('b', 2), call('a', 1), tick(100), tick(500)],
  [make('a', 100), make('b', 100), call('a', 1, 1), call('b', 2), call('a', 3, 3), tick(100)],
  [make('a', 100), make('b', 100), call('a', 1), call('a', 2), call('b', 9), tick(100)],
  [make('a', 100), make('b', 100), call('b', 9), call('a', 1), call('a', 2), tick(100)],
  [make('a', 100), make('b', 100), call('a', 1), tick(60), call('b', 2), tick(40), tick(60), tick(500)],
  [make('a', 100), make('b', 100), call('b', 2), tick(60), call('a', 1), tick(40), tick(60), tick(500)],
  [make('a', 100), make('b', 100), call('a', 1), call('b', 2), tick(60), call('a', 3), tick(40), tick(60), tick(500)],
  [make('a', 100), make('b', 100), call('a', 1), call('b', 2), tick(60), call('b', 3), tick(40), tick(60), tick(500)],
  [make('a', 100), make('b', 50), call('a', 1), call('b', 2), tick(50), call('a', 3), tick(49), tick(1), tick(500)],
  [make('a', 50), make('b', 100), call('a', 1), call('b', 2), tick(50), call('a', 3), tick(49), tick(1), tick(500)],
  [make('a', 100), make('b', 50), call('a', 1), tick(30), call('b', 2), tick(30), call('b', 3), tick(70), tick(500)],
  [
    make('a', 100),
    make('b', 100),
    call('a', 1),
    call('b', 2),
    tick(100),
    call('a', 3),
    tick(100),
    call('b', 4),
    tick(100),
  ],
  [make('a', 100), make('b', 100), call('a', 1), tick(100), tick(100)],
  [make('a', 100), make('b', 100), tick(500)],
  [make('a', 5), make('b', 9), call('a', 1)],
];

const pick = (n) => Math.floor(Math.random() * n);
const randomDelay = () => (pick(5) === 0 ? 1 + pick(500) : 1 + pick(40));
const POOL = [0, 1, 2, 7, -4, 'a', 'b', 'x y', ''];
const randomArgs = () => Array.from({ length: pick(4) }, () => POOL[pick(POOL.length)]);

function randomScenario() {
  const total = 1 + pick(2);
  const steps = [];
  let longest = 1;
  for (let i = 0; i < total; i++) {
    const ms = randomDelay();
    longest = Math.max(longest, ms);
    steps.push(make('ab'.charAt(i), ms));
  }
  const rounds = 6 + pick(10);
  for (let i = 0; i < rounds; i++) {
    if (pick(2) === 0) {
      steps.push(call('ab'.charAt(pick(total)), ...randomArgs()));
    } else {
      // Ticks around the delays decide whether a call restarts the wait in time.
      const size = pick(3) === 0 ? longest : 1 + pick(longest + 20);
      steps.push(tick(size));
    }
  }
  return steps;
}

const errorName = (error) => (error instanceof Error ? error.name : typeof error);

function runScenario(mod, steps) {
  const many = steps.filter(([kind]) => kind === 'make').length > 1;
  const fnName = (name) => (many ? `fn${name.toUpperCase()}` : 'fn');
  const longest = Math.max(...steps.map(([kind, , ms]) => (kind === 'make' ? ms : 0)));
  // A last long tick shows a timer that runs again and again.
  const all = [...steps, tick(longest * 5 + 11)];
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  try {
    const written = [];
    const debounced = new Map();
    let now = 0;
    for (const [kind, name, detail] of all) {
      if (kind === 'make') {
        const model = { ms: detail, waiting: null, runs: [], calls: [] };
        model.fn = (...received) => {
          model.calls.push(received);
        };
        written.push(`${name} = debounce(${fnName(name)}, ${detail})`);
        try {
          model.debounced = mod.debounce(model.fn, detail);
        } catch (error) {
          return wrongThrown(written.join('; '), '"function"', errorName(error));
        }
        if (typeof model.debounced !== 'function') {
          return wrongResult(`typeof(${written.join('; ')})`, '"function"', `"${typeof model.debounced}"`);
        }
        debounced.set(name, model);
      } else if (kind === 'call') {
        const model = debounced.get(name);
        model.waiting = { due: now + model.ms, args: detail };
        written.push(`${name}(${detail.map((item) => show(item)).join(', ')})`);
        try {
          model.debounced(...detail);
        } catch (error) {
          return wrongThrown(written.join('; '), 'ok', errorName(error));
        }
      } else {
        written.push(`tick(${name})`);
        now += name;
        try {
          mock.timers.tick(name);
        } catch (error) {
          return wrongThrown(written.join('; '), 'ok', errorName(error));
        }
        for (const model of debounced.values()) {
          if (model.waiting && now >= model.waiting.due) {
            model.runs.push(model.waiting.args);
            model.waiting = null;
          }
        }
      }
      for (const [debouncedName, model] of debounced) {
        const text = many ? `${written.join('; ')}; runs(${fnName(debouncedName)})` : written.join('; ');
        if (model.calls.length !== model.runs.length)
          return wrongCallCount(text, model.runs.length, model.calls.length);
        const different = model.runs.findIndex((args, index) => show(args) !== show(model.calls[index]));
        if (different !== -1) {
          return wrongResult(
            `${written.join('; ')}; args(${fnName(debouncedName)})`,
            show(model.runs),
            show(model.calls),
          );
        }
      }
    }
    return undefined;
  } finally {
    mock.timers.reset();
  }
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'timeouts-debounce',
  rung: 4,
  subject: 'timeouts',
  tier: 'hard',
  complexity: 5,

  async check(mod) {
    if (typeof mod.debounce !== 'function') return missingExport('debounce', typeof mod.debounce);
    const scenarios = [...FIXED];
    for (let i = 0; i < 40; i++) scenarios.push(randomScenario());
    for (const steps of scenarios) {
      const failure = runScenario(mod, steps);
      if (failure) return failure;
    }
    return passed('check.pass.everyTest');
  },
};
