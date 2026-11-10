import { mock } from 'node:test';
import { missingExport, wrongResult, passed, wrongCallCount, wrongThrown, wrongThrewUnexpectedly } from './messages.js';

// Time is simulated: the check turns on the mock clock, calls cancellable, and moves the clock with tick.
// Nothing waits for real, and the clock is always reset before the check returns.
//
// A scenario is a list of steps. ['make', name, ms] calls cancellable with a fresh spy. ['tick', n] moves the
// clock forward by n milliseconds. ['cancel', name] calls the cancel function of that name. The reference
// model: a spy has run once when the clock has reached the time of its make plus ms, unless its cancel was
// called while the clock was still before that time. A cancel after the run changes nothing.
const make = (name, ms) => ['make', name, ms];
const tick = (n) => ['tick', n];
const cancel = (name) => ['cancel', name];

// Covers: no cancel, cancel before any time passed, cancel at ms - 1, cancel after the run, cancel twice
// (before and after the run), time passing after a cancel (a repeating timer gives itself away), a cancel
// that is called after the other timer was made (a shared timer id shows), cancel of the older and of the
// newer timer, cancel of a timer that already ran while another one waits, and timers with other delays.
const FIXED = [
  [make('a', 100), tick(99), tick(1), tick(5000)],
  [make('a', 100), tick(100), tick(100), tick(100)],
  [make('a', 100), cancel('a'), tick(100), tick(5000)],
  [make('a', 100), tick(50), cancel('a'), tick(50), tick(5000)],
  [make('a', 100), tick(99), cancel('a'), tick(1), tick(5000)],
  [make('a', 100), tick(100), cancel('a'), tick(5000)],
  [make('a', 100), tick(5000), cancel('a'), tick(5000)],
  [make('a', 100), cancel('a'), cancel('a'), tick(5000)],
  [make('a', 100), tick(40), cancel('a'), tick(10), cancel('a'), tick(5000)],
  [make('a', 100), tick(100), cancel('a'), cancel('a'), tick(5000)],
  [make('a', 1), cancel('a'), tick(1), tick(100)],
  [make('a', 1), tick(1), cancel('a'), tick(100)],
  [make('a', 1000), tick(999), cancel('a'), tick(1), tick(99999)],
  [make('a', 100)],
  [make('a', 100), cancel('a')],
  [tick(30), make('a', 50), tick(49), tick(1), tick(500)],
  [tick(30), make('a', 50), tick(49), cancel('a'), tick(1), tick(500)],
  [make('a', 100), make('b', 100), cancel('a'), tick(99), tick(1), tick(500)],
  [make('a', 100), make('b', 100), cancel('b'), tick(99), tick(1), tick(500)],
  [make('a', 100), make('b', 100), cancel('a'), cancel('b'), tick(500)],
  [make('a', 100), make('b', 100), tick(99), tick(1), cancel('a'), cancel('b'), tick(500)],
  [make('a', 50), make('b', 100), cancel('b'), tick(49), tick(1), tick(500)],
  [make('a', 50), make('b', 100), cancel('a'), tick(99), tick(1), tick(500)],
  [make('a', 50), make('b', 100), tick(50), cancel('a'), tick(49), tick(1), tick(500)],
  [make('a', 100), make('b', 50), tick(50), cancel('a'), tick(49), tick(1), tick(500)],
  [make('a', 100), make('b', 50), tick(50), cancel('b'), tick(49), tick(1), tick(500)],
  [make('a', 100), make('b', 50), cancel('a'), cancel('a'), tick(49), tick(1), tick(500)],
  [make('a', 100), make('b', 100), cancel('a'), cancel('a'), tick(99), tick(1), tick(500)],
  [make('a', 100), tick(30), make('b', 100), cancel('a'), tick(69), tick(1), tick(29), tick(1), tick(500)],
  [make('a', 100), tick(30), make('b', 100), cancel('b'), tick(69), tick(1), tick(500)],
  [make('a', 100), make('b', 100), make('c', 100), cancel('b'), tick(99), tick(1), tick(500)],
  [make('a', 100), make('b', 100), make('c', 100), cancel('a'), cancel('c'), tick(500)],
  [make('a', 100), make('b', 100), make('c', 100), cancel('c'), tick(500)],
  [make('a', 5), make('b', 9), tick(500)],
];

