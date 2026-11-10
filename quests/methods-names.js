import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

// Users may carry other properties besides the name. Order, repeats, and the other properties must not matter.
const FIXED = [
  [{ name: 'Ada' }, { name: 'Bo' }],
  [],
  [{ name: 'Zed' }],
  [{ name: 'Cy' }, { name: 'Ada' }, { name: 'Cy' }, { name: 'Bo' }, { name: 'Ada' }],
  [
    { name: 'Mo', age: 31, id: 7 },
    { name: 'Ada', age: 17, id: 2 },
    { name: 'Bo', age: 18, id: 9 },
  ],
  [{ name: 'ada' }, { name: 'Ada' }, { name: 'ADA' }, { name: 'Moe' }],
];

const POOL = ['Ada', 'Bo', 'Cy', 'Dee', 'Eve', 'Zed', 'ada', 'Moe', 'Zoe'];
const pick = (n) => Math.floor(Math.random() * n);
const randomUsers = () =>
  Array.from({ length: pick(9) }, () => {
    const user = { name: POOL[pick(POOL.length)] };
    if (pick(2) === 0) user.age = pick(60);
    if (pick(3) === 0) user.id = pick(1000);
    return user;
  });

const reference = (users) => users.map((user) => user.name);

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'methods-names',
  rung: 3,
  subject: 'array-methods',
  tier: 'easy',
  complexity: 2,

  async check(mod) {
    if (typeof mod.names !== 'function') return missingExport('names', typeof mod.names);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomUsers());
    for (const input of cases) {
      const wanted = reference(input);
      const users = structuredClone(input);
      const gave = mod.names(users);
      if (!isDeepStrictEqual(gave, wanted)) return wrongResult(`names(${show(input)})`, show(wanted), show(gave));
      // The spec says the users must stay as they were.
      if (!isDeepStrictEqual(users, input)) {
        return wrongResult(`users = ${show(input)}; names(users); users`, show(input), show(users));
      }
    }
    return passed('check.pass.everyTest');
  },
};
