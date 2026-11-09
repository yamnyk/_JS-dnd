import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

// Below 2 there is nothing. Squares of primes (4, 9, 25, 49, 121, 169) are where a divisor loop that stops
// one step early goes wrong. Primes (2, 3, 5, 7, 11, 13, 97) as n test that n itself counts.
const FIXED = [
  10, 1, 0, -5, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 24, 25, 26, 48, 49, 50, 97, 100, 120, 121, 122, 168, 169, 170,
];
// The largest size the brief names. A correct solution that tries every divisor still finishes well inside the limit.
const LARGE = [5000];

const pick = (n) => Math.floor(Math.random() * n);

function reference(n) {
  const primes = [];
  for (let candidate = 2; candidate <= n; candidate++) {
    let isPrime = true;
    for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
      if (candidate % divisor === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(candidate);
  }
  return primes;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'loops-primes',
  rung: 2,
  subject: 'loops',
  tier: 'medium',
  complexity: 3,

  async check(mod) {
    if (typeof mod.primesUpTo !== 'function') return missingExport('primesUpTo', typeof mod.primesUpTo);
    const cases = [...FIXED, ...LARGE];
    for (let i = 0; i < 20; i++) {
      if (i < 12) cases.push(pick(150));
      else if (i < 17) cases.push(150 + pick(850));
      else cases.push(1000 + pick(2001));
    }
    for (const n of cases) {
      const wanted = reference(n);
      const gave = mod.primesUpTo(n);
      if (!isDeepStrictEqual(gave, wanted)) return wrongResult(`primesUpTo(${show(n)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
