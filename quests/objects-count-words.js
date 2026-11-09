import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed } from './messages.js';

const FIXED = [
  ['a', 'b', 'a'],
  [],
  ['hello'],
  ['constructor', 'constructor', 'a'],
  ['toString', 'valueOf', 'hasOwnProperty', 'toString', 'constructor'],
];

// Words that already exist on every plain object. A counter built on `{}` gets these wrong.
// The word __proto__ is left out on purpose: a plain object cannot hold it as an own key without
// advanced tools, so the check would punish a correct beginner solution.
const TRICKY = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'toLocaleString'];
const PLAIN = ['a', 'b', 'c', 'apple', 'pear', 'x'];
const pick = (n) => Math.floor(Math.random() * n);
const randomWords = () => {
  const pool = [...PLAIN, ...TRICKY];
  return Array.from({ length: pick(13) }, () => pool[pick(pool.length)]);
};

// A Map keeps the expected counts apart from the prototype tricks, then turns them into a plain object.
function reference(words) {
  const counts = new Map();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  return Object.fromEntries(counts);
}

// Compares own keys and counts only, so the answer may be a plain object or one with no prototype.
function sameCounts(gave, wanted) {
  if (typeof gave !== 'object' || gave === null || Array.isArray(gave)) return false;
  const byKey = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return isDeepStrictEqual(Object.entries(gave).sort(byKey), Object.entries(wanted).sort(byKey));
}

const show = (value) => JSON.stringify(value) ?? String(value);

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'objects-count-words',
  rung: 1,
  subject: 'objects',
  tier: 'medium',
  complexity: 2,

  async check(mod) {
    if (typeof mod.countWords !== 'function') return missingExport('countWords', typeof mod.countWords);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomWords());
    for (const input of cases) {
      const wanted = reference(input);
      const words = [...input];
      const gave = mod.countWords(words);
      if (!sameCounts(gave, wanted)) return wrongResult(`countWords(${show(input)})`, show(wanted), show(gave));
      // The spec says the argument must stay as it was.
      if (!isDeepStrictEqual(words, input)) {
        return wrongResult(`words = ${show(input)}; countWords(words); words`, show(input), show(words));
      }
    }
    return passed('check.pass.everyTest');
  },
};
