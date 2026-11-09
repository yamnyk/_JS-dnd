import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

const FIXED = [[1, 2, 3], [7], [], [4, 5], [-3, 0, 8, 2]];

const reference = (items) => (items.length === 0 ? [] : [items[0], items[items.length - 1]]);
const pick = (n) => Math.floor(Math.random() * n);
const randomItems = () => Array.from({ length: pick(9) }, () => pick(41) - 20);

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'arrays-first-last',
  rung: 1,
  subject: 'arrays',
  tier: 'easy',
  complexity: 1,

  async check(mod) {
    if (typeof mod.firstAndLast !== 'function') return missingExport('firstAndLast', typeof mod.firstAndLast);
    const inputs = [...FIXED];
    for (let i = 0; i < 20; i++) inputs.push(randomItems());
    for (const input of inputs) {
      const wanted = reference(input);
      const items = [...input];
      const gave = mod.firstAndLast(items);
      if (!isDeepStrictEqual(gave, wanted)) {
        return wrongResult(`firstAndLast(${show(input)})`, show(wanted), show(gave));
      }
      // The spec says the input array must stay as it was.
      if (!isDeepStrictEqual(items, input)) {
        return wrongResult(`items = ${show(input)}; firstAndLast(items); items`, show(input), show(items));
      }
    }
    return passed('check.pass.everyTest');
  },
};
