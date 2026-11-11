import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld, look, go, talk } from '../../game/world.js';
import { setLanguage } from '../../game/i18n.js';
import { enterDetour, leaveDetour } from '../../game/detours.js';
import { inventNpc, listNpcs, npcsHere } from '../../game/improv-npcs.js';
import { freshDb } from './helpers.js';
import { SETTING, goodWorld } from './world-fixtures.js';

const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'fighter', scores: [8, 15, 14, 8, 8, 15] };
const SMITH = {
  name: 'Old Brann',
  description: 'A one-eyed smith with soot in his beard.',
  voice: 'Gruff, short sentences, never looks up.',
};
const REAL_N1 = goodWorld().npcs.N1.name;

function ready() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  return { db, saveId };
}

test('a person invented in a detour stands there, and look and detour people show them only there', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  const made = inventNpc(db, saveId, SMITH);
  assert.deepEqual(
    { name: made.npc.name, place: made.npc.place, description: made.npc.description, voice: made.npc.voice },
    { name: 'Old Brann', place: 'The Forest', description: SMITH.description, voice: SMITH.voice },
  );
  assert.deepEqual(look(db, saveId).strangers, [{ name: 'Old Brann' }]);
  assert.deepEqual(
    npcsHere(db, saveId).map((n) => n.name),
    ['Old Brann'],
  );
  leaveDetour(db, saveId);
  assert.deepEqual(look(db, saveId).strangers, []);
});

test('a person invented on the map stands at that map place, and not at the others', () => {
  const { db, saveId } = ready();
  inventNpc(db, saveId, { name: 'Quick Mara', description: 'A pickpocket.', voice: 'Fast and sly.' });
  assert.deepEqual(look(db, saveId).strangers, [{ name: 'Quick Mara' }]);
  assert.deepEqual(
    look(db, saveId)
      .npcs.map((n) => n.slot)
      .includes('N1'),
    true,
  );
  go(db, saveId, 'L2');
  assert.deepEqual(look(db, saveId).strangers, []);
  go(db, saveId, 'L1');
  assert.equal(look(db, saveId).strangers.length, 1);
});

test('talk by name works for an invented person here, in any letter case, and carries the voice', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  inventNpc(db, saveId, SMITH);
  const result = talk(db, saveId, 'old brann');
  assert.deepEqual(result.npc, {
    slot: null,
    name: 'Old Brann',
    description: SMITH.description,
    voice: SMITH.voice,
    improvised: true,
  });
  assert.equal(result.offer, null);
  assert.deepEqual(result.open, []);
});

test('talking to a person who stands somewhere else says where, and talking to nobody explains how to make them', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  inventNpc(db, saveId, SMITH);
  leaveDetour(db, saveId);
  assert.throws(() => talk(db, saveId, 'Old Brann'), /not here.*The Forest/s);
  assert.throws(() => talk(db, saveId, 'Nobody Atall'), /not here.*npc invent/s);
  assert.throws(() => talk(db, saveId, 'N9'), /not here|unknown/i);
});

test('a real person can be talked to by name on the map, and still not from inside a detour', () => {
  const { db, saveId } = ready();
  assert.equal(talk(db, saveId, REAL_N1.toLowerCase()).npc.slot, 'N1');
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  assert.throws(() => talk(db, saveId, REAL_N1), /detour leave/);
  assert.throws(() => talk(db, saveId, 'N1'), /detour leave/);
});

test('a name that is a real person, a map slot, or already taken is refused', () => {
  const { db, saveId } = ready();
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, name: REAL_N1 }), /already/i);
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, name: 'N3' }), /map slot/);
  inventNpc(db, saveId, SMITH);
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, name: 'OLD BRANN' }), /already/i);
});

test('descriptions and voices follow the safety rules, in both languages, and nothing is saved on a refusal', () => {
  const { db, saveId } = ready();
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, description: '' }), /Description/);
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, voice: 'x'.repeat(201) }), /at most 200/);
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, voice: undefined }), /Voice/);
  assert.throws(() => inventNpc(db, saveId, { ...SMITH, description: 'Great question, friend.' }), /banned phrase/);
  assert.equal(listNpcs(db, saveId).length, 0);
  setLanguage(db, saveId, 'uk');
  assert.throws(
    () => inventNpc(db, saveId, { ...SMITH, description: 'Чудове запитання, мандрівнику.' }),
    /banned phrase/,
  );
  assert.equal(
    inventNpc(db, saveId, { name: 'Старий Бранн', description: 'Одноокий коваль.', voice: 'Грубий і стислий.' }).npc
      .name,
    'Старий Бранн',
  );
});

test('the 51st person is refused, and the people of another save are invisible', () => {
  const { db, saveId } = ready();
  for (let n = 1; n <= 50; n++) inventNpc(db, saveId, { name: `Wanderer ${n}`, description: 'd', voice: 'v' });
  assert.throws(
    () => inventNpc(db, saveId, { name: 'Wanderer 51', description: 'd', voice: 'v' }),
    /at most 50 people/,
  );
  const other = createSave(db, {});
  assert.equal(listNpcs(db, other).length, 0);
  assert.equal(listNpcs(db, saveId).length, 50);
});

test('listNpcs says where each person stands, on the map or in a detour', () => {
  const { db, saveId } = ready();
  inventNpc(db, saveId, { name: 'Quick Mara', description: 'A pickpocket.', voice: 'Sly.' });
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  inventNpc(db, saveId, SMITH);
  const places = Object.fromEntries(listNpcs(db, saveId).map((n) => [n.name, n.place]));
  assert.equal(places['Old Brann'], 'The Forest');
  assert.equal(places['Quick Mara'], goodWorld().locations.L1.name);
});

test('inventing needs a hero and a finished world', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  assert.throws(() => inventNpc(db, saveId, SMITH), /no hero/i);
  createHeroFromChoices(db, saveId, HERO);
  assert.throws(() => inventNpc(db, saveId, SMITH), /not ready/i);
});
