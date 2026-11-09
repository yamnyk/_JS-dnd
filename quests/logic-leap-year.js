import { missingExport, wrongResult, passed, show } from './messages.js';

// Every kind of year the rule names, on both sides: a multiple of 400, a multiple of 100 but not 400, a
// multiple of 4 but not 100, and a year that is none of those.
const FIXED = [
  2024, 1900, 2000, 2023, 1, 2, 3, 4, 5, 8, 100, 200, 400, 800, 1600, 1700, 1800, 1996, 2001, 2004, 2019, 2020, 2022,
  2100, 2200, 2300, 2400, 1904, 1999, 8000, 9900, 9996,
];

const pick = (n) => Math.floor(Math.random() * n);
const reference = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

// A random year of the wanted kind, from 1 to 9999.
function randomYear(kind) {
  if (kind === 0) return 400 * (1 + pick(24));
  if (kind === 1) {
    const hundreds = 1 + pick(99);
    return 100 * (hundreds % 4 === 0 ? hundreds + 1 : hundreds);
  }
  if (kind === 2) {
    const fours = 1 + pick(2499);
    return 4 * (fours % 25 === 0 ? fours + 1 : fours);
  }
  const year = 1 + pick(9999);
  return year % 4 === 0 ? year + 1 : year;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'logic-leap-year',
  rung: 2,
  subject: 'conditionals',
  tier: 'medium',
  complexity: 2,

  async check(mod) {
    if (typeof mod.isLeapYear !== 'function') return missingExport('isLeapYear', typeof mod.isLeapYear);
    const cases = [...FIXED];
    // The four kinds of year take turns, so every part of the rule is tested on every run.
    for (let i = 0; i < 20; i++) cases.push(randomYear(i % 4));
    for (const year of cases) {
      const gave = mod.isLeapYear(year);
      const wanted = reference(year);
      if (gave !== wanted) return wrongResult(`isLeapYear(${show(year)})`, show(wanted), show(gave));
    }
    return passed('check.pass.everyTest');
  },
};