const pick = (n) => Math.floor(Math.random() * n);
const randomDelay = () => (pick(5) === 0 ? 1 + pick(500) : 1 + pick(40));

function randomScenario() {
  const total = 1 + pick(3);
  const steps = [];
  let made = 0;
  let longest = 1;
  const rounds = 4 + pick(10);
  for (let i = 0; i < rounds || made < total; i++) {
    const roll = pick(5);
    if (made < total && (roll === 0 || i >= rounds)) {
      const ms = randomDelay();
      longest = Math.max(longest, ms);
      steps.push(make('abc'.charAt(made), ms));
      made += 1;
    } else if (made > 0 && roll === 1) {
      steps.push(cancel('abc'.charAt(pick(made))));
    } else {
      steps.push(tick(1 + pick(longest + 30)));
    }
  }
  return steps;
}

const errorName = (error) => (error instanceof Error ? error.name : typeof error);

function runScenario(mod, steps) {
  const many = steps.filter(([kind]) => kind === 'make').length > 1;
  const label = (name) => (many ? name.toUpperCase() : '');
  const longest = Math.max(...steps.map(([kind, , ms]) => (kind === 'make' ? ms : 0)));
  // A last long tick shows a timer that runs again and again.
  const all = [...steps, tick(longest * 5 + 11)];
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  try {
    const written = [];
    const timers = new Map();
    let now = 0;
    for (const [kind, name, ms] of all) {
      if (kind === 'make') {
        const spy = { runs: 0, due: now + ms, cancelled: false };
        spy.fn = () => {
          spy.runs += 1;
        };
        const call = `cancel${label(name)} = cancellable(fn${label(name)}, ${ms})`;
        written.push(call);
        try {
          spy.cancel = mod.cancellable(spy.fn, ms);
        } catch (error) {
          return wrongThrown(written.join('; '), '"function"', errorName(error));
        }
        if (typeof spy.cancel !== 'function') {
          return wrongResult(`typeof(${written.join('; ')})`, '"function"', `"${typeof spy.cancel}"`);
        }
        timers.set(name, spy);
      } else if (kind === 'cancel') {
        const spy = timers.get(name);
        if (now < spy.due) spy.cancelled = true;
        written.push(`cancel${label(name)}()`);
        try {
          spy.cancel();
        } catch (error) {
          return wrongThrewUnexpectedly(written.join('; '), errorName(error));
        }
      } else {
        written.push(`tick(${name})`);
        now += name;
        try {
          mock.timers.tick(name);
        } catch (error) {
          return wrongThrewUnexpectedly(written.join('; '), errorName(error));
        }
      }
      for (const [timerName, spy] of timers) {
        const wanted = spy.cancelled ? 0 : now >= spy.due ? 1 : 0;
        if (spy.runs !== wanted) {
          const text = many ? `${written.join('; ')}; runs(fn${label(timerName)})` : written.join('; ');
          return wrongCallCount(text, wanted, spy.runs);
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
  id: 'timeouts-cancellable',
  rung: 4,
  subject: 'timeouts',
  tier: 'medium',
  complexity: 4,

  async check(mod) {
    if (typeof mod.cancellable !== 'function') return missingExport('cancellable', typeof mod.cancellable);
    const scenarios = [...FIXED];
    for (let i = 0; i < 40; i++) scenarios.push(randomScenario());
    for (const steps of scenarios) {
      const failure = runScenario(mod, steps);
      if (failure) return failure;
    }
    return passed('check.pass.everyTest');
  },
};
