import { missingExport, wrongResult, passed } from './messages.js';

const FIXED = [
  ['abc', 'b'],
  ['abcd', 'bc'],
  ['', ''],
  ['a', 'a'],
  ['ab', 'ab'],
  ['hello', 'l'],
  ['ab c', 'b '],
  // Spaces are characters like any other, also at the ends.
  ['abc ', 'bc'],
  [' abc', 'ab'],
  ['  ', '  '],
];

const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
const pick = (n) => Math.floor(Math.random() * n);
const randomText = (length) => Array.from({ length }, () => characters[pick(characters.length)]).join('');

const reference = (text) => {
  if (text === '') return '';
  const half = Math.floor(text.length / 2);
  return text.length % 2 === 0 ? text.slice(half - 1, half + 1) : text[half];
};

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'strings-middle',
  rung: 1,
  subject: 'strings',
  tier: 'hard',
  complexity: 3,

  async check(mod) {
    if (typeof mod.middle !== 'function') return missingExport('middle', typeof mod.middle);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      // Odd and even lengths take turns, so both rules are always tested.
      const text = randomText(1 + 2 * pick(6) + (i % 2));
      cases.push([text, reference(text)]);
    }
    for (const [input, wanted] of cases) {
      const gave = mod.middle(input);
      if (gave !== wanted)
        return wrongResult(`middle(${JSON.stringify(input)})`, JSON.stringify(wanted), JSON.stringify(gave));
    }
    return passed('check.pass.everyTest');
  },
};
