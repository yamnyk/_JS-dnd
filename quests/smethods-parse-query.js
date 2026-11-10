import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

// Words are joined in code, so the check holds no text that looks like a sentence.
const words = (...parts) => parts.join(' ');

const FIXED = [
  ['a=1&b=two&a=3', { a: ['1', '3'], b: ['two'] }],
  ['name=Ada%20L', { name: [words('Ada', 'L')] }],
  ['', {}],
  ['a=1', { a: ['1'] }],
  // A key without = gets the value ''. So does a key with an empty value.
  ['flag', { flag: [''] }],
  ['a=1&flag&b=2', { a: ['1'], flag: [''], b: ['2'] }],
  ['a=&b=2', { a: [''], b: ['2'] }],
  ['flag&flag', { flag: ['', ''] }],
  // Repeated keys collect their values in order.
  ['a=3&a=1&a=2', { a: ['3', '1', '2'] }],
  ['a=1&b=2&a=3&b=4&a=5', { a: ['1', '3', '5'], b: ['2', '4'] }],
  ['a=x&a&a=y', { a: ['x', '', 'y'] }],
  // The first = splits the key from the value, later ones stay in the value.
  ['a=b=c', { a: ['b=c'] }],
  ['eq==', { eq: ['='] }],
  ['x=1=2=3&y=4', { x: ['1=2=3'], y: ['4'] }],
  // + is a space, and so is %20.
  ['q=hello+world', { q: [words('hello', 'world')] }],
  ['q=hello%20world', { q: [words('hello', 'world')] }],
  ['my+key=a+b%20c', { [words('my', 'key')]: ['a b c'] }],
  ['q=+', { q: [' '] }],
  // + turns into a space first, so an encoded plus (%2B) stays a plus.
  ['sum=1%2B1', { sum: ['1+1'] }],
  ['sum=1+1%2B1', { sum: ['1 1+1'] }],
  // Splitting comes before decoding, so an encoded & or = belongs to the text.
  ['a%26b=c%3Dd%26e', { 'a&b': ['c=d&e'] }],
  ['k=a%3Db&j=1', { k: ['a=b'], j: ['1'] }],
  ['city=Z%C3%BCrich', { city: ['Zürich'] }],
  ['pct=100%25', { pct: ['100%'] }],
  // An empty piece between &, or at either end, is skipped.
  ['a=1&&b=2', { a: ['1'], b: ['2'] }],
  ['&a=1', { a: ['1'] }],
  ['a=1&', { a: ['1'] }],
  ['&&a=1&&&b=2&&', { a: ['1'], b: ['2'] }],
  ['&', {}],
  ['&&&', {}],
  // Names that every plain object already has.
  ['constructor=1', { constructor: ['1'] }],
  ['constructor=1&constructor=2', { constructor: ['1', '2'] }],
  ['toString=a&hasOwnProperty=b&valueOf', { toString: ['a'], hasOwnProperty: ['b'], valueOf: [''] }],
  ['hasOwnProperty&hasOwnProperty=x&toString', { hasOwnProperty: ['', 'x'], toString: [''] }],
];

const pick = (n) => Math.floor(Math.random() * n);
const KEYS = [
  'a',
  'b',
  'c',
  'name',
  'tag',
  words('my', 'key'),
  'k&v',
  'constructor',
  'toString',
  'hasOwnProperty',
  'valueOf',
];
const VALUES = [
  '1',
  'two',
  '',
  words('Ada', 'L'),
  'x=y',
  '=',
  ' ',
  '1+1',
  'a&b',
  '100%',
  'café',
  'a b  c',
  '+',
  'q=1=2',
];

// Writes a piece the way a browser would: spaces as + or %20, and = left alone inside a value.
const encode = (text) => {
  const encoded = encodeURIComponent(text);
  return pick(2) === 0 ? encoded.replaceAll('%20', '+') : encoded;
};
const writeValue = (value) => (pick(2) === 0 ? encode(value) : encode(value).replaceAll('%3D', '='));

// Builds the query text and the answer from the same list of pairs, so no parser is needed to get the answer.
function randomQuery() {
  const keys = Array.from({ length: 1 + pick(4) }, () => KEYS[pick(KEYS.length)]);
  const pieces = [];
  const answer = new Map();
  for (let i = 0, count = pick(9); i < count; i++) {
    const key = keys[pick(keys.length)];
    const bare = pick(5) === 0;
    const value = bare ? '' : VALUES[pick(VALUES.length)];
    pieces.push(bare ? encode(key) : `${encode(key)}=${writeValue(value)}`);
    answer.set(key, [...(answer.get(key) ?? []), value]);
    while (pick(5) === 0) pieces.push('');
  }
  if (pick(4) === 0) pieces.unshift('');
  return [pieces.join('&'), Object.fromEntries(answer)];
}

// Compares own keys and arrays only, so the answer may be a plain object or one with no prototype.
function sameQuery(gave, wanted) {
  if (typeof gave !== 'object' || gave === null || Array.isArray(gave)) return false;
  const byKey = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return isDeepStrictEqual(Object.entries(gave).sort(byKey), Object.entries(wanted).sort(byKey));
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'smethods-parse-query',
  rung: 3,
  subject: 'string-methods',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.parseQuery !== 'function') return missingExport('parseQuery', typeof mod.parseQuery);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomQuery());
    for (const [input, wanted] of cases) {
      const gave = mod.parseQuery(input);
      if (!sameQuery(gave, wanted)) return wrongResult(`parseQuery(${show(input)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
