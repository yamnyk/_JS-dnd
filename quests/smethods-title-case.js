import { missingExport, wrongResult, passed, show } from './messages.js';

// Words are joined in code, so the check holds no text that looks like a sentence.
const words = (...parts) => parts.join(' ');

// Plain ASCII letters and single spaces only. No leading, trailing, or double spaces.
const FIXED = [
  [words('hello', 'bIG', 'world'), words('Hello', 'Big', 'World')],
  ['hello', 'Hello'],
  ['HELLO', 'Hello'],
  [words('hELLO', 'wORLD'), words('Hello', 'World')],
  [words('Hello', 'World'), words('Hello', 'World')],
  ['', ''],
  ['a', 'A'],
  ['a b c', 'A B C'],
  [
    words('the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog'),
    words('The', 'Quick', 'Brown', 'Fox', 'Jumps', 'Over', 'The', 'Lazy', 'Dog'),
  ],
  [words('mIxEd', 'cAsE', 'wOrDs'), words('Mixed', 'Case', 'Words')],
  [words('ALL', 'CAPS', 'HERE'), words('All', 'Caps', 'Here')],
  [words('already', 'Correct', 'Text'), words('Already', 'Correct', 'Text')],
];

const letters = 'abcdefghijklmnopqrstuvwxyz';
const pick = (n) => Math.floor(Math.random() * n);
const randomCase = (letter) => (pick(2) === 0 ? letter : letter.toUpperCase());
const randomWord = () => Array.from({ length: 1 + pick(8) }, () => randomCase(letters[pick(letters.length)])).join('');
const randomText = () => Array.from({ length: 1 + pick(6) }, randomWord).join(' ');

const reference = (text) =>
  text === ''
    ? ''
    : text
        .split(' ')
        .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'smethods-title-case',
  rung: 3,
  subject: 'string-methods',
  tier: 'easy',
  complexity: 2,

  async check(mod) {
    if (typeof mod.titleCase !== 'function') return missingExport('titleCase', typeof mod.titleCase);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      const text = randomText();
      cases.push([text, reference(text)]);
    }
    for (const [input, wanted] of cases) {
      const gave = mod.titleCase(input);
      if (gave !== wanted) return wrongResult(`titleCase(${show(input)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
