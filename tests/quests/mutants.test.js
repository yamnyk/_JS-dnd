import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runQuestCheck } from '../../game/quest-runner.js';
import { show } from '../../quests/messages.js';

// Wrong solutions found by reviewers. Each one has to fail on every run, not on most of them: a check that
// leans on random inputs alone gives a different verdict from one run to the next.
const dir = mkdtempSync(join(tmpdir(), 'jsdnd-mutants-'));
let n = 0;
const run = (id, code) => {
  const file = join(dir, `mutant-${n++}.js`);
  writeFileSync(file, code);
  return runQuestCheck(id, file, { timeoutMs: 15000 });
};
const RUNS = 12;

test('countLabel that adds es or ies after s, x, and y fails on every run, because the brief says only add s', () => {
  const code = `export function countLabel(count, noun) {
  const many = /y$/.test(noun) ? noun.slice(0, -1) + 'ies' : /[sx]$/.test(noun) ? noun + 'es' : noun + 's';
  return count === 1 ? '1 ' + noun : count + ' ' + many;
}`;
  for (let i = 0; i < RUNS; i++) assert.equal(run('strings-count-label', code).status, 'fail', `run ${i}`);
});

test('middle that trims its text first fails on every run, because spaces count as characters', () => {
  const code = `export function middle(text) {
  const t = text.trim();
  if (t === '') return '';
  const half = Math.floor(t.length / 2);
  return t.length % 2 === 0 ? t.slice(half - 1, half + 1) : t[half];
}`;
  for (let i = 0; i < RUNS; i++) assert.equal(run('strings-middle', code).status, 'fail', `run ${i}`);
});

test('the show helper prints undefined, NaN, and negative zero as themselves, and arrays and objects like JSON', () => {
  assert.equal(show(undefined), 'undefined');
  assert.equal(show(Number.NaN), 'NaN');
  assert.equal(show(-0), '-0');
  assert.equal(show(Infinity), 'Infinity');
  assert.equal(show([undefined, Number.NaN, null, 1]), '[undefined,NaN,null,1]');
  assert.equal(show({ a: undefined, b: Number.NaN, c: 'x' }), '{"a":undefined,"b":NaN,"c":"x"}');
  assert.equal(show('hi "there"'), '"hi \\"there\\""');
  assert.equal(show(null), 'null');
  assert.equal(show(true), 'true');
  assert.equal(show([[1, [2]], { k: [3] }]), '[[1,[2]],{"k":[3]}]');
  assert.equal(show(10n), '10n');
  assert.equal(
    show(() => 1),
    'function',
  );
});

test('the show helper prints a Map and a Set so a wrong type is visible', () => {
  assert.equal(show(new Map([['a', 1]])), 'Map {"a" => 1}');
  assert.equal(show(new Set([1, 'b'])), 'Set {1, "b"}');
  assert.equal(show(new Map()), 'Map {}');
});

test('the show helper survives a circular structure instead of looping', () => {
  const loop = { name: 'loop' };
  loop.self = loop;
  assert.match(show(loop), /\.\.\./);
});

test('a first-and-last that gives back undefined is told so, not that it gave null', () => {
  const result = run(
    'arrays-first-last',
    'export function firstAndLast(items) { return [items[0], items[items.length - 1]]; }',
  );
  assert.equal(result.status, 'fail');
  assert.match(result.got, /undefined/);
  assert.doesNotMatch(result.got, /null/);
});

test('a word counter that forgets the starting value is shown NaN, not null', () => {
  const code = `export function countWords(words) {
  const counts = Object.create(null);
  for (const w of words) counts[w]++;
  return counts;
}`;
  const result = run('objects-count-words', code);
  assert.equal(result.status, 'fail');
  assert.match(result.got, /NaN/);
  assert.doesNotMatch(result.got, /null/);
});

test('a merge that leaves a key undefined shows that key', () => {
  const code = 'export function mergeDeep(a, b) { return { ...a, ...b, extra: undefined }; }';
  const result = run('objects-merge-deep', code);
  assert.equal(result.status, 'fail');
  assert.match(result.got, /"extra":undefined/);
});

