import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, wrongCallCount, passed, show } from './messages.js';
import { guardedCopy, withTraps } from './off-limits.js';

// Small functions the check hands over. `source` is how the call is shown in a failure message. Some return
// a boolean, some return other values that are truthy or falsy, so the verdict must be the truthiness.
const IS_EVEN = { source: '(x) => x % 2 === 0', run: (x) => x % 2 === 0 };
const ALWAYS = { source: '() => true', run: () => true };
const NEVER = { source: '() => false', run: () => false };
const EVEN_INDEX = { source: '(x, i) => i % 2 === 0', run: (x, i) => i % 2 === 0 };
const FROM_THIRD = { source: '(x, i) => i >= 2', run: (x, i) => i >= 2 };
const AFTER_FIRST = { source: '(x, i) => i > 0', run: (x, i) => i > 0 };
const SELF = { source: '(x) => x', run: (x) => x };
const REMAINDER = { source: '(x) => x % 3', run: (x) => x % 3 };
const EMPTY_ARRAY = { source: '() => []', run: () => [] };
const EMPTY_TEXT = { source: "() => ''", run: () => '' };
const ZERO = { source: '() => 0', run: () => 0 };
const NOTHING = { source: '() => undefined', run: () => undefined };
const NOT_TWO = { source: '(o) => o.n !== 2', run: (o) => o.n !== 2 };
const IS_NUMBER = { source: "(x) => typeof x === 'number'", run: (x) => typeof x === 'number' };
const SMALLER_THAN_INDEX = { source: '(x, i) => x > i', run: (x, i) => x > i };
const FUNCTIONS = [
  IS_EVEN,
  ALWAYS,
  NEVER,
  EVEN_INDEX,
  FROM_THIRD,
  AFTER_FIRST,
  SELF,
  REMAINDER,
  EMPTY_ARRAY,
  EMPTY_TEXT,
  ZERO,
  NOTHING,
  IS_NUMBER,
  SMALLER_THAN_INDEX,
];

const OBJECTS = [{ n: 1 }, { n: 2 }, { n: 3 }];

// [items, function]. Covers the example, an empty array, one item, falsy items that are kept, falsy and
// truthy results of other kinds than booleans, the index argument (also with repeated items), the order,
// and objects that must come back as the same objects.
const FIXED = [
  [[1, 2, 3, 4], IS_EVEN],
  [[], IS_EVEN],
  [[], ALWAYS],
  [[7], ALWAYS],
  [[7], NEVER],
  [[0, 1, 2, 0, 3], ALWAYS],
  [[0, '', false, null, undefined, 1], ALWAYS],
  [[0, '', false, null, undefined, 1], NEVER],
  [[0, 1, '', 2, 'a', null, false, 'b'], SELF],
  [[5, 6, 7, 8], EVEN_INDEX],
  [[5, 6, 7, 8], FROM_THIRD],
  [[4, 4, 4, 4], FROM_THIRD],
  [[4, 4, 4, 4], AFTER_FIRST],
  [[3, 4, 5, 6], REMAINDER],
  [[1, 2, 3], EMPTY_ARRAY],
  [[1, 2, 3], EMPTY_TEXT],
  [[1, 2, 3], ZERO],
  [[1, 2, 3], NOTHING],
  [[1, 1, 2, 1, 2], IS_EVEN],
  [[9, 1, 8, 0, 3, 2], SMALLER_THAN_INDEX],
  [[3, 'a', 0, null, 8], IS_NUMBER],
  [OBJECTS, NOT_TWO],
];

const pick = (n) => Math.floor(Math.random() * n);
const POOL = [0, 1, 2, 3, 5, 8, -4, 12, '', 'a', 'bc', false, true, null, undefined];
const randomItems = () => Array.from({ length: pick(9) }, () => POOL[pick(POOL.length)]);

const reference = (items, run) => {
  const result = [];
  for (let index = 0; index < items.length; index++) {
    if (run(items[index], index)) result.push(items[index]);
  }
  return result;
};
// The kept items must be the very same values, in the same order.
function sameItems(a, b) {
  if (!Array.isArray(a) || a.length !== b.length) return false;
  for (let k = 0; k < b.length; k++) if (!Object.is(a[k], b[k])) return false;
  return true;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'callbacks-my-filter',
  rung: 3,
  subject: 'callbacks',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.myFilter !== 'function') return missingExport('myFilter', typeof mod.myFilter);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push([randomItems(), FUNCTIONS[pick(FUNCTIONS.length)]]);
    for (const [input, { source, run }] of cases) {
      const call = `myFilter(${show(input)}, ${source})`;
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
        gave = withTraps(used, () => mod.myFilter(items, spy));
      } catch (error) {
        if (used.length === 0) throw error;
      }
      if (used.length > 0) return wrongResult(call, show(wanted), `items.${used[0]}()`);
      if (!sameItems(gave, wanted)) return wrongResult(call, show(wanted), show(gave));
      if (gave === items) return wrongResult(`myFilter(items, ${source}) === items`, 'false', 'true');
      // The spec says the input array must stay as it was.
      if (!isDeepStrictEqual([...items], input)) {
        return wrongResult(`items = ${show(input)}; myFilter(items, ${source}); items`, show(input), show([...items]));
      }
      // fn is called once for every item, with the item and its index, whatever it answered before.
      // The order of those calls is not tested.
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
