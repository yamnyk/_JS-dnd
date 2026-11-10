import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, wrongCallCount, passed, show } from './messages.js';

// The built-in array methods that would do the job. The player's function gets a copy of the array on which
// each of them throws, so a solution that leans on one fails and says which.
const OFF_LIMITS = [
  'map',
  'filter',
  'forEach',
  'reduce',
  'reduceRight',
  'flatMap',
  'some',
  'every',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
];

function guardedCopy(input, used) {
  const copy = [...input];
  for (const name of OFF_LIMITS) {
    Object.defineProperty(copy, name, {
      value() {
        used.push(name);
        throw new Error(`items.${name}`);
      },
      configurable: true,
      writable: true,
      enumerable: false,
    });
  }
  return copy;
}

// Small functions the check hands over. `source` is how the call is shown in a failure message.
const DOUBLE = { source: '(x) => x * 2', run: (x) => x * 2 };
const PLUS_INDEX = { source: '(x, i) => x + i', run: (x, i) => x + i };
const INDEX = { source: '(x, i) => i', run: (x, i) => i };
const SAME = { source: '(x) => x', run: (x) => x };
const PAIR = { source: '(x, i) => [x, i]', run: (x, i) => [x, i] };
const NOTHING = { source: '() => undefined', run: () => undefined };
const IS_BIG = { source: '(x) => x > 1', run: (x) => x > 1 };
const TYPE = { source: '(x, i) => typeof x + i', run: (x, i) => typeof x + i };
const FALSY = { source: '() => 0', run: () => 0 };
const TAKE_A = { source: '(o) => o.a', run: (o) => o.a };
const FUNCTIONS = [DOUBLE, PLUS_INDEX, INDEX, SAME, PAIR, NOTHING, IS_BIG, TYPE, FALSY];

// [items, function]. Covers the examples, an empty array, one item, falsy items kept, results that are falsy
// or undefined, the index argument, and objects as items.
const FIXED = [
  [[1, 2], DOUBLE],
  [[], DOUBLE],
  [[], PLUS_INDEX],
  [[7], PLUS_INDEX],
  [[7], INDEX],
  [[10, 20, 30], PLUS_INDEX],
  [[10, 20, 30], INDEX],
  [[5, 5, 5], INDEX],
  [[0, '', false, null, undefined], SAME],
  [[0, '', false, null, undefined], PAIR],
  [[1, 2, 3], NOTHING],
  [[1, 2, 3], IS_BIG],
  [[1, 2, 3], FALSY],
  [['a', 'b'], PLUS_INDEX],
  [[3, 1, 2], PAIR],
  [[1, 'a', null], TYPE],
  [[{ a: 1 }, { a: 2 }], TAKE_A],
];

const pick = (n) => Math.floor(Math.random() * n);
const POOL = [0, 1, 2, 3, 5, 8, -4, 12, '', 'a', 'bc', false, true, null, undefined];
const randomItems = () => Array.from({ length: pick(8) }, () => POOL[pick(POOL.length)]);

const reference = (items, run) => {
  const result = [];
  for (let index = 0; index < items.length; index++) result.push(run(items[index], index));
  return result;
};

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'callbacks-my-map',
  rung: 3,
  subject: 'callbacks',
  tier: 'medium',
  complexity: 3,

  async check(mod) {
    if (typeof mod.myMap !== 'function') return missingExport('myMap', typeof mod.myMap);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push([randomItems(), FUNCTIONS[pick(FUNCTIONS.length)]]);
    for (const [input, { source, run }] of cases) {
      const call = `myMap(${show(input)}, ${source})`;
      const wanted = reference(input, run);
      const used = [];
      const items = guardedCopy(input, used);
      const calls = [];
      const spy = (...received) => {
        calls.push(received);
        return run(...received);
      };
      let gave;
      try {
        gave = mod.myMap(items, spy);
      } catch (error) {
        if (used.length === 0) throw error;
      }
      if (used.length > 0) return wrongResult(call, show(wanted), `items.${used[0]}()`);
      if (!isDeepStrictEqual(gave, wanted)) return wrongResult(call, show(wanted), show(gave));
      if (gave === items) return wrongResult(`myMap(items, ${source}) === items`, 'false', 'true');
      // The spec says the input array must stay as it was.
      if (!isDeepStrictEqual([...items], input)) {
        return wrongResult(`items = ${show(input)}; myMap(items, ${source}); items`, show(input), show([...items]));
      }
      // fn is called once for every item, with the item and its index. The order of those calls is not tested.
      if (calls.length !== input.length) return wrongCallCount(call, input.length, calls.length);
      const pending = input.map((item, index) => [item, index]);
      for (let k = 0; k < calls.length; k++) {
        const at = pending.findIndex(([item, index]) => Object.is(calls[k][0], item) && Object.is(calls[k][1], index));
        if (at === -1) {
          return wrongResult(
            `${call}, call ${k + 1}`,
            `fn(${show(pending[0][0])}, ${pending[0][1]})`,
            `fn(${show(calls[k][0])}, ${show(calls[k][1])})`,
          );
        }
        pending.splice(at, 1);
      }
    }
    return passed('check.pass.everyTest');
  },
};
