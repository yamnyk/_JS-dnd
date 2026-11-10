import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

const o = (category, amount) => ({ category, amount });
const FIXED = [
  [o('a', 2), o('b', 1), o('a', 3)],
  [],
  [o('food', 12.5)],
  // One category only, with decimals that do not add up cleanly in floating point.
  [o('food', 0.1), o('food', 0.2), o('food', 0.7)],
  [o('a', 0.1), o('b', 0.2), o('a', 0.2), o('b', 0.1), o('a', 0.3)],
  // Categories that repeat, not next to each other.
  [o('a', 1), o('b', 2), o('a', 3), o('c', 4), o('b', 5), o('a', 6), o('c', 0.5)],
  // Every amount is 0: the category is still a key.
  [o('a', 0), o('b', 5), o('a', 0)],
  [o('a', 0)],
  // Names that every plain object already has.
  [o('constructor', 7)],
  [o('constructor', 2), o('a', 1), o('constructor', 3)],
  [o('toString', 1.5), o('toString', 2)],
  [o('hasOwnProperty', 4), o('a', 1), o('hasOwnProperty', 1), o('b', 2)],
  [o('toString', 2), o('constructor', 3), o('hasOwnProperty', 4), o('valueOf', 5), o('constructor', 0.5), o('a', 6)],
  [o('b', 3), o('hasOwnProperty', 0), o('toString', 0)],
  // The same call twice must not remember the first one.
  [o('a', 2), o('b', 1)],
  [o('a', 2), o('b', 1)],
];

const PLAIN = ['a', 'b', 'c', 'food', 'rent', 'fun'];
const TRICKY = ['constructor', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf'];
const pick = (n) => Math.floor(Math.random() * n);
const randomOrders = () => {
  const pool = [...PLAIN, ...TRICKY];
  return Array.from({ length: pick(13) }, () => o(pool[pick(pool.length)], pick(500) / 10));
};

// Tenths as whole numbers keep the expected sums free of floating point noise. A Map keeps the categories
// apart from the prototype tricks, then turns them into a plain object.
function reference(orders) {
  const tenths = new Map();
  for (const order of orders) {
    tenths.set(order.category, (tenths.get(order.category) ?? 0) + Math.round(order.amount * 10));
  }
  return Object.fromEntries([...tenths].map(([category, total]) => [category, total / 10]));
}

// Compares own keys and totals only, so the answer may be a plain object or one with no prototype.
// A total may be off by floating point noise.
function sameTotals(gave, wanted) {
  if (typeof gave !== 'object' || gave === null || Array.isArray(gave)) return false;
  const proto = Object.getPrototypeOf(gave);
  if (proto !== Object.prototype && proto !== null) return false;
  const byKey = (a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const gaveEntries = Object.entries(gave).sort(byKey);
  const wantedEntries = Object.entries(wanted).sort(byKey);
  if (gaveEntries.length !== wantedEntries.length) return false;
  return gaveEntries.every(
    ([key, total], i) =>
      key === wantedEntries[i][0] && typeof total === 'number' && Math.abs(total - wantedEntries[i][1]) < 1e-6,
  );
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'methods-totals-by-category',
  rung: 3,
  subject: 'array-methods',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.totalsByCategory !== 'function') {
      return missingExport('totalsByCategory', typeof mod.totalsByCategory);
    }
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomOrders());
    for (const input of cases) {
      const wanted = reference(input);
      const orders = structuredClone(input);
      const gave = mod.totalsByCategory(orders);
      if (!sameTotals(gave, wanted)) {
        return wrongResult(`totalsByCategory(${show(input)})`, show(wanted), show(gave));
      }
      // The spec says the orders must stay as they were.
      if (!isDeepStrictEqual(orders, input)) {
        return wrongResult(`orders = ${show(input)}; totalsByCategory(orders); orders`, show(input), show(orders));
      }
    }
    return passed('check.pass.everyTest');
  },
};
