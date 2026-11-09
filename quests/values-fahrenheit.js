import { missingExport, wrongResult, passed } from './messages.js';

const FIXED = [0, 100, -40, 37, -273, 36.6];

const reference = (c) => (c * 9) / 5 + 32;
const pick = (n) => Math.floor(Math.random() * n);

// Floating point: c * 1.8 + 32 and c * 9 / 5 + 32 can differ in the last digit, and both are right.
const close = (gave, wanted) => typeof gave === 'number' && Math.abs(gave - wanted) < 1e-9;

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'values-fahrenheit',
  rung: 1,
  subject: 'values',
  tier: 'easy',
  complexity: 1,

  async check(mod) {
    if (typeof mod.celsiusToFahrenheit !== 'function') {
      return missingExport('celsiusToFahrenheit', typeof mod.celsiusToFahrenheit);
    }
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) {
      // Whole numbers and tenths, so a function that rounds cannot pass.
      cases.push(i % 2 === 0 ? pick(301) - 150 : (pick(2001) - 1000) / 10);
    }
    for (const input of cases) {
      const wanted = reference(input);
      const gave = mod.celsiusToFahrenheit(input);
      if (!close(gave, wanted)) {
        return wrongResult(
          `celsiusToFahrenheit(${JSON.stringify(input)})`,
          wanted,
          typeof gave === 'number' ? gave : JSON.stringify(gave),
        );
      }
    }
    return passed('check.pass.everyTest');
  },
};
