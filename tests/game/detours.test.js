import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSave, createHeroFromChoices, getHero } from '../../game/hero.js';
import { setSetting, fillWorld, look, go, talk } from '../../game/world.js';
import { beginFight, heroAttack } from '../../game/combat-engine.js';
import { restHero, addGold } from '../../game/vitals.js';
import { applyTamperReset } from '../../game/reset.js';
import { setLanguage } from '../../game/i18n.js';
import { heroLineInfo } from '../../game/hero-line.js';
import { resumeState, stateLine } from '../../game/resume.js';
import { enterDetour, leaveDetour, currentDetour, listDetours } from '../../game/detours.js';
import { freshDb } from './helpers.js';
import { SETTING, goodWorld } from './world-fixtures.js';

const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'fighter', scores: [8, 15, 14, 8, 8, 15] };
const script = (...pairs) => {
  let i = 0;
  return () => {
    const [value, sides] = pairs[i++];
    return (value - 0.5) / sides;
  };
};

function ready() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  return { db, saveId };
}
const L1 = goodWorld().locations.L1.name;
const L2 = goodWorld().locations.L2.name;

test('entering a new place saves it off the current map place and puts the hero in it', () => {
  const { db, saveId } = ready();
  const result = enterDetour(db, saveId, { name: 'The Whispering Forest', description: 'Tall pines and a cold wind.' });
  assert.equal(result.created, true);
  assert.deepEqual(
    {
      name: result.detour.name,
      baseSlot: result.detour.baseSlot,
      baseName: result.detour.baseName,
      parent: result.detour.parent,
    },
    { name: 'The Whispering Forest', baseSlot: 'L1', baseName: L1, parent: null },
  );
  assert.equal(getHero(db, saveId).detourId, result.detour.id);
  assert.equal(getHero(db, saveId).locationSlot, 'L1', 'the real map place does not change');
  assert.equal(currentDetour(db, saveId).name, 'The Whispering Forest');
});

test('look inside a detour shows the detour, the same exits, and no map people', () => {
  const { db, saveId } = ready();
  const outside = look(db, saveId);
  assert.equal(outside.detour, null);
  assert.ok(outside.npcs.length > 0);
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  const inside = look(db, saveId);
  assert.deepEqual(inside.detour, { name: 'The Forest', description: 'Pines.', parent: null });
  assert.deepEqual(inside.npcs, []);
  assert.deepEqual(inside.exits, outside.exits);
  assert.equal(inside.location.slot, 'L1');
});

test('entering the same place again by name goes back in, and does not make a second one', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  leaveDetour(db, saveId);
  const again = enterDetour(db, saveId, { name: 'the forest' });
  assert.equal(again.created, false);
  assert.equal(again.detour.name, 'The Forest');
  assert.equal(listDetours(db, saveId).length, 1);
});

test('a place that hangs off another map place cannot be entered from here, and the error says where it is', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  leaveDetour(db, saveId);
  go(db, saveId, 'L2');
  assert.throws(() => enterDetour(db, saveId, { name: 'The Forest' }), new RegExp(L1));
  assert.equal(getHero(db, saveId).detourId, null);
});

test('a new place needs a description, and a place inside a place is its child', () => {
  const { db, saveId } = ready();
  assert.throws(() => enterDetour(db, saveId, { name: 'The Forest' }), /needs a description/);
  const forest = enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  const cave = enterDetour(db, saveId, { name: 'The Cave', description: 'Dark and damp.' });
  assert.equal(cave.detour.parent, 'The Forest');
  assert.equal(cave.detour.baseSlot, 'L1');
  assert.equal(look(db, saveId).detour.parent, 'The Forest');
  assert.notEqual(cave.detour.id, forest.detour.id);
});

test('leaving goes out one level at a time, and says so when the hero is already on the map', () => {
  const { db, saveId } = ready();
  assert.throws(() => leaveDetour(db, saveId), /not in a detour/i);
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  assert.equal(leaveDetour(db, saveId).detour.name, 'The Forest');
  assert.equal(leaveDetour(db, saveId).detour, null);
  assert.equal(getHero(db, saveId).detourId, null);
  assert.throws(() => leaveDetour(db, saveId), /not in a detour/i);
});

test('go from any depth of a detour leaves all of them and moves, so "I walk to the market" always works', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  enterDetour(db, saveId, { name: 'The Cave', description: 'Dark.' });
  const moved = go(db, saveId, 'L2');
  assert.equal(moved.location.slot, 'L2');
  assert.equal(getHero(db, saveId).detourId, null);
  assert.equal(look(db, saveId).detour, null);
});

test('a go to a place that is not an exit fails and leaves the hero where they were, in the detour', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  assert.throws(() => go(db, saveId, 'L6'), /not an exit/);
  assert.equal(currentDetour(db, saveId).name, 'The Forest');
});

test('the real seven cannot be talked to, warned, or fought from inside a detour, and the error says what to do', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  assert.throws(() => talk(db, saveId, 'N1'), /detour leave/);
  assert.throws(
    () => beginFight(db, saveId, { npcSlot: 'N1', tier: 'weak', aggressor: 'hero', rng: script([15, 20], [10, 20]) }),
    /detour leave/,
  );
  leaveDetour(db, saveId);
  assert.equal(talk(db, saveId, 'N1').npc.slot, 'N1');
});

