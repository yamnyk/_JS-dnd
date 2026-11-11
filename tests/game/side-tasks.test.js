import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld, talk } from '../../game/world.js';
import { setLanguage } from '../../game/i18n.js';
import { enterDetour, currentDetour } from '../../game/detours.js';
import { inventNpc } from '../../game/improv-npcs.js';
import { applyTamperReset } from '../../game/reset.js';
import { resumeState, stateLine } from '../../game/resume.js';
import { getProgress } from '../../game/quests.js';
import { addStoryTask, listTasks, finishTask, dropTask, openTasksSummary } from '../../game/side-tasks.js';
import { freshDb, count } from './helpers.js';
import { SETTING, goodWorld } from './world-fixtures.js';

const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'fighter', scores: [8, 15, 14, 8, 8, 15] };

function ready() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  return { db, saveId };
}

const errand = (title = 'Find the lost ladle', brief = 'The cook lost her ladle in the market.') => ({ title, brief });

test('a story task is saved open with its title and brief, and the detour the hero stands in (none on the map)', () => {
  const { db, saveId } = ready();
  const { task } = addStoryTask(db, saveId, errand());
  assert.deepEqual(
    { ...task, createdAt: undefined },
    {
      id: task.id,
      kind: 'story',
      title: 'Find the lost ladle',
      brief: 'The cook lost her ladle in the market.',
      status: 'open',
      place: null,
      giver: null,
      createdAt: undefined,
      closedAt: null,
    },
  );
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  assert.equal(addStoryTask(db, saveId, errand('Light the lamp', 'Find the oil.')).task.place, 'The Cave');
});

test('a task can name the invented person who gave it, and only an invented person who exists', () => {
  const { db, saveId } = ready();
  inventNpc(db, saveId, { name: 'Cook Marta', description: 'Round and loud.', voice: 'Shouts kindly.' });
  const { task } = addStoryTask(db, saveId, { ...errand(), giver: 'cook marta' });
  assert.equal(task.giver, 'Cook Marta');
  assert.throws(() => addStoryTask(db, saveId, { ...errand(), giver: 'Nobody' }), /npc invent/);
  const realName = db.prepare("SELECT name FROM world_npcs WHERE save_id = ? AND slot = 'N1'").get(saveId).name;
  assert.throws(() => addStoryTask(db, saveId, { ...errand(), giver: realName }), /npc invent/);
  assert.equal(count(db, 'side_tasks'), 1);
});

test('title and brief are required, short, and follow the safety rules in both languages', () => {
  const { db, saveId } = ready();
  const bad = [
    { title: '', brief: 'b' },
    { title: 'a', brief: '' },
    { title: undefined, brief: 'b' },
    { title: 'x'.repeat(61), brief: 'b' },
    { title: 'a', brief: 'x'.repeat(401) },
    { title: `A${String.fromCharCode(0x200b)}B`, brief: 'b' },
    { title: 'As an AI language model', brief: 'b' },
    { title: 'a', brief: 'As an AI language model' },
  ];
  for (const input of bad) assert.throws(() => addStoryTask(db, saveId, input), undefined, JSON.stringify(input));
  setLanguage(db, saveId, 'uk');
  assert.throws(
    () => addStoryTask(db, saveId, { title: 'a', brief: 'Завдання, як штучний інтелект' }),
    /banned phrase/,
  );
  assert.equal(count(db, 'side_tasks'), 0);
  assert.equal(
    addStoryTask(db, saveId, { title: 'Знайти ополоник', brief: 'Кухарка його загубила.' }).task.title,
    'Знайти ополоник',
  );
});

test('a save holds at most 50 open tasks, and closing one makes room', () => {
  const { db, saveId } = ready();
  for (let i = 1; i <= 50; i++) addStoryTask(db, saveId, errand(`Errand ${i}`, 'b'));
  assert.throws(() => addStoryTask(db, saveId, errand('One more', 'b')), /at most 50/);
  dropTask(db, saveId, 1);
  assert.equal(addStoryTask(db, saveId, errand('One more', 'b')).task.status, 'open');
  assert.equal(count(db, 'side_tasks'), 51);
});

test('finishing a story task marks it done with a closing time, once', () => {
  const { db, saveId } = ready();
  const { task } = addStoryTask(db, saveId, errand());
  const done = finishTask(db, saveId, task.id).task;
  assert.equal(done.status, 'done');
  assert.ok(done.closedAt);
  assert.throws(() => finishTask(db, saveId, task.id), /not open/);
  assert.throws(() => dropTask(db, saveId, task.id), /not open/);
});

test('dropping a task closes it as dropped, and an unknown or foreign id is refused', () => {
  const { db, saveId } = ready();
  const other = createSave(db, {});
  const mine = addStoryTask(db, saveId, errand()).task;
  const foreign = Number(
    db
      .prepare(
        "INSERT INTO side_tasks (save_id, kind, title, brief, status, created_at) VALUES (?, 'story', 't', 'b', 'open', 'now')",
      )
      .run(other).lastInsertRowid,
  );
  assert.equal(dropTask(db, saveId, mine.id).task.status, 'dropped');
  for (const id of [999, foreign, 0, -1, 1.5, '1', null, undefined]) {
    assert.throws(() => finishTask(db, saveId, id), /No side task/, String(id));
    assert.throws(() => dropTask(db, saveId, id), /No side task/, String(id));
  }
  assert.equal(db.prepare('SELECT status FROM side_tasks WHERE id = ?').get(foreign).status, 'open');
});