test('a rotate that returns undefined entries is shown undefined, not null', () => {
  const result = run(
    'arrays-rotate',
    'export function rotateLeft(items, steps) { return items.map(() => undefined); }',
  );
  assert.equal(result.status, 'fail');
  assert.match(result.got, /undefined/);
  assert.doesNotMatch(result.got, /null/);
});

// The messages about how often and how a function is called are words, so they come from the catalogs.
const runIn = (id, code, lang) => {
  const file = join(dir, `mutant-${n++}.js`);
  writeFileSync(file, code);
  return runQuestCheck(id, file, { timeoutMs: 15000, lang });
};
const EXTRA_CALL =
  'export function applyN(fn, value, times = 1) { fn(value); let v = value; for (let i = 0; i < times; i++) v = fn(v); return v; }';
const TWO_ARGUMENTS =
  'export function applyN(fn, value, times = 1) { let v = value; for (let i = 0; i < times; i++) v = fn(v, i); return v; }';

test('an applyN that calls fn one time too many says so in English from the catalog', () => {
  const result = runIn('functions-apply-n', EXTRA_CALL, 'en');
  assert.equal(result.status, 'fail');
  assert.match(result.expected + result.got, /number of calls to fn/);
});

test('the same failure is told in Ukrainian, with no English sentence left in it', () => {
  const result = runIn('functions-apply-n', EXTRA_CALL, 'uk');
  assert.equal(result.status, 'fail');
  assert.match(result.expected + result.got, /кількість викликів/);
  assert.doesNotMatch(result.expected + result.got, /number of calls/);
});

test('an applyN that gives fn a second argument is told so in both languages', () => {
  const english = runIn('functions-apply-n', TWO_ARGUMENTS, 'en');
  assert.equal(english.status, 'fail');
  assert.match(english.expected + english.got, /exactly 1 argument|2 arguments/);
  const ukrainian = runIn('functions-apply-n', TWO_ARGUMENTS, 'uk');
  assert.match(ukrainian.expected + ukrainian.got, /аргумент/);
});

