import { mock } from 'node:test';
import { missingExport, wrongResult, passed, show, wrongCallCount, wrongThrown } from './messages.js';

// Time is simulated: the check turns on the mock clock, calls callLater, and moves the clock with tick.
// Nothing waits for real, and the clock is always reset before the check returns.
//
// A scenario is a list of steps. ['later', name, ms] calls callLater with a fresh spy. ['tick', n] moves the
// clock forward by n milliseconds. The reference model: a spy must have run once when the clock has reached
// the time of its call plus ms, and not once before.
const later = (name, ms) => ['later', name, ms];
const tick = (n) => ['tick', n];

// Covers: ms - 1 against ms, the smallest delay (1), a long delay, one big jump, the same time split in many
// small ticks, a lot of time after the run (a timer that repeats gives itself away), a call that is made
// after time has already passed, two calls with the same and with different delays, and a call whose clock
// is never moved.
const FIXED = [
  [later('a', 100), tick(99), tick(1), tick(5000)],
  [later('a', 1), tick(1), tick(100)],
  [later('a', 1000), tick(999), tick(1), tick(99999)],
  [later('a', 7), tick(3), tick(3), tick(1), tick(50)],
  [later('a', 100), tick(100), tick(100), tick(100), tick(100)],
  [later('a', 100), tick(250)],
  [later('a', 100), tick(1), tick(98), tick(1)],
  [later('a', 50), tick(30), later('b', 50), tick(19), tick(1), tick(29), tick(1), tick(500)],
  [later('a', 100), tick(50), later('b', 100), tick(49), tick(1), tick(49), tick(1), tick(300)],
  [later('a', 50), later('b', 100), tick(49), tick(1), tick(49), tick(1), tick(500)],
  [later('a', 100), later('b', 50), tick(49), tick(1), tick(49), tick(1), tick(500)],
  [later('a', 20), later('b', 20), later('c', 20), tick(19), tick(1), tick(200)],
  [later('a', 60000), tick(59999), tick(1), tick(600000)],
  [later('a', 100)],
  [later('a', 5), later('b', 9)],
];

const pick = (n) => Math.floor(Math.random() * n);
const randomDelay = () => (pick(5) === 0 ? 1 + pick(500) : 1 + pick(40));

function randomScenario() {
  const total = 1 + pick(3);
  const steps = [];
  let made = 0;
  let longest = 1;
  const rounds = 3 + pick(8);
  for (let i = 0; i < rounds || made < total; i++) {
    if (made < total && (pick(3) === 0 || i >= rounds)) {
      const ms = randomDelay();
      longest = Math.max(longest, ms);
      steps.push(later('abc'.charAt(made), ms));
      made += 1;
    } else {
      steps.push(tick(1 + pick(longest + 30)));
    }
  }
  return steps;
}

const errorName = (error) => (error instanceof Error ? error.name : typeof error);

function runScenario(mod, steps) {
  const many = steps.filter(([kind]) => kind === 'later').length > 1;
  const fnName = (name) => (many ? `fn${name.toUpperCase()}` : 'fn');
  const longest = Math.max(...steps.map(([kind, , ms]) => (kind === 'later' ? ms : 0)));
  // A last long tick shows a timer that runs again and again.
  const all = [...steps, tick(longest * 5 + 11)];
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  try {
    const written = [];
    const timers = new Map();
    let now = 0;
    for (const [kind, name, ms] of all) {
      if (kind === 'later') {
        const spy = { calls: [], due: now + ms };
        spy.fn = (...received) => {
          spy.calls.push(received);
        };
        timers.set(name, spy);
        written.push(`callLater(${fnName(name)}, ${ms})`);
        try {
          mod.callLater(spy.fn, ms);
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
      }
      for (const [timerName, spy] of timers) {
        const wanted = now >= spy.due ? 1 : 0;
        const text = many ? `${written.join('; ')}; runs(${fnName(timerName)})` : written.join('; ');
        if (spy.calls.length !== wanted) return wrongCallCount(text, wanted, spy.calls.length);
        const withArguments = spy.calls.find((received) => received.length !== 0);
        if (withArguments) return wrongResult(`${text}; args(${fnName(timerName)})`, show([]), show(withArguments));
      }
    }
    return undefined;
  } finally {
    mock.timers.reset();
  }
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'timeouts-call-later',
  rung: 4,
  subject: 'timeouts',
  tier: 'easy',
  complexity: 3,

  async check(mod) {
    if (typeof mod.callLater !== 'function') return missingExport('callLater', typeof mod.callLater);
    const scenarios = [...FIXED];
    for (let i = 0; i < 25; i++) scenarios.push(randomScenario());
    for (const steps of scenarios) {
      const failure = runScenario(mod, steps);
      if (failure) return failure;
    }
    return passed('check.pass.everyTest');
  },
};
