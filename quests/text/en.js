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
    'callbacks-times': {
      title: 'Call it n times',
      brief:
        'Write a function times(n, fn). n is a whole number from 0 up and fn is a function. times calls fn once for each number i from 0 up to n - 1, in that order, with i as the only argument: fn(0), fn(1), and so on up to fn(n - 1). When n is 0, fn is never called. What fn returns does not matter and must not change how many times it is called, even when it returns a falsy value like 0 or false. times itself returns nothing, which means it returns undefined.',
      stub: `// Quest: call it n times.
// Export times(n, fn): call fn(i) for each i from 0 up to n - 1, in order.
// fn gets exactly one argument, i. When n is 0, fn is never called.
// Return nothing (undefined). Do not collect or return what fn gives back.
export function times(n, fn) {
  // your code here
}
`,
      expected: [
        '`times(3, (i) => log.push(i))` gives `undefined`, and then `log` is `[0, 1, 2]`',
        '`times(1, (i) => log.push(i))` gives `undefined`, and then `log` is `[0]`',
        '`times(0, (i) => log.push(i))` gives `undefined`, and `log` is still `[]`',
      ],
      specific: ['Return `undefined`. Do not collect the results of fn.', 'Call fn with i only, once for each i.'],
    },
    'callbacks-my-map': {
      title: 'Build your own map',
      brief:
        'Write a function myMap(items, fn). items is an array and fn is a function. myMap returns a new array with one value for each item. For every item, call fn(item, index) once, where index is the place of the item in the array (0 for the first), and put what fn returns at the same place in the new array. Keep every returned value, even when it is falsy or undefined. An empty array gives []. Do not change items, and do not return items itself. The built-in array methods that would do this job for you are off limits: map, filter, forEach, reduce, reduceRight, flatMap, some, every, find, findIndex, findLast, and findLastIndex. While your function runs, calling any of them fails, even on a copy of the array, because the point of this quest is to write the loop yourself. A for loop, for...of, a while loop, recursion, or reading items[index] all work. The order in which you call fn is not checked.',
      stub: `// Quest: build your own map.
// Export myMap(items, fn): return a new array of fn(item, index) for every item.
// Do not use the built-in map, filter, forEach, reduce, reduceRight, flatMap, some, every,
// find, findIndex, findLast, or findLastIndex: the check makes them fail. Write the loop yourself.
// Do not change items. An empty array gives [].
export function myMap(items, fn) {
  // your code here
}
`,
      expected: [
        '`myMap([1, 2], (x) => x * 2)` gives `[2, 4]`',
        '`myMap([10, 20, 30], (x, i) => x + i)` gives `[10, 21, 32]`',
        '`myMap([1, 2, 3], () => undefined)` gives `[undefined, undefined, undefined]`',
        '`myMap([], (x) => x)` gives `[]`',
      ],
      specific: [
        'The callback receives both the item and its index.',
        'Loop yourself: the built-in array methods listed above fail the check.',
      ],
    },
    'callbacks-my-filter': {
      title: 'Build your own filter',
      brief:
        'Write a function myFilter(items, fn). items is an array and fn is a function. myFilter returns a new array with the items for which fn(item, index) gives a truthy value, in their original order. index is the place of the item in the array (0 for the first). fn is called once for every item, whatever it answered for the earlier ones. Only the truthiness of what fn returns counts, so 1, "yes", and [] keep the item, and 0, "", null, and undefined drop it. Items are kept as they are, so a falsy item like 0, "", false, or null stays when fn says to keep it, and an object comes back as the very same object. If no item passes, the result is []. Do not change items, and do not return items itself. The built-in array methods that would do this job for you are off limits: map, filter, forEach, reduce, reduceRight, flatMap, some, every, find, findIndex, findLast, and findLastIndex. While your function runs, calling any of them fails, even on a copy of the array, because the point of this quest is to write the loop yourself. A for loop, for...of, a while loop, recursion, or reading items[index] all work. The order in which you call fn is not checked.',
      stub: `// Quest: build your own filter.
// Export myFilter(items, fn): return a new array of the items for which fn(item, index) is truthy.
// Keep the original order and keep the items as they are, falsy ones like 0 included.
// Do not use the built-in map, filter, forEach, reduce, reduceRight, flatMap, some, every,
// find, findIndex, findLast, or findLastIndex: the check makes them fail. Write the loop yourself.
// Do not change items.
export function myFilter(items, fn) {
  // your code here
}
`,
      expected: [
        '`myFilter([1, 2, 3, 4], (x) => x % 2 === 0)` gives `[2, 4]`',
        '`myFilter([5, 6, 7, 8], (x, i) => i % 2 === 0)` gives `[5, 7]`',
        '`myFilter([0, 1, 0, 2], () => true)` gives `[0, 1, 0, 2]`',
        '`myFilter([], () => true)` gives `[]`',
      ],
      specific: [
        'Keep the original order. Items that are falsy but kept (like `0` when fn says true) must stay.',
        'Loop yourself: the built-in array methods listed above fail the check.',
      ],
    },
    'methods-names': {
      title: 'Names of the users',
      brief:
        'Write a function names(users). It receives an array of user objects. Each user has a name (a string) and may have other properties too. Return a new array with the name of each user, in the same order as the users. A name that appears twice stays twice. An empty array gives an empty array. Do not change the users array or the objects inside it.',
      stub: `// Quest: names of the users.
// Export names(users): return a new array with the name of each user, in the same order.
// Repeated names stay, and an empty array gives []. Do not change users.
export function names(users) {
  // your code here
}
`,
      expected: [
        "`names([{ name: 'Ada' }, { name: 'Bo' }])` gives `['Ada', 'Bo']`",
        "`names([{ name: 'Cy', age: 30 }, { name: 'Ada', age: 17 }, { name: 'Cy', age: 5 }])` gives `['Cy', 'Ada', 'Cy']`",
        '`names([])` gives `[]`',
      ],
      specific: ['Use map, not a loop.', 'Do not change the users.'],
    },
    'methods-adult-names': {
      title: 'Adult names, youngest first',
      brief:
        'Write a function adultNames(users). It receives an array of user objects. Each user has a name (a string) and an age (a whole number). Return an array with the names of the users who are 18 or older. Put the youngest first. Users of the same age go in name order, A to Z, compared with a plain a < b on the names (the names in the tests are one capital letter followed by lowercase letters, so localeCompare gives the same order). A user aged exactly 18 is included, a user aged 17 is not. Two users with the same name both stay in the result. If nobody is 18 or older, or the array is empty, return an empty array. Do not change the users array, its order, or the objects inside it.',
      stub: `// Quest: adult names, youngest first.
// Export adultNames(users): return the names of the users aged 18 or more.
// Youngest first. Same age: by name, A to Z. Nobody 18 or more gives [].
// Do not change users, its order, or the objects inside it.
export function adultNames(users) {
  // your code here
}
`,
      expected: [
        "`adultNames([{ name: 'Bo', age: 30 }, { name: 'Ada', age: 17 }, { name: 'Cy', age: 18 }])` gives `['Cy', 'Bo']`",
        "`adultNames([{ name: 'Cy', age: 20 }, { name: 'Bo', age: 20 }, { name: 'Ada', age: 20 }])` gives `['Ada', 'Bo', 'Cy']`",
        "`adultNames([{ name: 'Ada', age: 17 }])` gives `[]`",
      ],
      specific: ['The sort method changes the array it is called on, so copy first.', 'Chain filter, sort, and map.'],
    },
    'methods-totals-by-category': {
      title: 'Totals by category',
      brief:
        'Write a function totalsByCategory(orders). It receives an array of order objects. Each order has a category (a string made of letters) and an amount (a number that is 0 or more, whole or with at most one decimal digit). Return a new object with one key for every category that appears in the orders. The value is the sum of the amounts of all the orders in that category. A category whose amounts add up to 0 is still a key. An empty array gives an empty object. Some tests use category names that every object already has, such as constructor, toString, and hasOwnProperty, and they must count like any other name. The order of the keys does not matter, and a total that is off by a tiny floating point error (0.30000000000000004 instead of 0.3) is accepted. Every call starts from nothing: a second call must not remember the first one. Do not change the orders array or the objects inside it.',
      stub: `// Quest: totals by category.
// Export totalsByCategory(orders): each order has a category (string) and an amount (number).
// Return a new object: every category is a key, its value is the sum of the amounts in that category.
// Empty orders give {}. A category with a total of 0 is still a key.
// Names like "constructor" must work too. Do not change orders.
export function totalsByCategory(orders) {
  // your code here
}
`,
      expected: [
        "`totalsByCategory([{ category: 'a', amount: 2 }, { category: 'b', amount: 1 }, { category: 'a', amount: 3 }])` gives `{ a: 5, b: 1 }`",
        "`totalsByCategory([{ category: 'food', amount: 12.5 }, { category: 'food', amount: 0.5 }])` gives `{ food: 13 }`",
        "`totalsByCategory([{ category: 'constructor', amount: 2 }, { category: 'constructor', amount: 3 }])` gives `{ constructor: 5 }`",
        '`totalsByCategory([])` gives `{}`',
      ],
      specific: [
        'Use reduce, starting from an empty object.',
        "Categories like 'constructor' must still count correctly.",
      ],
    },
    'smethods-title-case': {
      title: 'Title case',
      brief:
        "Write a function titleCase(text). It receives a string made of letters and single spaces and returns a string where every word starts with an upper case letter and the rest of the word is lower case. A word is the run of characters between single spaces, and the spaces stay where they are. The text never starts or ends with a space and never has two spaces in a row. An empty text gives ''. Accents, digits, and other characters are not tested.",
      stub: `// Quest: title case.
// Export titleCase(text): return the text with the first letter of every word in upper case
// and the rest of each word in lower case. Words are separated by single spaces.
// An empty text gives an empty string.
export function titleCase(text) {
  // your code here
}
`,
      expected: [
        "`titleCase('hello bIG world')` gives `'Hello Big World'`",
        "`titleCase('HELLO')` gives `'Hello'`",
        "`titleCase('a b')` gives `'A B'`",
        "`titleCase('')` gives `''`",
      ],
      specific: ['Keep single spaces between the words.', "An empty text gives ''."],
    },
    'smethods-slugify': {
      title: 'Make a slug',
      brief:
        "Write a function slugify(title). It receives a string of ASCII characters and returns a slug. First turn the text to lower case. Then replace every run of characters that are not a-z or 0-9 with one '-'. Then remove a '-' at the start and a '-' at the end. Spaces, punctuation, tabs, and the underscore all count as characters that are not a-z or 0-9. A text with nothing left gives ''. Accents and other letters outside a-z are not tested.",
      stub: `// Quest: make a slug.
// Export slugify(title): lower-case the text, replace every run of characters
// that are not a-z or 0-9 with one '-', then remove a '-' at the start or the end.
// A text with nothing left gives an empty string.
export function slugify(title) {
  // your code here
}
`,
      expected: [
        "`slugify('Hello, World!')` gives `'hello-world'`",
        "`slugify('  A  b ')` gives `'a-b'`",
        "`slugify('snake_case_2')` gives `'snake-case-2'`",
        "`slugify('!!!')` gives `''`",
      ],
      specific: [
        'A regular expression is fine here.',
        'A run of several separators gives one dash, and no dash stays at the start or the end.',
      ],
    },
    'smethods-parse-query': {
      title: 'Parse a query',
      brief:
        "Write a function parseQuery(qs). It receives a query string and returns an object that maps each key to an array of its values, all strings. Split the string at every '&' into pieces and skip every empty piece (as in 'a=1&&b=2', or with a '&' at the start or the end). Split each piece at its first '=': the part before it is the key, the part after it is the value, and any later '=' stays in the value. A piece without '=' is a key with the value ''. In a key or a value, turn every '+' into a space, then decode it with decodeURIComponent. Splitting comes first and decoding last, so an encoded %26 or %3D is a plain character of the key or value. A repeated key collects its values in order in one array. The empty string gives {}. Keys such as constructor and toString must work. Percent signs that are not valid, empty keys, and the key __proto__ are not tested. The order of the keys does not matter.",
      stub: `// Quest: parse a query.
// Export parseQuery(qs): return an object that maps every key of the query string to an array
// of its values (strings). Pieces are separated by '&' and empty pieces are skipped.
// Split each piece at its first '='. A key without '=' gets the value ''.
// Turn '+' into a space, then decode with decodeURIComponent. Repeated keys collect their values in order.
// The empty string gives {}.
export function parseQuery(qs) {
  // your code here
}
`,
      expected: [
        "`parseQuery('a=1&b=two&a=3')` gives `{ a: ['1', '3'], b: ['two'] }`",
        "`parseQuery('name=Ada%20L')` gives `{ name: ['Ada L'] }`",
        "`parseQuery('x&y=')` gives `{ x: [''], y: [''] }`",
        "`parseQuery('')` gives `{}`",
      ],
      specific: [
        'Use decodeURIComponent, and turn + into a space before you decode.',
        "Words like 'constructor' must still work as keys.",
      ],
    },
    'closures-counter': {
      title: 'A counter that remembers',
      brief:
        'Write a function makeCounter(start = 0). It returns a new function. Each time that new function is called, it gives the next number: the first call gives start, the second gives start + 1, the third gives start + 2, and so on. start is a whole number, possibly negative, and it is 0 when it is left out. The returned function takes no arguments. Every call of makeCounter makes a counter with its own count, so two counters count independently: calling one never changes the other, however the calls are mixed.',
      stub: `// Quest: a counter that remembers.
// Export makeCounter(start = 0): return a function that gives start, then start + 1, and so on.
// Each counter keeps its own count, so two counters never affect each other.
export function makeCounter(start = 0) {
  // your code here
}
`,
      expected: [
        '`const c = makeCounter(5)`, then `c()` called three times gives `5`, `6`, `7`',
        '`const c = makeCounter()`, then `c()` called twice gives `0`, `1`',
        '`const c = makeCounter(-1)`, then `c()` called three times gives `-1`, `0`, `1`',
        'After `const a = makeCounter(10)` and `const b = makeCounter()`, the calls `a()`, `b()`, `a()` give `10`, `0`, `11`',
      ],
      specific: [
        'Keep the count in a variable inside makeCounter. A variable outside the function would be shared by every counter.',
        'The default parameter does the work for start: write it in the parameter list, as the starter file shows.',
      ],
    },
    'closures-once': {
      title: 'Run it only once',
      brief:
        'Write a function once(fn). It takes a function and returns a new function. The first time the new function is called, it calls fn with the arguments it received, in the same order and count, and returns what fn returned. Every later call does not call fn again, ignores its arguments, and returns that first result. This holds even when the first result is undefined or falsy (0, an empty text, false, null): fn still runs only once. once itself does not call fn, and a new function that is never called never runs fn. Every call of once makes a wrapper with its own state: two wrappers never affect each other, even when they were made from the same fn, and each of them runs fn on its own first call.',
      stub: `// Quest: run it only once.
// Export once(fn): return a function that calls fn on its first call only.
// Pass the arguments of the first call to fn. Every call returns the first result.
export function once(fn) {
  // your code here
}
`,
      expected: [
        'After `const w = once((a, b) => a + b)`, `w(2, 3)` gives `5`',
        'Then `w(10, 20)` gives `5` again and the function does not run a second time',
        'After `const n = once(() => undefined)`, calling `n()` three times gives `undefined` each time and runs the function once',
      ],
      specific: [
        'Pass the arguments through on the first call. Later arguments are ignored.',
        'Keep whether fn ran in its own variable inside once. Do not guess it from the result: the result can be undefined or 0.',
      ],
    },
    'closures-memoize': {
      title: 'Remember the results',
      brief:
        "Write a function memoize(fn). It takes a function and returns a new function. The new function calls fn with the arguments it received and returns the result, and it remembers that result by its arguments: when it is called again with the same arguments, it returns the remembered result and does not call fn again. Different arguments run fn again, and each result is remembered on its own. Arguments are the same only when they have the same values, in the same order, and the same count: (1, 23) and (12, 3) are different, (1) and (1, 1) are different, 1 and '1' are different, and one text 'a,b' is different from the two texts 'a' and 'b'. A call with no arguments counts as a call like any other, so fn runs once for it. The result can be any value, including falsy ones (0, an empty text, false, null, undefined): those are remembered too, so fn does not run again for the same arguments. memoize itself does not call fn. The memory lives inside memoize and cannot be reached from outside. Every call of memoize gets its own memory: two memoized functions never share results, even when they were made from the same fn. Arguments are only numbers and short texts, and a text can hold commas, spaces, and other symbols. Objects, arrays, and functions as arguments are not tested.",
      stub: `// Quest: remember the results.
// Export memoize(fn): return a function that calls fn and remembers each result by its arguments.
// The same arguments again give the remembered result without calling fn. Keep the memory inside memoize.
export function memoize(fn) {
  // your code here
}
`,
      expected: [
        'After `const add = memoize((a, b) => a + b)`, calling `add(2, 3)` twice gives `5` both times and runs the function once',
        'After `const pack = memoize((a, b) => a * 100 + b)`, `pack(1, 23)` gives `123` and `pack(12, 3)` gives `1203`',
        'After `const zero = memoize(() => 0)`, calling `zero(7)` twice gives `0` both times and runs the function once',
      ],
      specific: [
        'Build one key from all the arguments, so that (1, 23) and (12, 3) never share a key. Joining them with nothing between them is not enough.',
        'Keep the memory in a variable inside memoize. Not on fn, and not in a variable outside the function.',
      ],
    },
    'errors-safe-parse': {
      title: 'Parse it safely',
      brief:
        "Write a function safeParse(json, fallback). It takes a text json and a value fallback. When json is valid JSON, safeParse returns the value the text describes. When json is not valid JSON, safeParse returns fallback itself, the same value and not a copy. fallback can be any value, including undefined, null, 0, an empty text, and false. Valid JSON that describes a falsy value is still valid JSON: the texts '0', 'false', 'null', and '\"\"' give 0, false, null, and an empty text, and fallback is not used for them. Spaces around valid JSON are fine ('  7  ' gives 7). An empty text and a text with only spaces are not valid JSON. Only the error that says the text is not valid JSON may be replaced by fallback. If reading json itself throws some other error (for example json is an object whose conversion to text throws a RangeError), that error is not a parse error: it must come out of safeParse unchanged, the very same error object, and fallback must not be returned. The check hands over such an object a few times, with different error types. In every other test json is a text. In a failure message, the number after `#` marks which error object it is: the error you throw must be the very same object, not a copy with the same message.",
      stub: `// Quest: parse it safely.
// Export safeParse(json, fallback): return the parsed value, or fallback when json is not valid JSON.
// Only the parse error is replaced by fallback. Any other error must come out unchanged.
export function safeParse(json, fallback) {
  // your code here
}
`,
      expected: [
        '`safeParse(\'{"a":1}\', 0)` gives `{ a: 1 }`',
        "`safeParse('nope', 'F')` gives `'F'`",
        "`safeParse('null', 'F')` gives `null`",
        "`safeParse('0', 'F')` gives `0`",
      ],
      specific: [
        'Only swallow the parse error, not everything: check what the caught error is, and throw it again when it is not a parse error.',
        'A parsed value can be falsy (0, false, null, an empty text). Do not decide with a truthiness test on the result.',
      ],
    },
    'errors-positive-int': {
      title: 'Demand a positive whole number',
      brief:
        "Write a function requirePositiveInt(value). When value is a whole number of 1 or more, it returns value unchanged. A value is a whole number only when Number.isInteger(value) is true, so only numbers can be whole numbers. Anything that is not a whole number makes it throw a TypeError: texts (even '3'), fractions (3.5, 0.5, -2.5), NaN, Infinity, -Infinity, null, undefined, true, false, arrays (even [3]), and objects. A whole number below 1 (0, -1, -100) makes it throw a RangeError. Check the whole number rule first: 0.5 and -2.5 are not whole numbers, so they throw a TypeError and not a RangeError. Large whole numbers such as 9007199254740991 are returned, not thrown. Throw exactly a TypeError or a RangeError: a plain Error does not count, and neither does a TypeError where a RangeError is wanted. When value is a number or a text, the message of the error must contain the value written the way String(value) writes it: for 3.5 the message contains 3.5, for NaN it contains NaN, for '3' it contains 3. For any other kind of value the message can say anything.",
      stub: `// Quest: demand a positive whole number.
// Export requirePositiveInt(value): return value when it is a whole number of 1 or more.
// Throw a TypeError when it is not a whole number, and a RangeError when it is below 1.
// The message of the error mentions the bad value.
export function requirePositiveInt(value) {
  // your code here
}
`,
      expected: [
        '`requirePositiveInt(3)` gives `3`',
        "`requirePositiveInt('3')` throws `TypeError`",
        '`requirePositiveInt(3.5)` throws `TypeError`',
        '`requirePositiveInt(0)` throws `RangeError`',
      ],
      specific: [
        'Use the exact error types. The message mentions the bad value.',
        'Ask whether it is a whole number before you compare it with 1, because the order decides which error a fraction gets.',
      ],
    },
    'errors-retry': {
      title: 'Try again',
      brief:
        'Write a function retry(fn, attempts). It calls fn, with no arguments, until a call does not throw, and returns what that call returned. It calls fn at most attempts times: it stops at the first call that does not throw, and it never calls fn again after that. When all attempts throw, retry throws the error of the last call, the very same error that fn threw, not a new error and not an error that wraps it. attempts is a whole number of 1 or more. What fn throws is an error object or a text. What fn returns is a success, even when it is falsy (0, an empty text, false, null, undefined), and retry returns it as it is. fn is an ordinary function: there are no promises or async code in this quest. In the test messages, failTimes(n, value) means a function that throws on its first n calls and then returns value (undefined when value is left out). In a failure message, the number after `#` marks which error object it is: the error you throw must be the very same object, not a copy with the same message.',
      stub: `// Quest: try again.
// Export retry(fn, attempts): call fn with no arguments until a call does not throw, and return its result.
// Call fn at most attempts times. If every call throws, throw the error of the last call, as it is.
export function retry(fn, attempts) {
  // your code here
}
`,
      expected: [
        'A `fn` that throws twice and then returns `7`: `retry(fn, 3)` gives `7`, and `fn` ran 3 times',
        'The same `fn`: `retry(fn, 2)` throws the error of the second call, and `fn` ran 2 times',
        'A `fn` that returns `0` at once: `retry(fn, 5)` gives `0`, and `fn` ran 1 time',
      ],
      specific: [
        'Do not call fn more than attempts times, and do not call it again after it worked.',
        'Do not hide the original error: keep the last error in a variable that lives outside the try block, and throw that one.',
      ],
    },
    'timeouts-call-later': {
      title: 'Run it later',
      brief:
        'Write a function callLater(fn, ms). It takes a function and a number of milliseconds, and makes fn run once, after ms milliseconds have passed. fn is called with no arguments. callLater itself does not call fn, and fn does not run before the time is up: it has not run at ms - 1, it has run exactly once at ms, and it never runs again, however much more time passes. ms is a whole number from 1 up. Every call of callLater schedules its own run, so two calls with different functions or different delays never affect each other. What callLater returns is not checked. The check does not wait for real: time is simulated, and the check moves a fake clock forward to see when fn runs. Call the global `setTimeout`, do not import it, because the check replaces the global one with a simulated clock.',
      stub: `// Quest: run it later.
// Export callLater(fn, ms): make fn run once, with no arguments, after ms milliseconds.
// ms is a whole number from 1 up. Time is simulated in the check, so nothing waits for real.
export function callLater(fn, ms) {
  // your code here
}
`,
      expected: [
        'After `callLater(fn, 100)`, `fn` has run 0 times at 99 ms and 1 time at 100 ms',
        'Later still, at 5000 ms, `fn` has run 1 time in all',
        'After `callLater(fnA, 50)` and `callLater(fnB, 100)`, at 99 ms `fnA` has run 1 time and `fnB` has run 0 times',
      ],
      specific: [
        'Use setTimeout, and pass it fn itself. Writing fn() would run the function right away.',
        'A timer that repeats is not what is asked: fn must run once.',
      ],
    },
    'timeouts-cancellable': {
      title: 'Run it later, unless cancelled',
      brief:
        'Write a function cancellable(fn, ms). It makes fn run once, after ms milliseconds, and returns a function that cancels that run. Call the returned function cancel. cancellable itself does not call fn, and fn does not run before ms milliseconds have passed. When cancel is called before that time, fn never runs, however much time passes afterwards. When cancel is never called, fn runs exactly once, at ms, and never again. Calling cancel after fn has already run does nothing, and calling cancel twice or more is fine. Every call of cancellable has its own timer, so two cancellables never affect each other: cancelling one does not stop the other, in whichever order they were made and cancelled. ms is a whole number from 1 up. cancel is called with no arguments and what it returns is not checked. The check does not wait for real: time is simulated, and the check moves a fake clock forward to see when fn runs. Call the global `setTimeout`, do not import it, because the check replaces the global one with a simulated clock.',
      stub: `// Quest: run it later, unless cancelled.
// Export cancellable(fn, ms): make fn run once after ms milliseconds, and return a cancel function.
// Calling cancel before the time is up stops fn for good. Each cancellable has its own timer.
export function cancellable(fn, ms) {
  // your code here
}
`,
      expected: [
        'After `const cancel = cancellable(fn, 100)` and no `cancel()` call, `fn` has run 0 times at 99 ms and 1 time at 100 ms',
        'After `const cancel = cancellable(fn, 100)` and `cancel()` at 50 ms, `fn` has run 0 times at 100 ms and at 5000 ms',
        'A `cancel()` call after `fn` already ran changes nothing: `fn` has run 1 time in all',
      ],
      specific: [
        'Keep the timer id in a variable inside cancellable and stop it with clearTimeout. A variable outside the function would be shared by every cancellable.',
        'Calling cancel twice is fine: clearing a timer that is already gone does no harm.',
      ],
    },
    'timeouts-debounce': {
      title: 'Wait for quiet',
      brief:
        'Write a function debounce(fn, ms). It takes a function and a number of milliseconds, and returns a new function. Call the new function the debounced function. When the debounced function is called, fn does not run yet: it runs only after ms milliseconds have passed without another call, and it runs once, with the arguments of the latest call, all of them, in the same order and count (none, one, two, or more). Every call restarts the wait: when the debounced function is called again before ms have passed, the earlier call is dropped and the wait starts over from the new call. So three calls within ms run fn once, with the arguments of the third call, and fn has not run at ms - 1 of quiet. A call made after fn has run starts a new round, and fn runs again after ms of quiet. After a round has run, nothing runs again until the next call. debounce itself does not call fn, and fn never runs before ms of quiet. Every call of debounce makes its own debounced function with its own wait and its own latest arguments, so two debounced functions never affect each other. Keep it simple: there is no option to run on the first call, no way to cancel, and this is not used. ms is a whole number from 1 up. What the debounced function returns is not checked. The check does not wait for real: time is simulated, and the check moves a fake clock forward to see when fn runs. Call the global `setTimeout`, do not import it, because the check replaces the global one with a simulated clock.',
      stub: `// Quest: wait for quiet.
// Export debounce(fn, ms): return a function that runs fn only after ms milliseconds without another call.
// fn gets all the arguments of the latest call. Every call restarts the wait.
export function debounce(fn, ms) {
  // your code here
}
`,
      expected: [
        'After `const a = debounce(fn, 100)` and the calls `a(1)`, `a(2)`, `a(3)` at 0 ms, `fn` has run 0 times at 99 ms and 1 time at 100 ms, with the argument `3`',
        'After `a(1, 2)` at 0 ms, `fn` has run 1 time at 100 ms, with the arguments `1` and `2`',
        'After `a(1)` at 0 ms and `a(2)` at 60 ms, `fn` has run 0 times at 159 ms and 1 time at 160 ms, with the argument `2`',
        'After `a(1)` at 0 ms and `a(2)` at 150 ms, `fn` has run 1 time at 100 ms and 2 times at 250 ms',
      ],
      specific: [
        'Each call restarts the wait: clear the old timer, then start a new one. Keep the timer id in a variable inside debounce, so every debounced function has its own.',
        'Collect the arguments with ...args and pass them on with fn(...args) inside the timer function.',
      ],
    },
  },
};
