import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed } from './messages.js';

const FIXED = [
  { first: 'Ada', last: 'Lovelace' },
  { first: 'Ada' },
  { first: 'Linus', last: 'Torvalds', age: 55 },
  { first: 'X' },
];

const reference = (person) => (person.last === undefined ? person.first : `${person.first} ${person.last}`);
const letters = 'abcdefghijklmnopqrstuvwxyz';
const pick = (n) => Math.floor(Math.random() * n);
const randomName = () => {
  const name = Array.from({ length: 2 + pick(8) }, () => letters[pick(letters.length)]).join('');
  return name[0].toUpperCase() + name.slice(1);
};

function randomPerson() {
  const person = { first: randomName() };
  if (pick(3) > 0) person.last = randomName();
  if (pick(2) === 0) person.age = pick(90);
  return person;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'objects-full-name',
  rung: 1,
  subject: 'objects',
  tier: 'easy',
  complexity: 1,

  async check(mod) {
    if (typeof mod.fullName !== 'function') return missingExport('fullName', typeof mod.fullName);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomPerson());
    for (const input of cases) {
      const wanted = reference(input);
      const person = { ...input };
      const gave = mod.fullName(person);
      if (gave !== wanted) {
        return wrongResult(`fullName(${JSON.stringify(input)})`, JSON.stringify(wanted), JSON.stringify(gave));
      }
      // The spec says the argument must stay as it was.
      if (!isDeepStrictEqual(person, input)) {
        return wrongResult(
          `person = ${JSON.stringify(input)}; fullName(person); person`,
          JSON.stringify(input),
          JSON.stringify(person),
        );
      }
    }
    return passed('check.pass.everyTest');
  },
};
