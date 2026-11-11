import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { proposeSideQuest, checkSideQuest } from '../../game/side-quests.js';
import { addStoryTask, listTasks, dropTask } from '../../game/side-tasks.js';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld, talk } from '../../game/world.js';
import { setLanguage } from '../../game/i18n.js';
import { enterDetour, currentDetour } from '../../game/detours.js';
import { inventNpc } from '../../game/improv-npcs.js';
import { getProgress } from '../../game/quests.js';
import { readVitals } from '../../game/vitals.js';
import { resumeState, stateLine } from '../../game/resume.js';
import { freshDb, count } from './helpers.js';
import { SETTING, goodWorld } from './world-fixtures.js';

const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'fighter', scores: [8, 15, 14, 8, 8, 15] };
const SECRET = 'ZQ-SECRET-9137';
const TESTS = [
  { args: [1, 2], expected: 3 },
  { args: [2, 2], expected: 4 },
  { args: [10, -3], expected: 7 },
];
const problem = (overrides = {}) => ({
  title: 'Count the coins',
  brief: 'Write solve(a, b) that returns the sum.\nIt must work for negatives.',
  difficulty: 1,
  tests: TESTS,
  reference: 'export function solve(a, b) { return a + b; }',
  ...overrides,
});

function ready() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  const playerDir = mkdtempSync(join(tmpdir(), 'jsdnd-side-'));
  return { db, saveId, playerDir };
}

const SOLVED = 'export function solve(a, b) { return a + b; }';

test('proposing needs a hero and a ready world, a valid problem, and writes nothing otherwise', () => {
  const { db, saveId, playerDir } = ready();
  const other = createSave(db, {});
  assert.throws(() => proposeSideQuest(db, other, problem(), { playerDir }), /no hero/i);
  createHeroFromChoices(db, other, HERO);
  assert.throws(() => proposeSideQuest(db, other, problem(), { playerDir }), /world is not ready/i);
  const bad = [
    problem({ tests: TESTS.slice(0, 1) }),
    problem({ reference: 'export function solve() { return 0; }' }),
    problem({ difficulty: 9 }),
    problem({ title: '' }),
    problem({ title: 'x'.repeat(61) }),
    problem({ brief: 'x'.repeat(401) }),
    problem({ brief: 'As an AI language model' }),
    problem({ giver: 'Nobody' }),
    null,
    [],
    'text',
  ];
  for (const input of bad) {
    assert.throws(() => proposeSideQuest(db, saveId, input, { playerDir }), undefined, JSON.stringify(input));
  }
  assert.equal(count(db, 'side_tasks'), 0);
  assert.equal(existsSync(join(playerDir, 'side-1.js')), false);
});

test('a good proposal stores the hidden tests, writes a stub, and returns only what the player may see', () => {
  const { db, saveId, playerDir } = ready();
  const proposal = proposeSideQuest(db, saveId, problem(), { playerDir });
  assert.deepEqual(Object.keys(proposal).sort(), ['brief', 'file', 'taskId', 'title']);
  assert.equal(proposal.file, join(playerDir, `side-${proposal.taskId}.js`));
  assert.match(readFileSync(proposal.file, 'utf8'), /export function solve/);
  const row = db.prepare('SELECT * FROM side_tasks WHERE id = ?').get(proposal.taskId);
  assert.deepEqual([row.kind, row.status, row.difficulty, row.title], ['js', 'open', 1, 'Count the coins']);
  assert.deepEqual(JSON.parse(row.tests), TESTS);
});

test('a proposal stands where the hero stands and may name the invented person who gave it', () => {
  const { db, saveId, playerDir } = ready();
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  inventNpc(db, saveId, { name: 'Cook Marta', description: 'Round and loud.', voice: 'Shouts kindly.' });
  proposeSideQuest(db, saveId, problem({ giver: 'Cook Marta' }), { playerDir });
  const [task] = listTasks(db, saveId);
  assert.deepEqual([task.kind, task.place, task.giver], ['js', 'The Cave', 'Cook Marta']);
});