test('a collatz that returns the steps as text is shown quoted, so the player can see the difference', () => {
  const code = `export function collatzSteps(n) {
  if (n < 1) return String(-1);
  let steps = 0;
  while (n !== 1) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    steps++;
  }
  return String(steps);
}`;
  const result = run('loops-collatz', code);
  assert.equal(result.status, 'fail');
  assert.notEqual(result.got, result.expected);
  assert.match(result.got, /gave "/);
});

// The off-limits built-ins are trapped on Array.prototype for the duration of the player's call, so copying
// the array first does not get around the rule.
const COPYING_MAP = [
  'export function myMap(items, fn) { return [...items].map(fn); }',
  'export function myMap(items, fn) { return items.slice().map((x, i) => fn(x, i)); }',
  'export function myMap(items, fn) { return Array.prototype.map.call(items, fn); }',
  'export function myMap(items, fn) { const out = []; [...items].forEach((x, i) => out.push(fn(x, i))); return out; }',
];
const COPYING_FILTER = [
  'export function myFilter(items, fn) { return [...items].filter(fn); }',
  'export function myFilter(items, fn) { return Array.from(items).filter((x, i) => fn(x, i)); }',
  'export function myFilter(items, fn) { return Array.prototype.filter.call(items, fn); }',
];

test('myMap that copies the array before calling a built-in still fails, on every run', () => {
  for (const code of COPYING_MAP) {
    for (let i = 0; i < 4; i++) {
      const result = run('callbacks-my-map', code);
      assert.equal(result.status, 'fail', code);
      assert.match(result.got, /items\.(map|forEach)\(\)/, code);
    }
  }
});

test('myFilter that copies the array before calling a built-in still fails, on every run', () => {
  for (const code of COPYING_FILTER) {
    for (let i = 0; i < 4; i++) {
      assert.equal(run('callbacks-my-filter', code).status, 'fail', code);
    }
  }
});

test('plain loops, recursion, and entries() still pass after the prototype traps, and the prototype is left as it was', () => {
  const valid = [
    [
      'callbacks-my-map',
      'export function myMap(items, fn) { const out = []; for (let i = 0; i < items.length; i++) out.push(fn(items[i], i)); return out; }',
    ],
    [
      'callbacks-my-map',
      'export function myMap(items, fn) { const out = []; for (const [i, x] of items.entries()) out[i] = fn(x, i); return out; }',
    ],
    [
      'callbacks-my-map',
      'export function myMap(items, fn, i = 0) { return i >= items.length ? [] : [fn(items[i], i), ...myMap(items, fn, i + 1)]; }',
    ],
    [
      'callbacks-my-filter',
      'export function myFilter(items, fn) { const out = []; let i = 0; while (i < items.length) { if (fn(items[i], i)) out.push(items[i]); i++; } return out; }',
    ],
  ];
  for (const [id, code] of valid) assert.equal(run(id, code).status, 'pass', code);
  assert.ok(Array.prototype.map.toString().includes('[native code]'));
});

// ---- rung 4 review: a verdict must not contradict itself, and the briefs must say what the check enforces
test('a retry that gives fn an argument is told fn takes none, not exactly one', () => {
  const code = `export function retry(fn, attempts) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return fn(i);
    } catch (error) {
      last = error;
    }
  }
  throw last;
}`;
  const english = runIn('errors-retry', code, 'en');
  assert.equal(english.status, 'fail');
  assert.match(english.expected, /exactly 0 arguments/);
  assert.doesNotMatch(english.expected, /exactly 1 argument/);
  const ukrainian = runIn('errors-retry', code, 'uk');
  assert.match(ukrainian.expected, /рівно 0 аргументів/);
});

test('an applyN that gives fn two arguments is still told exactly 1 argument, with the singular word', () => {
  const english = runIn('functions-apply-n', TWO_ARGUMENTS, 'en');
  assert.match(english.expected, /exactly 1 argument$/);
  const ukrainian = runIn('functions-apply-n', TWO_ARGUMENTS, 'uk');
  assert.match(ukrainian.expected, /рівно 1 аргумент$/);
});

test('a safeParse that returns a copy of the fallback is told it must be the same object, not shown two equal lines', () => {
  const code = `export function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return typeof fallback === 'object' && fallback !== null ? JSON.parse(JSON.stringify(fallback)) : fallback;
  }
}`;
  const result = run('errors-safe-parse', code);
  assert.equal(result.status, 'fail');
  assert.notEqual(result.got, result.expected);
  assert.match(result.expected, /=== fallback/);
});

test('a timeouts solution that throws is told no error was expected, not that ok was expected', () => {
  const english = runIn('timeouts-call-later', "export function callLater() { throw new TypeError('x'); }", 'en');
  assert.equal(english.status, 'fail');
  assert.doesNotMatch(english.expected, / ok$/);
  assert.match(english.expected, /does not throw/);
  assert.match(english.got, /threw TypeError/);
  const ukrainian = runIn('timeouts-call-later', "export function callLater() { throw new TypeError('x'); }", 'uk');
  assert.match(ukrainian.expected, /не кидає помилку/);
});

test('the briefs of the three timeouts quests say to call the global setTimeout, in both languages', async () => {
  const { questText } = await import('../../quests/text/index.js');
  for (const id of ['timeouts-call-later', 'timeouts-cancellable', 'timeouts-debounce']) {
    assert.match(questText(id, 'en').brief, /global `setTimeout`/, id);
    assert.match(questText(id, 'uk').brief, /глобальний `setTimeout`/, id);
  }
});

test('the briefs of retry and safeParse explain that a number after # marks the error object', async () => {
  const { questText } = await import('../../quests/text/index.js');
  for (const id of ['errors-retry', 'errors-safe-parse']) {
    assert.match(questText(id, 'en').brief, /number after `#`/, id);
    assert.match(questText(id, 'en').brief, /very same object/, id);
    assert.match(questText(id, 'uk').brief, /число після `#`/, id);
    assert.match(questText(id, 'uk').brief, /той самий обʼєкт/, id);
  }
});
