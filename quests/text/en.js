// English quest text: titles, briefs, starter files, and the style directions. Check messages live in
// game/locales/en.js. The code in a starter file must match the Ukrainian one line for line, only the
// comments differ. No em-dash or en-dash anywhere.
export default {
  general: [
    'Use const by default, let only when a variable is reassigned, and never var.',
    'Use strict equality (===), never ==.',
    'Use clear camelCase names. A name says what the value is, not its type.',
    'Write small functions that do one job. Return values, do not print them.',
    'Do not change the arguments you receive unless the spec says so.',
    'Leave no console.log in the submitted file.',
    'Use a two space indent, single quotes, and semicolons.',
    'Write comments only for the why, never for the what.',
    'Solve the real problem. Never hardcode expected results, read the check files, or use eval.',
  ],
  quests: {
    'dice-roll': {
      title: 'Roll your own die',
      brief:
        'Write a function rollDie(sides, rng) that rolls one die. rng is a function that gives a number from 0 up to, but not including, 1 (it defaults to Math.random). Return a whole number from 1 to sides. Read game/dice.js first to see how the game does it, then write your own version.',
      stub: `// Quest: roll your own die.
// Export rollDie(sides, rng). rng() gives a number from 0 up to (not including) 1.
// Return a whole number from 1 to sides. Read game/dice.js for inspiration, but write your own.
export function rollDie(sides, rng = Math.random) {
  // your code here
}
`,
      expected: [
        '`rollDie(6, () => 0)` gives `1`',
        '`rollDie(6, () => 0.999999)` gives `6`',
        '`rollDie(20, () => 0.5)` gives `11`',
      ],
      specific: [],
    },
    'string-shout': {
      title: 'Make some noise',
      brief:
        'Write a function shout(text). It removes spaces from both ends of the text, makes it all capital letters, and puts an exclamation mark on the end.',
      stub: `// Quest: make some noise.
// Export shout(text): trim the spaces off both ends, make it ALL CAPS, and add a "!" at the end.
export function shout(text) {
  // your code here
}
`,
      expected: [
        "`shout('hello')` gives `'HELLO!'`",
        "`shout('  hi there ')` gives `'HI THERE!'`",
        "`shout('')` gives `'!'`",
      ],
      specific: [],
    },
    'array-sum': {
      title: 'Count the even ones',
      brief:
        'Write a function sumEven(numbers). It receives an array of whole numbers and returns the total of only the even ones. An empty array gives 0.',
      stub: `// Quest: count the even ones.
// Export sumEven(numbers): add up only the even numbers in the array and return the total.
// An empty array, or one with no even numbers, gives 0.
export function sumEven(numbers) {
  // your code here
}
`,
      expected: ['`sumEven([1, 2, 3, 4])` gives `6`', '`sumEven([])` gives `0`', '`sumEven([-2, 3])` gives `-2`'],
      specific: [],
    },
    'values-fahrenheit': {
      title: 'Celsius to Fahrenheit',
      brief:
        'Write a function celsiusToFahrenheit(c). It receives a temperature in degrees Celsius (a number, it may be negative or have decimals) and returns the same temperature in degrees Fahrenheit, using c * 9 / 5 + 32. Do not round the result.',
      stub: `// Quest: Celsius to Fahrenheit.
// Export celsiusToFahrenheit(c): return c * 9 / 5 + 32.
// Do not round the result.
export function celsiusToFahrenheit(c) {
  // your code here
}
`,
      expected: [
        '`celsiusToFahrenheit(0)` gives `32`',
        '`celsiusToFahrenheit(100)` gives `212`',
        '`celsiusToFahrenheit(-40)` gives `-40`',
      ],
      specific: ['Write it as one expression.', 'Do not round the result.'],
    },
    'values-describe': {
      title: 'Name the type',
      brief:
        "Write a function describeValue(value). It returns the typeof string of the value (like 'number', 'string', 'boolean', 'undefined'), except that it returns 'null' for null and 'array' for arrays.",
      stub: `// Quest: name the type.
// Export describeValue(value): return the typeof string of the value.
// Exceptions: return 'null' for null and 'array' for arrays.
export function describeValue(value) {
  // your code here
}
`,
      expected: [
        "`describeValue(5)` gives `'number'`",
        "`describeValue(null)` gives `'null'`",
        "`describeValue([1])` gives `'array'`",
        "`describeValue(undefined)` gives `'undefined'`",
      ],
      specific: ["typeof null and typeof [] are both 'object'.", 'Use Array.isArray to tell an array from an object.'],
    },
    'values-to-number': {
      title: 'Number or nothing',
      brief:
        'Write a function toNumberOrNull(input). If the input is a number or a string that holds a number (spaces around it are fine), return that number. For anything else, return null. That includes an empty string, a string of only spaces, text that is not a number, null, undefined, booleans, arrays, and objects. NaN is never returned: a NaN input gives null.',
      stub: `// Quest: number or nothing.
// Export toNumberOrNull(input): return a number for numbers and numeric strings, otherwise null.
// Spaces around a numeric string are fine. NaN is never returned.
export function toNumberOrNull(input) {
  // your code here
}
`,
      expected: [
        "`toNumberOrNull('42')` gives `42`",
        "`toNumberOrNull(' 7 ')` gives `7`",
        "`toNumberOrNull('')` gives `null`",
        "`toNumberOrNull('abc')` gives `null`",
      ],
      specific: [
        "Number(''), Number(' '), and Number(null) are all 0. Do not trust Number alone.",
        'The function must never return NaN.',
      ],
    },
    'strings-count-label': {
      title: 'Count with a label',
      brief:
        "Write a function countLabel(count, noun). It returns the count and the noun joined by a space. When the count is exactly 1, the noun stays as it is. For any other count, including 0, add an 's' to the noun.",
      stub: `// Quest: count with a label.
// Export countLabel(count, noun): return the count and the noun joined by a space.
// A count of 1 keeps the noun as it is. Any other count, including 0, adds an "s".
export function countLabel(count, noun) {
  // your code here
}
`,
      expected: [
        "`countLabel(1, 'apple')` gives `'1 apple'`",
        "`countLabel(0, 'apple')` gives `'0 apples'`",
        "`countLabel(3, 'apple')` gives `'3 apples'`",
      ],
      specific: ["Regular plural only: just add 's'.", 'Use a template literal.'],
    },
    'strings-middle': {
      title: 'Find the middle',
      brief:
        "Write a function middle(text). It returns the middle character of the text. When the length is even, it returns the middle two characters. An empty text gives ''.",
      stub: `// Quest: find the middle.
// Export middle(text): return the middle character, or the middle two when the length is even.
// An empty text gives an empty string.
export function middle(text) {
  // your code here
}
`,
      expected: ["`middle('abc')` gives `'b'`", "`middle('abcd')` gives `'bc'`", "`middle('')` gives `''`"],
      specific: ['Work from length and indexes.', 'Emoji and other surrogate pairs are not tested.'],
    },
    'arrays-first-last': {
      title: 'First and last',
      brief:
        'Write a function firstAndLast(items). It receives an array and returns a new array with two entries: the first item and the last item. An array with one item gives that item twice. An empty array gives an empty array.',
      stub: `// Quest: first and last.
// Export firstAndLast(items): return a new array holding the first item and the last item.
// One item gives it twice. An empty array gives []. Do not change the input array.
export function firstAndLast(items) {
  // your code here
}
`,
      expected: [
        '`firstAndLast([1, 2, 3])` gives `[1, 3]`',
        '`firstAndLast([7])` gives `[7, 7]`',
        '`firstAndLast([])` gives `[]`',
      ],
      specific: ['Do not change the input array.'],
    },
    'arrays-rotate': {
      title: 'Rotate left',
      brief:
        'Write a function rotateLeft(items, steps). It receives an array and a whole number, and returns a new array where every item has moved steps places to the left. The items that fall off the front come around to the back. steps can be bigger than the length of the array, and it can be negative (then the items move to the right). An empty array gives an empty array.',
      stub: `// Quest: rotate left.
// Export rotateLeft(items, steps): return a new array moved steps places to the left.
// The items that fall off the front come around to the back.
// steps can be bigger than the array, zero, or negative (negative moves right).
export function rotateLeft(items, steps) {
  // your code here
}
`,
      expected: [
        '`rotateLeft([1, 2, 3, 4], 1)` gives `[2, 3, 4, 1]`',
        '`rotateLeft([1, 2, 3, 4], 5)` gives `[2, 3, 4, 1]`',
        '`rotateLeft([1, 2, 3, 4], -1)` gives `[4, 1, 2, 3]`',
      ],
      specific: ['Do not change the input array.', 'A steps of 0 returns a copy, not the same array.'],
    },
    'objects-full-name': {
      title: 'Full name',
      brief:
        'Write a function fullName(person). The person is an object with a first property and sometimes a last property. Return first and last joined with one space. When last is missing, return just first.',
      stub: `// Quest: full name.
// Export fullName(person): person has a first property and sometimes a last property.
// Return them joined with one space. When last is missing, return just first.
export function fullName(person) {
  // your code here
}
`,
      expected: [
        "`fullName({ first: 'Ada', last: 'Lovelace' })` gives `'Ada Lovelace'`",
        "`fullName({ first: 'Ada' })` gives `'Ada'`",
      ],
      specific: ['No trailing space when last is missing.'],
    },
    'objects-count-words': {
      title: 'Count the words',
      brief:
        'Write a function countWords(words). It receives an array of strings and returns a new object that says how many times each word appears: the words are the keys and the counts are the values. An empty array gives an empty object.',
      stub: `// Quest: count the words.
// Export countWords(words): return a new object with each word as a key
// and how many times it appears in the array as the value.
// An empty array gives {}.
export function countWords(words) {
  // your code here
}
`,
      expected: ["`countWords(['a', 'b', 'a'])` gives `{ a: 2, b: 1 }`", '`countWords([])` gives `{}`'],
      specific: ['Return a new object.', "Words like 'constructor' must still count correctly."],
    },
    'objects-merge-deep': {
      title: 'Merge deep',
      brief:
        'Write a function mergeDeep(a, b). It receives two objects and returns a new object with the properties of both. When both have the same property, the value from b wins, except when both values are plain objects: then those two objects are merged the same way, going as deep as needed. Arrays, null, and other values from b simply replace the value from a.',
      stub: `// Quest: merge deep.
// Export mergeDeep(a, b): return a new object with the properties of a and b.
// When both have the same property, b wins, except when both values are plain objects:
// then merge those two objects the same way, as deep as they go.
// Arrays are replaced, not merged. Do not change a or b.
export function mergeDeep(a, b) {
  // your code here
}
`,
      expected: [
        '`mergeDeep({ x: { y: 1, z: 2 } }, { x: { y: 9 } })` gives `{ x: { y: 9, z: 2 } }`',
        '`mergeDeep({ a: 1, b: 2 }, { b: 3, c: 4 })` gives `{ a: 1, b: 3, c: 4 }`',
        '`mergeDeep({ list: [1, 2, 3] }, { list: [9] })` gives `{ list: [9] }`',
      ],
      specific: ['Neither input is changed.', 'Arrays are replaced, not merged.'],
    },
  },
};