test('a correct solution closes the side quest as done and gives nothing by itself', () => {
  const { db, saveId, playerDir } = ready();
  const { taskId, file } = proposeSideQuest(db, saveId, problem(), { playerDir });
  const before = { progress: getProgress(db, saveId).solved, vitals: readVitals(db, saveId) };
  writeFileSync(file, SOLVED);
  const result = checkSideQuest(db, saveId, taskId, { playerDir });
  assert.equal(result.check.status, 'pass');
  assert.equal(result.taskStatus, 'done');
  assert.equal(result.task.status, 'done');
  assert.ok(result.task.closedAt);
  assert.deepEqual(getProgress(db, saveId).solved, before.progress);
  assert.equal(readVitals(db, saveId).gold, before.vitals.gold);
  assert.equal(count(db, 'rewards'), 0);
  assert.equal(count(db, 'inventory_items'), 0);
  assert.equal(listTasks(db, saveId).length, 0);
});

test('a wrong, looping, throwing, or missing solution leaves the side quest open, and a later fix passes', () => {
  const codes = [
    'export function solve(a, b) { return a - b; }',
    'export function solve() { while (true) {} }',
    "export function solve() { throw new Error('nope'); }",
    null,
  ];
  for (const code of codes) {
    const { db, saveId, playerDir } = ready();
    const { taskId, file } = proposeSideQuest(db, saveId, problem(), { playerDir });
    if (code === null) rmSync(file);
    else writeFileSync(file, code);
    const result = checkSideQuest(db, saveId, taskId, { playerDir, timeoutMs: 500 });
    assert.notEqual(result.check.status, 'pass', code ?? 'missing file');
    assert.equal(result.taskStatus, 'open', code ?? 'missing file');
    assert.equal(listTasks(db, saveId).length, 1);
    writeFileSync(file, SOLVED);
    assert.equal(checkSideQuest(db, saveId, taskId, { playerDir }).taskStatus, 'done');
  }
});

test('a side quest is checked once, only if it is a JS side quest of this save, and not after it was dropped', () => {
  const { db, saveId, playerDir } = ready();
  const other = createSave(db, {});
  const { taskId, file } = proposeSideQuest(db, saveId, problem(), { playerDir });
  const story = addStoryTask(db, saveId, { title: 'Carry the letter', brief: 'To the mill.' }).task;
  assert.throws(() => checkSideQuest(db, saveId, story.id, { playerDir }), /side done/);
  assert.throws(() => checkSideQuest(db, saveId, 999, { playerDir }), /No side task/);
  assert.throws(() => checkSideQuest(db, other, taskId, { playerDir }), /No side task/);
  for (const bad of [0, -1, 1.5, '1', null, undefined]) {
    assert.throws(() => checkSideQuest(db, saveId, bad, { playerDir }), /No side task/, String(bad));
  }
  writeFileSync(file, SOLVED);
  checkSideQuest(db, saveId, taskId, { playerDir });
  assert.throws(() => checkSideQuest(db, saveId, taskId, { playerDir }), /not open/);

  const second = proposeSideQuest(db, saveId, problem({ title: 'Again' }), { playerDir });
  dropTask(db, saveId, second.taskId);
  writeFileSync(second.file, SOLVED);
  assert.throws(() => checkSideQuest(db, saveId, second.taskId, { playerDir }), /not open/);
});

test('a side quest works from inside a detour, with no fight open, and counts against the 50 open tasks', () => {
  const { db, saveId, playerDir } = ready();
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  for (let i = 1; i <= 49; i++) addStoryTask(db, saveId, { title: `Errand ${i}`, brief: 'b' });
  proposeSideQuest(db, saveId, problem(), { playerDir });
  assert.throws(() => proposeSideQuest(db, saveId, problem(), { playerDir }), /at most 50/);
  assert.throws(() => addStoryTask(db, saveId, { title: 'One more', brief: 'b' }), /at most 50/);
  assert.equal(count(db, 'side_tasks'), 50);
});

test('a proposal whose stub cannot be written leaves no task row behind', () => {
  const { db, saveId } = ready();
  const base = mkdtempSync(join(tmpdir(), 'jsdnd-side-ro-'));
  const readOnly = join(base, 'locked');
  mkdirSync(readOnly);
  chmodSync(readOnly, 0o500);
  try {
    assert.throws(() => proposeSideQuest(db, saveId, problem(), { playerDir: readOnly }));
  } finally {
    chmodSync(readOnly, 0o700);
  }
  assert.equal(count(db, 'side_tasks'), 0);
  const asFile = join(base, 'a-file');
  writeFileSync(asFile, 'x');
  assert.throws(() => proposeSideQuest(db, saveId, problem(), { playerDir: asFile }));
  assert.equal(count(db, 'side_tasks'), 0);
});