test('resting needs the map: it is refused in a detour at the start place, and works again after leaving', () => {
  const { db, saveId } = ready();
  db.prepare('UPDATE heroes SET hp = 3, hp_updated_at = ? WHERE save_id = ?').run(new Date().toISOString(), saveId);
  addGold(db, saveId, 10);
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  assert.throws(() => restHero(db, saveId), /detour leave/);
  leaveDetour(db, saveId);
  assert.equal(restHero(db, saveId).hp, 12);
});

test('a tamper reset and a lost fight both bring the hero back to the map, and the invented place stays', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  applyTamperReset(db, saveId, { expected: 'a', found: 'b' });
  assert.equal(getHero(db, saveId).detourId, null);
  assert.equal(listDetours(db, saveId).length, 1);

  go(db, saveId, 'L2');
  beginFight(db, saveId, {
    npcSlot: 'N2',
    tier: 'tough',
    aggressor: 'hero',
    rng: script([3, 20], [15, 20], [15, 20], [8, 8]),
  });
  const alley = db
    .prepare(
      "INSERT INTO detours (save_id, base_slot, name, description, created_at) VALUES (?, 'L2', 'The Back Alley', 'Narrow.', 'now')",
    )
    .run(saveId);
  db.prepare('UPDATE heroes SET detour_id = ? WHERE save_id = ?').run(Number(alley.lastInsertRowid), saveId);
  assert.equal(getHero(db, saveId).detourId !== null, true);
  const lost = heroAttack(db, saveId, { rng: script([2, 20], [15, 20], [8, 8]) });
  assert.equal(lost.status, 'lost');
  assert.equal(getHero(db, saveId).detourId, null);
  assert.equal(getHero(db, saveId).locationSlot, 'L1');
});

test('hostile names and descriptions are refused with the safety rules, and nothing is saved', () => {
  const { db, saveId } = ready();
  for (const name of ['L2', 'n7', `Fo${String.fromCharCode(0x200b)}rest`, 'x'.repeat(61), '', 'Dark  Forest']) {
    assert.throws(() => enterDetour(db, saveId, { name, description: 'ok' }), undefined, JSON.stringify(name));
  }
  assert.throws(() => enterDetour(db, saveId, { name: 'Fine', description: 'x'.repeat(401) }), /at most 400/);
  assert.throws(() => enterDetour(db, saveId, { name: 'As an AI language model', description: 'ok' }), /banned phrase/);
  assert.equal(listDetours(db, saveId).length, 0);
  assert.equal(getHero(db, saveId).detourId, null);
});

test('banned phrases follow the language of the save', () => {
  const { db, saveId } = ready();
  setLanguage(db, saveId, 'uk');
  assert.throws(
    () => enterDetour(db, saveId, { name: 'Ліс', description: 'Чудове запитання, мандрівнику.' }),
    /banned phrase/,
  );
  assert.equal(enterDetour(db, saveId, { name: 'Шепітливий ліс', description: 'Високі сосни.' }).created, true);
});

test('the 51st place is refused, and a duplicate name in another case is refused at another map place too', () => {
  const { db, saveId } = ready();
  for (let n = 1; n <= 50; n++) {
    enterDetour(db, saveId, { name: `Place ${n}`, description: 'd' });
    leaveDetour(db, saveId);
  }
  assert.throws(() => enterDetour(db, saveId, { name: 'Place 51', description: 'd' }), /at most 50 places/);
  go(db, saveId, 'L2');
  assert.throws(() => enterDetour(db, saveId, { name: 'PLACE 7', description: 'd' }), /Place 7|near/);
});

test('entering needs a hero and a finished world', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  assert.throws(() => enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' }), /no hero/i);
  createHeroFromChoices(db, saveId, HERO);
  assert.throws(() => enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' }), /not ready/i);
});

test('the hero line, the resume state, and the state line show a detour near the map place', () => {
  const { db, saveId } = ready();
  assert.equal(heroLineInfo(db, saveId).location, L1);
  assert.match(stateLine(db, saveId), new RegExp(`^\\[game\\] at ${L1} \\(L1\\) \\|`));
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  assert.equal(heroLineInfo(db, saveId).location, 'The Forest');
  assert.match(stateLine(db, saveId), new RegExp(`^\\[game\\] at The Forest \\(detour near L1\\) \\|`));
  assert.deepEqual(resumeState(db, saveId).here.detour, { name: 'The Forest', description: 'Pines.', parent: null });
  assert.equal(resumeState(db, saveId).hero.detourId !== undefined, true);
});

test('detours of one save are invisible to another save', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  const other = createSave(db, {});
  assert.equal(listDetours(db, other).length, 0);
  assert.equal(currentDetour(db, other), null);
});

test('with the unused second place name L2 the error for a wrong map place names that place', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Forest', description: 'Pines.' });
  leaveDetour(db, saveId);
  go(db, saveId, 'L2');
  assert.throws(
    () => enterDetour(db, saveId, { name: 'The Forest' }),
    (e) => e.message.includes(L1) && !e.message.includes(L2),
  );
});
