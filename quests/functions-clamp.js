import { missingExport, wrongResult, passed, show } from './messages.js';

// [value, min, max]. Both sides of each edge, the edges themselves, a range of one number, negative
// ranges, and decimals. The brief says min is never above max, so that case is left out.
const FIXED = [
  [15, 0, 10],
  [-3, 0, 10],
  [5, 0, 10],
  [11, 0, 10],
  [10, 0, 10],
  [9, 0, 10],
  [0, 0, 10],
  [1, 0, 10],
  [-1, 0, 10],
  [3, 3, 3],
  [9, 3, 3],
  [-9, 3, 3],
  [-5, -10, -2],
  [-20, -10, -2],
  [0, -10, -2],
  [-10, -10, -2],
  [-2, -10, -2],
  [2.5, 0, 1],
  [0.5, 0, 1],
  [-0.5, 0, 1],
  [7, 5, 100],
  [200, 5, 100],
];

const pick = (n) => Math.floor(Math.random() * n);
const reference = (value, min, max) => Math.min(Math.max(value, min), max);

function randomCase(i) {
  const min = pick(101) - 50;
  const max = min + pick(40);
  // Rotate through below, inside, and above the range, so every branch is tested on every run.
  const value = [min - 1 - pick(30), min + pick(max - min + 1), max + 1 + pick(30)][i % 3];
  return [value, min, max];
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'functions-clamp',
  rung: 2,
  subject: 'functions',
  tier: 'easy',
  complexity: 1,

  async check(mod) {
    if (typeof mod.clamp !== 'function') return missingExport('clamp', typeof mod.clamp);
    const cases = [...FIXED];
    for (let i = 0; i < 21; i++) cases.push(randomCase(i));
    for (const [value, min, max] of cases) {
      const wanted = reference(value, min, max);
      const gave = mod.clamp(value, min, max);
      if (gave !== wanted)
        return wrongResult(`clamp(${show(value)}, ${show(min)}, ${show(max)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
