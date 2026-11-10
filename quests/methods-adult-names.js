import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

// Names are one capital letter and lowercase letters, so a plain < comparison and localeCompare agree.
const u = (name, age) => ({ name, age });
const FIXED = [
  [u('Bo', 30), u('Ada', 17), u('Cy', 18)],
  [],
  [u('Ada', 17), u('Bo', 5), u('Cy', 0)],
  [u('Bo', 40)],
  [u('Ada', 17)],
  // 17 is out, 18 is in, 19 is in. Input is not in order, so a sort that works in place changes it.
  [u('Dee', 19), u('Ann', 17), u('Eve', 18), u('Zed', 17), u('Cy', 18)],
  // Ties in age, the input is not in name order, so a sort by age alone keeps the wrong order.
  [u('Cy', 20), u('Bo', 20), u('Ada', 20)],
  // Age comes before name, even when the name order says otherwise.
  [u('Ada', 40), u('Zed', 19), u('Mo', 25), u('Bo', 25)],
  // Ages with a different digit count: 100 comes after 21 and 99 although '100' < '21' as text.
  [u('Ann', 100), u('Bea', 21), u('Cal', 99), u('Dan', 18), u('Eli', 9), u('Fay', 20)],
  // The same name twice, with and without the same age.
  [u('Bo', 30), u('Bo', 30), u('Ada', 30), u('Bo', 18), u('Bo', 17)],
  // A tie in age mixed with different ages, in reverse name order.
  [u('Zed', 22), u('Yan', 22), u('Xia', 22), u('Wes', 21), u('Vic', 23), u('Ula', 23)],
  [u('Bo', 18), u('Ada', 18)],
];

const NAMES = ['Ada', 'Bo', 'Cy', 'Dee', 'Eve', 'Fay', 'Zed', 'Ann', 'Anna', 'Al', 'Mo'];
const pick = (n) => Math.floor(Math.random() * n);
// Ages stay close to 18 so that ties and the boundary show up in most cases.
const randomUsers = () => Array.from({ length: pick(11) }, () => u(NAMES[pick(NAMES.length)], 13 + pick(10)));

const reference = (users) =>
  users
    .filter((user) => user.age >= 18)
    .sort((a, b) => a.age - b.age || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((user) => user.name);

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'methods-adult-names',
  rung: 3,
  subject: 'array-methods',
  tier: 'medium',
  complexity: 3,

  async check(mod) {
    if (typeof mod.adultNames !== 'function') return missingExport('adultNames', typeof mod.adultNames);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomUsers());
    for (const input of cases) {
      const wanted = reference(structuredClone(input));
      const users = structuredClone(input);
      const gave = mod.adultNames(users);
      if (!isDeepStrictEqual(gave, wanted)) {
        return wrongResult(`adultNames(${show(input)})`, show(wanted), show(gave));
      }
      // The spec says the users must stay as they were, in the same order.
      if (!isDeepStrictEqual(users, input)) {
        return wrongResult(`users = ${show(input)}; adultNames(users); users`, show(input), show(users));
      }
    }
    return passed('check.pass.everyTest');
  },
};