test('a file the player already has for the side quest is kept as .old.js, not overwritten', () => {
  const { db, saveId, playerDir } = ready();
  writeFileSync(join(playerDir, 'side-1.js'), '// my own work\n');
  const task = proposeSideQuest(db, saveId, problem(), { playerDir });
  assert.equal(task.taskId, 1);
  assert.equal(readFileSync(join(playerDir, 'side-1.old.js'), 'utf8'), '// my own work\n');
  assert.match(readFileSync(task.file, 'utf8'), /export function solve/);
  assert.equal(existsSync(`${task.file}.tmp`), false);
});

test('the side quest stub is written in the language of the save, with the code part unchanged', () => {
  const english = ready();
  const en = readFileSync(
    proposeSideQuest(english.db, english.saveId, problem(), { playerDir: english.playerDir }).file,
    'utf8',
  );
  assert.match(en, /^\/\/ Side quest: Count the coins\n/);
  assert.match(en, /\/\/ Export a function named solve\./);
  assert.match(en, /\/\/ your code here/);

  const ukrainian = ready();
  setLanguage(ukrainian.db, ukrainian.saveId, 'uk');
  const uk = readFileSync(
    proposeSideQuest(ukrainian.db, ukrainian.saveId, problem(), { playerDir: ukrainian.playerDir }).file,
    'utf8',
  );
  assert.match(uk, /^\/\/ Побічний квест: Count the coins\n/);
  assert.match(uk, /\/\/ Експортуй функцію з назвою `solve`\./);
  assert.doesNotMatch(uk, /Side quest|Export a function|your code here/);
  assert.match(uk, /export function solve\(\) \{/);
});

test('the hidden tests and the reference never show in the proposal, the lists, talk, detour show, resume, or the state line', () => {
  const { db, saveId, playerDir } = ready();
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  inventNpc(db, saveId, { name: 'Cook Marta', description: 'Round and loud.', voice: 'Shouts kindly.' });
  const secretTests = [
    { args: ['a'], expected: SECRET },
    { args: ['b'], expected: `${SECRET}b` },
    { args: ['c'], expected: `${SECRET}c` },
  ];
  const proposal = proposeSideQuest(
    db,
    saveId,
    problem({
      tests: secretTests,
      reference: `export function solve(x) { return x === 'a' ? '${SECRET}' : '${SECRET}' + x; }`,
      giver: 'Cook Marta',
    }),
    { playerDir },
  );
  const seen = JSON.stringify([
    proposal,
    listTasks(db, saveId, { all: true }),
    talk(db, saveId, 'Cook Marta'),
    currentDetour(db, saveId),
    resumeState(db, saveId),
    stateLine(db, saveId),
    readFileSync(proposal.file, 'utf8'),
  ]);
  assert.ok(!seen.includes(SECRET));
});

test('a JS side quest file path shows in the task lists so it survives a compaction, and a story task has none', () => {
  const { db, saveId, playerDir } = ready();
  const saved = process.env.JSDND_PLAYER_DIR;
  process.env.JSDND_PLAYER_DIR = playerDir;
  try {
    const proposal = proposeSideQuest(db, saveId, problem());
    addStoryTask(db, saveId, { title: 'Carry the letter', brief: 'To the mill.' });
    const [js, story] = resumeState(db, saveId).tasks.items;
    assert.equal(js.file, proposal.file);
    assert.equal('file' in story, false);
    assert.equal(listTasks(db, saveId)[0].file, proposal.file);
  } finally {
    if (saved === undefined) delete process.env.JSDND_PLAYER_DIR;
    else process.env.JSDND_PLAYER_DIR = saved;
  }
});

test('the hook, resume, and the status line never import the module that runs player code', () => {
  for (const name of ['resume.js', 'play-hook.js', 'statusline.js', 'hero-line.js', 'side-tasks.js', 'detours.js']) {
    const source = readFileSync(join(process.cwd(), 'game', name), 'utf8');
    assert.equal(/side-quests|move-runner|child-check/.test(source), false, name);
  }
});
