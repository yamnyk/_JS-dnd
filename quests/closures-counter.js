import { missingExport, wrongResult, passed, show } from './messages.js';

// A scenario is a list of steps. ['make', name, start] builds a counter (start null means "leave the argument
// out", so the default is used). ['call', name] calls that counter once. The expected values come from a
// reference model that keeps one number per counter.
const make = (name, start = null) => ['make', name, start];
const call = (name) => ['call', name];
const calls = (name, times) => Array.from({ length: times }, () => call(name));

// Covers: the default, a start given, zero, negative starts, a start that crosses zero, one counter used
// many times, and counters that must stay apart (interleaved, built in between, and with the same start).
const FIXED = [
  [make('c', 5), ...calls('c', 4)],
  [make('c'), ...calls('c', 4)],
  [make('c', 0), ...calls('c', 3)],
  [make('c', -2), ...calls('c', 5)],
  [make('c', 100), ...calls('c', 2)],
  [make('c', 1), call('c')],
  [make('a', 10), make('b'), call('a'), call('b'), call('a'), call('b'), call('b'), call('a')],
  [make('a'), call('a'), call('a'), make('b'), call('b'), call('a'), call('b')],
  [make('a', 3), call('a'), make('b', 3), call('b'), call('a'), call('a'), call('b')],
  [make('a', 7), make('b', -7), make('c'), call('c'), call('b'), call('a'), call('c'), call('b'), call('a')],
  [make('a', 5), call('a'), call('a'), make('b', 100), call('b'), call('a')],
  [make('a'), make('b'), call('b'), call('b'), call('b'), call('a')],
];

const pick = (n) => Math.floor(Math.random() * n);

function randomScenario() {
  const names = ['a', 'b', 'c'].slice(0, 1 + pick(3));
  const steps = names.map((name) => make(name, pick(3) === 0 ? null : pick(41) - 20));
  const times = 3 + pick(8);
  for (let i = 0; i < times; i++) steps.push(call(names[pick(names.length)]));
  return steps;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'closures-counter',
  rung: 3,
  subject: 'closures',
  tier: 'easy',
  complexity: 2,

  async check(mod) {
    if (typeof mod.makeCounter !== 'function') return missingExport('makeCounter', typeof mod.makeCounter);
    const scenarios = [...FIXED];
    for (let i = 0; i < 20; i++) scenarios.push(randomScenario());
    for (const steps of scenarios) {
      const counters = new Map();
      const next = new Map();
      const written = [];
      for (const [kind, name, start] of steps) {
        if (kind === 'make') {
          written.push(start === null ? `${name} = makeCounter()` : `${name} = makeCounter(${show(start)})`);
          const counter = start === null ? mod.makeCounter() : mod.makeCounter(start);
          if (typeof counter !== 'function') {
            return wrongResult(`typeof(${written.join('; ')})`, '"function"', show(typeof counter));
          }
          counters.set(name, counter);
          next.set(name, start === null ? 0 : start);
        } else {
          written.push(`${name}()`);
          const wanted = next.get(name);
          next.set(name, wanted + 1);
          const gave = counters.get(name)();
          if (gave !== wanted) return wrongResult(written.join('; '), show(wanted), show(gave));
        }
      }
    }
    return passed('check.pass.everyTest');
  },
};
