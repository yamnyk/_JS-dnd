import { missingExport, wrongResult, passed, show } from './messages.js';

// Every number from 1 to 30 covers all four kinds twice over. The rest are bigger numbers of each kind,
// so a rule that only works for small numbers fails on every run.
const FIXED = [...Array.from({ length: 30 }, (_, i) => i + 1), 45, 60, 99, 100, 101, 105, 300, 999, 1000, 9999, 10000];

const pick = (n) => Math.floor(Math.random() * n);
const reference = (n) => {
  if (n % 15 === 0) return 'FizzBuzz';
  if (n % 3 === 0) return 'Fizz';
  if (n % 5 === 0) return 'Buzz';
  return String(n);
};

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'logic-fizzbuzz',
  rung: 2,
  subject: 'conditionals',
  tier: 'easy',
  complexity: 1,

  async check(mod) {
    if (typeof mod.fizzBuzz !== 'function') return missingExport('fizzBuzz', typeof mod.fizzBuzz);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      // Multiples of 15, 3, and 5 take turns with any number, big ones included.
      cases.push((1 + pick(3000)) * [15, 3, 5, 1][i % 4] + (i % 4 === 3 ? pick(2) : 0));
    }
    for (const n of cases) {
      const gave = mod.fizzBuzz(n);
      const wanted = reference(n);
      if (gave !== wanted) return wrongResult(`fizzBuzz(${show(n)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
