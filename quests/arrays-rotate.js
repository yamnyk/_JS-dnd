import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

const FIXED = [
  [[1, 2, 3, 4], 1],
  [[1, 2, 3, 4], 5],
  [[1, 2, 3, 4], -1],
  [[1, 2, 3, 4], 4],
  [[1, 2, 3, 4], 0],
  [[1, 2, 3, 4], -6],
  [[1, 2, 3], 0],
  [[9], 7],
  [[], 3],
];

const reference = (items, steps) => {
  if (items.length === 0) return [];
  const shift = ((steps % items.length) + items.length) % items.length;
  return [...items.slice(shift), ...items.slice(0, shift)];
};
const pick = (n) => Math.floor(Math.random() * n);
const randomItems = () => Array.from({ length: pick(8) }, () => pick(41) - 20);
const randomSteps = () => pick(25) - 12;

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'arrays-rotate',
  rung: 1,
  subject: 'arrays',
  tier: 'hard',
  complexity: 3,

  async check(mod) {
    if (typeof mod.rotateLeft !== 'function') return missingExport('rotateLeft', typeof mod.rotateLeft);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push([randomItems(), randomSteps()]);
    for (const [input, steps] of cases) {
      const wanted = reference(input, steps);
      const items = [...input];
      const gave = mod.rotateLeft(items, steps);
      const call = `rotateLeft(${show(input)}, ${steps})`;
      if (!isDeepStrictEqual(gave, wanted)) return wrongResult(call, show(wanted), show(gave));
      if (gave === items) return wrongResult(`rotateLeft(items, ${steps}) === items`, 'false', 'true');
      // The spec says the input array must stay as it was.
      if (!isDeepStrictEqual(items, input)) {
        return wrongResult(`items = ${show(input)}; rotateLeft(items, ${steps}); items`, show(input), show(items));
      }
    }
    return passed('check.pass.everyTest');
  },
};
