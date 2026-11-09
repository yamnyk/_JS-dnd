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
