import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

// Zero, one, and the negatives are the edges: the list stops at 1, and nothing at all comes back below it.
const FIXED = [3, 0, 1, 2, 5, 10, -1, -2, -17];

const pick = (n) => Math.floor(Math.random() * n);

function reference(from) {
  const numbers = [];
  for (let n = from; n >= 1; n--) numbers.push(n);
  return numbers;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'loops-countdown',
  rung: 2,
  subject: 'loops',
  tier: 'easy',
  complexity: 1,

  async check(mod) {
    if (typeof mod.countdown !== 'function') return missingExport('countdown', typeof mod.countdown);
    const cases = [...FIXED];
    // Whole numbers only. A few of the random ones land on zero or below, so those branches are never skipped.
    for (let i = 0; i < 20; i++) cases.push(pick(40) - 6);
    for (const from of cases) {
      const wanted = reference(from);
      const gave = mod.countdown(from);
      if (!isDeepStrictEqual(gave, wanted)) return wrongResult(`countdown(${show(from)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
