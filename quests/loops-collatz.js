import { missingExport, wrongResult, passed, show } from './messages.js';

// The catalog examples, then the edges: 1 needs no steps, zero and every negative give -1, the smallest
// steps (2, 3, 4), a start that never meets an odd number again (a power of two), and long climbs.
const FIXED = [6, 1, 27, 0, -1, -2, -7, -100, 2, 3, 4, 5, 7, 8, 9, 16, 97, 871, 1024, 6171];

const pick = (n) => Math.floor(Math.random() * n);

function reference(n) {
  if (n < 1) return -1;
  let steps = 0;
  let value = n;
  while (value !== 1) {
    value = value % 2 === 0 ? value / 2 : value * 3 + 1;
    steps++;
  }
  return steps;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'loops-collatz',
  rung: 2,
  subject: 'loops',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.collatzSteps !== 'function') return missingExport('collatzSteps', typeof mod.collatzSteps);
    const cases = [...FIXED];
    // Whole numbers, small enough that no step passes 2 billion. Every fifth case is zero or below.
    for (let i = 0; i < 20; i++) cases.push(i % 5 === 4 ? -pick(50) : 1 + pick(5000));
    for (const n of cases) {
      const wanted = reference(n);
      const gave = mod.collatzSteps(n);
      if (gave !== wanted) return wrongResult(`collatzSteps(${show(n)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