test('a JS side quest is never closed by done, only by its check, but it can be dropped', () => {
  const { db, saveId } = ready();
  const id = Number(
    db
      .prepare(
        "INSERT INTO side_tasks (save_id, kind, title, brief, status, created_at) VALUES (?, 'js', 't', 'b', 'open', 'now')",
      )
      .run(saveId).lastInsertRowid,
  );
  assert.throws(() => finishTask(db, saveId, id), /side check/);
  assert.equal(db.prepare('SELECT status FROM side_tasks WHERE id = ?').get(id).status, 'open');
  assert.equal(dropTask(db, saveId, id).task.status, 'dropped');
});

test('list shows the open tasks in order, and all shows the closed ones too', () => {
  const { db, saveId } = ready();
  const a = addStoryTask(db, saveId, errand('A', 'b')).task;
  addStoryTask(db, saveId, errand('B', 'b'));
  const c = addStoryTask(db, saveId, errand('C', 'b')).task;
  finishTask(db, saveId, a.id);
  dropTask(db, saveId, c.id);
  assert.deepEqual(
    listTasks(db, saveId).map((t) => t.title),
    ['B'],
  );
  assert.deepEqual(
    listTasks(db, saveId, { all: true }).map((t) => [t.title, t.status]),
    [
      ['A', 'done'],
      ['B', 'open'],
      ['C', 'dropped'],
    ],
  );
});

test('tasks belong to a save and need a hero and a ready world', () => {
  const { db, saveId } = ready();
  const other = createSave(db, {});
  addStoryTask(db, saveId, errand());
  assert.equal(listTasks(db, other).length, 0);
  assert.throws(() => addStoryTask(db, other, errand()), /no hero/i);
  createHeroFromChoices(db, other, HERO);
  assert.throws(() => addStoryTask(db, other, errand()), /world is not ready/i);
});

test('talking to an invented person shows the open tasks they gave, and nobody else sees them', () => {
  const { db, saveId } = ready();
  inventNpc(db, saveId, { name: 'Cook Marta', description: 'Round and loud.', voice: 'Shouts kindly.' });
  inventNpc(db, saveId, { name: 'Tailor Ivo', description: 'Thin.', voice: 'Murmurs.' });
  const given = addStoryTask(db, saveId, { ...errand(), giver: 'Cook Marta' }).task;
  addStoryTask(db, saveId, { ...errand('Hem the cloak', 'b'), giver: 'Tailor Ivo' });
  const closed = addStoryTask(db, saveId, { ...errand('Old news', 'b'), giver: 'Cook Marta' }).task;
  finishTask(db, saveId, closed.id);
  assert.deepEqual(
    talk(db, saveId, 'Cook Marta').tasks.map((t) => t.id),
    [given.id],
  );
  assert.deepEqual(
    talk(db, saveId, 'Tailor Ivo').tasks.map((t) => t.title),
    ['Hem the cloak'],
  );
});

test('detour show reads the open tasks of the place the hero is in', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  addStoryTask(db, saveId, errand('Light the lamp', 'b'));
  const here = currentDetour(db, saveId);
  assert.deepEqual(
    here.tasks.map((t) => t.title),
    ['Light the lamp'],
  );
});

test('resume carries the open tasks, capped, with the real count, and the state line only mentions them when there are some', () => {
  const { db, saveId } = ready();
  assert.equal(resumeState(db, saveId).tasks.open, 0);
  assert.ok(!stateLine(db, saveId).includes('errand'));
  for (let i = 1; i <= 8; i++) addStoryTask(db, saveId, errand(`Errand ${i}`, 'b'));
  const tasks = resumeState(db, saveId).tasks;
  assert.equal(tasks.open, 8);
  assert.equal(tasks.items.length, 5);
  assert.deepEqual(
    tasks.items.map((t) => t.title),
    ['Errand 4', 'Errand 5', 'Errand 6', 'Errand 7', 'Errand 8'],
  );
  assert.deepEqual(Object.keys(tasks.items[0]).sort(), ['brief', 'giver', 'id', 'kind', 'place', 'title']);
  assert.match(stateLine(db, saveId), /8 open errands/);
  assert.deepEqual(
    openTasksSummary(db, saveId, 2).items.map((t) => t.title),
    ['Errand 7', 'Errand 8'],
  );
});

test('tasks survive a tamper reset, and they never count toward the quest ladder', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  addStoryTask(db, saveId, errand());
  const before = getProgress(db, saveId);
  applyTamperReset(db, saveId, { expected: 'aaa', found: 'bbb' });
  assert.equal(listTasks(db, saveId).length, 1);
  assert.deepEqual(getProgress(db, saveId).solved, before.solved);
  assert.equal(before.solved.length, 0);
});
