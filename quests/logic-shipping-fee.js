import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

// Weights on both sides of each threshold (1 and 5), and the odd ones the brief names.
const LIGHT = [0.001, 0.5, 1];
const MEDIUM = [1.0001, 2, 4.99, 5];
const HEAVY = [5.0001, 6, 20, 1000];
const BAD = [0, -0, -1, -0.5, -100, Number.NaN, '2', '', undefined, null, true, [2]];

// Every weight class against every way to ask for express and every country, the way a player could.
const EXPRESS = [{ express: true }, { express: false }, {}];
const COUNTRY = [{ country: 'PT' }, { country: 'US' }, { country: 'ES' }, { country: '' }, {}];

const pick = (n) => Math.floor(Math.random() * n);
const choose = (items) => items[pick(items.length)];

function reference({ weightKg, express, country }) {
  if (typeof weightKg !== 'number' || !(weightKg > 0)) return null;
  let fee = weightKg <= 1 ? 5 : weightKg <= 5 ? 9 : 15;
  if (express === true) fee = fee * 1.5;
  if (country === 'PT') fee = Math.max(0, fee - 2);
  return fee;
}

// The catalog examples come first, so the first failure a player sees is one from the brief.
const FIXED = [
  { weightKg: 2, express: false, country: 'US' },
  { weightKg: 2, express: true, country: 'PT' },
  { weightKg: -1 },
];
for (const weightKg of [...LIGHT, ...MEDIUM, ...HEAVY]) {
  for (const express of EXPRESS) {
    for (const country of COUNTRY) FIXED.push({ weightKg, ...express, ...country });
  }
}
for (const weightKg of BAD) {
  FIXED.push({ weightKg }, { weightKg, express: true, country: 'PT' }, { weightKg, express: false, country: 'US' });
}
// A missing weight is not even a property.
FIXED.push({}, { express: true, country: 'PT' });

const randomOrder = () => {
  const weightKg =
    pick(2) === 0 ? choose([...LIGHT, ...MEDIUM, ...HEAVY]) : Math.round(Math.random() * 3000) / 100 + 0.01;
  return { weightKg, express: choose([true, false, undefined]), country: choose(['PT', 'US', 'DE', undefined]) };
};

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'logic-shipping-fee',
  rung: 2,
  subject: 'conditionals',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.shippingFee !== 'function') return missingExport('shippingFee', typeof mod.shippingFee);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomOrder());
    for (const input of cases) {
      const order = { ...input };
      const gave = mod.shippingFee(order);
      const wanted = reference(input);
      if (gave !== wanted) return wrongResult(`shippingFee(${show(input)})`, show(wanted), show(gave));
      // The spec says the order object must stay as it was.
      if (!isDeepStrictEqual(order, input)) {
        return wrongResult(`order = ${show(input)}; shippingFee(order); order`, show(input), show(order));
      }
    }
    return passed('check.pass.everyTest');
  },
};
