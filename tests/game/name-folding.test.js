import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld, talk } from '../../game/world.js';
import { setLanguage } from '../../game/i18n.js';
import { enterDetour } from '../../game/detours.js';
import { inventNpc } from '../../game/improv-npcs.js';
import { addStoryTask } from '../../game/side-tasks.js';
import { beginFight } from '../../game/combat-engine.js';
import { checkName } from '../../game/improv.js';
import { freshDb, count } from './helpers.js';
import { SETTING, goodWorld } from './world-fixtures.js';

const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'fighter', scores: [8, 15, 14, 8, 8, 15] };

// A Ukrainian game: the real first person is called Марта, and every name is Cyrillic.
function ukGame() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  const world = goodWorld();
  world.npcs.N1.name = 'Марта';
  fillWorld(db, saveId, world);
  setLanguage(db, saveId, 'uk');
  return { db, saveId };
}

const person = (name) => ({ name, description: 'Хтось тут.', voice: 'Говорить тихо.' });

test('a person cannot share a name with a real person or another invented person, whatever the case, in Cyrillic', () => {
  const { db, saveId } = ukGame();
  for (const name of ['Марта', 'марта', 'МАРТА']) {
    assert.throws(() => inventNpc(db, saveId, person(name)), /already exists/, name);
  }
  inventNpc(db, saveId, person('Іван'));
  for (const name of ['іван', 'ІВАН', 'Іван']) {
    assert.throws(() => inventNpc(db, saveId, person(name)), /already exists/, name);
  }
  assert.equal(count(db, 'improv_npcs'), 1);
});

test('the same name in different Unicode forms is one name', () => {
  const { db, saveId } = ukGame();
  const composed = 'Café';
  const decomposed = 'Café';
  inventNpc(db, saveId, person(composed));
  assert.throws(() => inventNpc(db, saveId, person(decomposed)), /already exists/);
  assert.equal(checkName(decomposed), composed);
  assert.equal(count(db, 'improv_npcs'), 1);
});

test('talk finds a real person by their name in any case, and an invented person the same way', () => {
  const { db, saveId } = ukGame();
  inventNpc(db, saveId, person('Іван'));
  assert.equal(talk(db, saveId, 'марта').npc.slot, 'N1');
  assert.equal(talk(db, saveId, 'МАРТА').npc.slot, 'N1');
  const invented = talk(db, saveId, 'іван').npc;
  assert.deepEqual([invented.slot, invented.name, invented.improvised], [null, 'Іван', true]);
});

test('an improvised enemy cannot carry the name of a real person in any case', () => {
  const { db, saveId } = ukGame();
  for (const name of ['Марта', 'марта', 'МАРТА']) {
    assert.throws(
      () => beginFight(db, saveId, { improv: { name }, tier: 'weak', aggressor: 'hero', rng: () => 0.5 }),
      /real person/,
      name,
    );
  }
  assert.equal(count(db, 'fights'), 0);
});

test('a place is found by name in any case, so it is never made twice', () => {
  const { db, saveId } = ukGame();
  const first = enterDetour(db, saveId, { name: 'Ліс', description: 'Сосни.' });
  const again = enterDetour(db, saveId, { name: 'ліс' });
  assert.deepEqual([first.created, again.created, again.detour.id], [true, false, first.detour.id]);
  assert.equal(count(db, 'detours'), 1);
});

test('a task giver is found by name in any case', () => {
  const { db, saveId } = ukGame();
  inventNpc(db, saveId, person('Іван'));
  assert.equal(
    addStoryTask(db, saveId, { title: 'Знайти ополоник', brief: 'Він десь тут.', giver: 'іван' }).task.giver,
    'Іван',
  );
});

test('a person with a name that only looks like a slot (N8) can be invented and talked to', () => {
  const { db, saveId } = ukGame();
  inventNpc(db, saveId, person('N8'));
  const npc = talk(db, saveId, 'n8').npc;
  assert.deepEqual([npc.slot, npc.name, npc.improvised], [null, 'N8', true]);
  assert.throws(() => talk(db, saveId, 'N9'), /npc invent/);
  assert.throws(() => checkName('N7'), /map slot/);
});

test('a new place without a description says it needs one, and a place in a sibling place gives a true reason', () => {
  const { db, saveId } = ukGame();
  assert.throws(() => enterDetour(db, saveId, { name: 'Печера' }), /new place.*description/i);
  enterDetour(db, saveId, { name: 'Ліс', description: 'Сосни.' });
  db.prepare('UPDATE heroes SET detour_id = NULL').run();
  enterDetour(db, saveId, { name: 'Печера', description: 'Темно.' });
  try {
    enterDetour(db, saveId, { name: 'Ліс' });
    assert.fail('entering a sibling place from inside a place should be refused');
  } catch (error) {
    assert.doesNotMatch(error.message, /lies inside another place/);
    assert.match(error.message, /detour leave/);
  }
});
