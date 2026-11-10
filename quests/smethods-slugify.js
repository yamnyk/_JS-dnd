import { missingExport, wrongResult, passed, show } from './messages.js';

// Words are joined in code, so the check holds no text that looks like a sentence.
const words = (...parts) => parts.join(' ');

// ASCII text only. Accents and other letters outside a-z are not tested.
const FIXED = [
  ['Hello, World!', 'hello-world'],
  ['  A  b ', 'a-b'],
  ['hello', 'hello'],
  ['HELLO', 'hello'],
  ['', ''],
  ['   ', ''],
  ['!!!', ''],
  ['a', 'a'],
  [words('Version', '2', 'is', 'out'), 'version-2-is-out'],
  ['123', '123'],
  ['Top 10 Tips & Tricks', 'top-10-tips-tricks'],
  // A run of several separators becomes one dash.
  ['a, b, c', 'a-b-c'],
  ['a --- b', 'a-b'],
  [words('one', '', '', '', '', '', 'two'), 'one-two'],
  ['a!?!b', 'a-b'],
  // Leading and trailing separators leave no dash at the ends.
  ['...start', 'start'],
  ['end...', 'end'],
  ['--a--', 'a'],
  [`  ${words('both', 'ends')}  `, 'both-ends'],
  // The underscore is not a-z or 0-9, so it is a separator too.
  ['snake_case_name', 'snake-case-name'],
  ['_x_', 'x'],
  ['already-a-slug', 'already-a-slug'],
  ["It's a 'test'", 'it-s-a-test'],
  [['tab', 'separated'].join('\t'), 'tab-separated'],
  ['MiXeD 42 CaSe', 'mixed-42-case'],
];

const pick = (n) => Math.floor(Math.random() * n);
const WORDS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SEPARATORS = [' ', '  ', ',', ', ', '!', '-', '--', '_', '.', ' & ', '?!', '\t', '(', ')', "'"];
const randomWord = () => Array.from({ length: 1 + pick(6) }, () => WORDS[pick(WORDS.length)]).join('');
const randomSeparator = () => SEPARATORS[pick(SEPARATORS.length)];
const randomTitle = () => {
  let text = pick(3) === 0 ? randomSeparator() : '';
  for (let i = 0, count = 1 + pick(5); i < count; i++) text += randomWord() + randomSeparator();
  return pick(2) === 0 ? text.slice(0, -1) : text;
};

const reference = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'smethods-slugify',
  rung: 3,
  subject: 'string-methods',
  tier: 'medium',
  complexity: 3,

  async check(mod) {
    if (typeof mod.slugify !== 'function') return missingExport('slugify', typeof mod.slugify);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      const title = randomTitle();
      cases.push([title, reference(title)]);
    }
    for (const [input, wanted] of cases) {
      const gave = mod.slugify(input);
      if (gave !== wanted) return wrongResult(`slugify(${show(input)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
