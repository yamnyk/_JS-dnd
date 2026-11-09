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
        "Write a function countLabel(count, noun). It returns the count and the noun joined by a space. When the count is exactly 1, the noun stays as it is. For any other count, including 0, add an 's' to the noun, even to words that end in s, x, or y.",
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
        "Write a function middle(text). It returns the middle character of the text. When the length is even, it returns the middle two characters. An empty text gives ''. Spaces are characters like any other, so do not trim the text.",
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
    'logic-fizzbuzz': {
      title: 'Fizz and Buzz',
      brief:
        "Write a function fizzBuzz(n). It receives a whole number of 1 or more and returns a string. When n is a multiple of both 3 and 5, return 'FizzBuzz'. When it is a multiple of 3 only, return 'Fizz'. When it is a multiple of 5 only, return 'Buzz'. For any other number, return the number as a string, for example '7'.",
      stub: `// Quest: fizz and buzz.
// Export fizzBuzz(n): return 'FizzBuzz' for a multiple of 3 and 5, 'Fizz' for a multiple of 3 only,
// 'Buzz' for a multiple of 5 only, and otherwise the number as a string.
export function fizzBuzz(n) {
  // your code here
}
`,
      expected: [
        "`fizzBuzz(3)` gives `'Fizz'`",
        "`fizzBuzz(10)` gives `'Buzz'`",
        "`fizzBuzz(15)` gives `'FizzBuzz'`",
        "`fizzBuzz(7)` gives `'7'`",
      ],
      specific: ['Check the multiple-of-both case first.', "The last case returns a string, not a number: '7', not 7."],
    },
    'logic-leap-year': {
      title: 'Leap year',
      brief:
        'Write a function isLeapYear(year). It receives a whole year number of 1 or more and returns true or false. A year is a leap year when it divides evenly by 4. The exception is a year that divides evenly by 100: that is not a leap year, unless it also divides evenly by 400, and then it is.',
      stub: `// Quest: leap year.
// Export isLeapYear(year): return true for a leap year and false for any other year.
// Divisible by 4 is a leap year, except divisible by 100 is not, unless also divisible by 400 it is.
export function isLeapYear(year) {
  // your code here
}
`,
      expected: [
        '`isLeapYear(2024)` gives `true`',
        '`isLeapYear(1900)` gives `false`',
        '`isLeapYear(2000)` gives `true`',
        '`isLeapYear(2023)` gives `false`',
      ],
      specific: ['Use one boolean expression or a short if chain.', 'No lookup table of years.'],
    },
    'logic-shipping-fee': {
      title: 'Shipping fee',
      brief:
        "Write a function shippingFee(order). The order is an object with weightKg (a number), express (true or false, and it may be missing), and country (text, and it may be missing). Return the fee as a number. Start from the weight: up to and including 1 kg costs 5, above 1 kg up to and including 5 kg costs 9, and above 5 kg costs 15. If express is true, multiply the fee by 1.5. After that, if the country is exactly 'PT', take 2 off, and the fee never goes below 0. Any other country, or a missing one, changes nothing. When weightKg is not a number above 0 (zero, a negative number, NaN, text, or missing), return null. Do not change the order object.",
      stub: `// Quest: shipping fee.
// Export shippingFee({ weightKg, express, country }): return the fee as a number.
// Up to 1 kg costs 5, up to 5 kg costs 9, above 5 kg costs 15. express: true multiplies the fee by 1.5.
// Then country 'PT' takes 2 off, never below 0. A weightKg that is not a number above 0 gives null.
// Do the express step before the country step. Do not change the order object.
export function shippingFee({ weightKg, express, country }) {
  // your code here
}
`,
      expected: [
        "`shippingFee({ weightKg: 2, express: false, country: 'US' })` gives `9`",
        "`shippingFee({ weightKg: 2, express: true, country: 'PT' })` gives `11.5`",
        '`shippingFee({ weightKg: -1 })` gives `null`',
      ],
      specific: [
        'Apply the express step before the country discount. The order is in the spec, do not guess it.',
        'A weight like 0, -1, NaN, or the text "2" is not a number above 0, so it gives null.',
      ],
    },
    'loops-countdown': {
      title: 'Count down',
      brief:
        'Write a function countdown(from). It receives a whole number and returns a new array that counts down from it to 1, biggest first, each number once. When from is 0 or less, it returns an empty array.',
      stub: `// Quest: count down.
// Export countdown(from): return an array counting down from "from" to 1.
// A "from" of 0 or less gives an empty array.
export function countdown(from) {
  // your code here
}
`,
      expected: ['`countdown(3)` gives `[3, 2, 1]`', '`countdown(0)` gives `[]`'],
      specific: ['Use a loop.', 'A fixed lookup of answers is caught by the generated inputs.'],
    },
    'loops-primes': {
      title: 'Find the primes',
      brief:
        'Write a function primesUpTo(n). It receives a whole number and returns an array of every prime number from 2 up to n, smallest first. When n itself is prime, it is included. When n is less than 2, it returns an empty array. n can be as large as 5000, and your code is stopped after a few seconds, so it has to be fast.',
      stub: `// Quest: find the primes.
// Export primesUpTo(n): return every prime from 2 up to n, smallest first.
// n itself counts when it is prime. An n below 2 gives an empty array.
export function primesUpTo(n) {
  // your code here
}
`,
      expected: ['`primesUpTo(10)` gives `[2, 3, 5, 7]`', '`primesUpTo(1)` gives `[]`'],
      specific: [
        'Large n, up to 5000, must finish fast.',
        'Stop testing divisors at the square root of the candidate.',
      ],
    },
    'loops-collatz': {
      title: 'Count the steps',
      brief:
        'Write a function collatzSteps(n). It receives a whole number and counts how many steps it takes to reach 1. In each step, an even number is halved and an odd number becomes 3 times itself plus 1. An n of 1 gives 0. Any n below 1 gives -1. The tests stay below 10000.',
      stub: `// Quest: count the steps.
// Export collatzSteps(n): count the steps to reach 1.
// Each step: an even number is halved, an odd number becomes 3n + 1.
// An n of 1 gives 0. An n below 1 gives -1.
export function collatzSteps(n) {
  // your code here
}
`,
      expected: [
        '`collatzSteps(6)` gives `8`',
        '`collatzSteps(1)` gives `0`',
        '`collatzSteps(27)` gives `111`',
        '`collatzSteps(0)` gives `-1`',
      ],
      specific: [
        'A while loop fits better than a for loop here.',
        'Deal with an n below 1 before the loop starts, or the loop never ends.',
      ],
    },
    'functions-clamp': {
      title: 'Keep it in range',
      brief:
        'Write a function clamp(value, min, max). It returns value when value is between min and max. When value is below min it returns min, and when value is above max it returns max. A value equal to min or max is returned as it is. min is never above max, and the two may be the same number. The numbers can be negative or have decimals.',
      stub: `// Quest: keep it in range.
// Export clamp(value, min, max): keep value inside the range from min to max.
// Below min gives min, above max gives max, anything in between comes back as it is.
export function clamp(value, min, max) {
  // your code here
}
`,
      expected: ['`clamp(15, 0, 10)` gives `10`', '`clamp(-3, 0, 10)` gives `0`', '`clamp(5, 0, 10)` gives `5`'],
      specific: ['Do not mutate anything. Just return the number.', 'A call with min above max is not tested.'],
    },
    'functions-apply-n': {
      title: 'Apply it again and again',
      brief:
        'Write a function applyN(fn, value, times = 1). It calls fn on value, then calls fn on that result, and so on, times calls in total, and returns the final result. fn is called with exactly one argument. times is optional and is 1 when it is left out. A times of 0 returns value as it is and never calls fn. times is always a whole number from 0 up. value can be any kind of value.',
      stub: `// Quest: apply it again and again.
// Export applyN(fn, value, times = 1): call fn on value, then on that result, times calls in total.
// Return the final result. fn gets exactly one argument. A times of 0 returns value and never calls fn.
export function applyN(fn, value, times = 1) {
  // your code here
}
`,
      expected: [
        '`applyN((x) => x * 2, 1, 3)` gives `8`',
        '`applyN((x) => x + 1, 5)` gives `6`',
        '`applyN((x) => x + 1, 5, 0)` gives `5`',
      ],
      specific: [
        'The default parameter is the point: write the default in the parameter list, as the starter file shows.',
        'Call fn with the value only, and no more often than times.',
      ],
    },
    'functions-compose': {
      title: 'Compose functions',
      brief:
        'Write a function compose(...fns). It takes any number of functions and returns a new function. The new function takes one argument and runs the functions from right to left: the last function gets the argument, the one to its left gets that result, and so on, and the result of the first function is returned. Each function is called once per call, with exactly one argument. compose itself calls none of them, they run only when the new function is called. With no functions, the new function returns its argument unchanged. The new function can be called many times and gives the same answer each time. It is only ever called with one argument, so more than one is not tested.',
      stub: `// Quest: compose functions.
// Export compose(...fns): return a new function that runs fns from right to left.
// compose(f, g)(x) is f(g(x)). With no functions, the new function returns its argument unchanged.
export function compose(...fns) {
  // your code here
}
`,
      expected: [
        '`compose((x) => x * 2, (x) => x + 1)(3)` gives `8`',
        '`compose((x) => x + 1, (x) => x * 2)(3)` gives `7`',
        '`compose()(5)` gives `5`',
      ],
      specific: ['Do not use eval.', 'Read right to left: the last function you receive runs first.'],
    },
  },
};
