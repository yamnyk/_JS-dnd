import { missingExport, wrongResult, passed } from './messages.js';

const FIXED = [
  [1, 'apple', '1 apple'],
  [0, 'apple', '0 apples'],
  [3, 'apple', '3 apples'],
  [2, 'cat', '2 cats'],
  [1, 'dog', '1 dog'],
  [11, 'pear', '11 pears'],
  [100, 'coin', '100 coins'],
  // Only add s, even after s, x, and y.
  [2, 'bus', '2 buss'],
  [5, 'box', '5 boxs'],
  [3, 'city', '3 citys'],
];

const letters = 'abcdefghijklmnopqrstuvwxyz';
const pick = (n) => Math.floor(Math.random() * n);
const randomNoun = () => Array.from({ length: 2 + pick(7) }, () => letters[pick(letters.length)]).join('');
const reference = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'strings-count-label',
  rung: 1,
  subject: 'strings',
  tier: 'medium',
  complexity: 2,

  async check(mod) {
    if (typeof mod.countLabel !== 'function') return missingExport('countLabel', typeof mod.countLabel);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      // Every third case is a one, so the singular is always tested.
      const count = i % 3 === 0 ? 1 : pick(60);
      const noun = randomNoun();
      cases.push([count, noun, reference(count, noun)]);
    }
    for (const [count, noun, wanted] of cases) {
      const gave = mod.countLabel(count, noun);
      if (gave !== wanted) {
        return wrongResult(
          `countLabel(${JSON.stringify(count)}, ${JSON.stringify(noun)})`,
          JSON.stringify(wanted),
          JSON.stringify(gave),
        );
      }
    }
    return passed('check.pass.everyTest');
  },
};
