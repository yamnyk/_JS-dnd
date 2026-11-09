import { isDeepStrictEqual } from 'node:util';
import { missingExport, wrongResult, passed, show } from './messages.js';

const FIXED = [
  [{ x: { y: 1, z: 2 } }, { x: { y: 9 } }],
  [{}, {}],
  [
    { a: 1, b: 2 },
    { b: 3, c: 4 },
  ],
  [{ a: { b: { c: 1, d: 2 } } }, { a: { b: { c: 5 }, e: 6 } }],
  [{ list: [1, 2, 3] }, { list: [9] }],
  [{ x: { y: 1 } }, { x: null }],
  [{ x: null }, { x: { y: 1 } }],
  [{ x: [1, 2] }, { x: { y: 1 } }],
  [{ x: { y: 1 } }, { x: 'text' }],
];

const isPlain = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function reference(a, b) {
  const merged = { ...a };
  for (const [key, value] of Object.entries(b)) {
    merged[key] = isPlain(value) && isPlain(merged[key]) ? reference(merged[key], value) : value;
  }
  return merged;
}

const KEYS = ['a', 'b', 'c', 'd'];
const pick = (n) => Math.floor(Math.random() * n);

function randomValue(depth) {
  const kind = pick(depth > 0 ? 6 : 5);
  if (kind === 0) return pick(10);
  if (kind === 1) return KEYS[pick(KEYS.length)];
  if (kind === 2) return null;
  if (kind === 3) return Array.from({ length: pick(4) }, () => pick(10));
  if (kind === 4) return pick(2) === 0;
  return randomObject(depth - 1);
}

function randomObject(depth) {
  const result = {};
  for (const key of KEYS) {
    if (pick(2) === 0) result[key] = randomValue(depth);
  }
  return result;
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'objects-merge-deep',
  rung: 1,
  subject: 'objects',
  tier: 'hard',
  complexity: 3,

  async check(mod) {
    if (typeof mod.mergeDeep !== 'function') return missingExport('mergeDeep', typeof mod.mergeDeep);
    const cases = FIXED.map(([a, b]) => [a, b]);
    for (let i = 0; i < 20; i++) cases.push([randomObject(3), randomObject(3)]);
    for (const [inputA, inputB] of cases) {
      const wanted = reference(inputA, inputB);
      const a = structuredClone(inputA);
      const b = structuredClone(inputB);
      const gave = mod.mergeDeep(a, b);
      if (!isDeepStrictEqual(gave, wanted)) {
        return wrongResult(`mergeDeep(${show(inputA)}, ${show(inputB)})`, show(wanted), show(gave));
      }
      // The spec says a new object comes back and neither input changes.
      if (gave === a || gave === b) {
        return wrongResult(`mergeDeep(a, b) === ${gave === a ? 'a' : 'b'}`, 'false', 'true');
      }
      const setup = `a = ${show(inputA)}; b = ${show(inputB)}; mergeDeep(a, b);`;
      if (!isDeepStrictEqual(a, inputA)) return wrongResult(`${setup} a`, show(inputA), show(a));
      if (!isDeepStrictEqual(b, inputB)) return wrongResult(`${setup} b`, show(inputB), show(b));
    }
    return passed('check.pass.everyTest');
  },
};
