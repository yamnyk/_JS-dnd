import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beginFight, heroAttack, fleeFight, getFightState, loseHeroTurn, warnNpc } from '../../game/combat-engine.js';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld, look } from '../../game/world.js';
import { getHonor } from '../../game/honor.js';
import { applyTamperReset } from '../../game/reset.js';
import { enterDetour } from '../../game/detours.js';
import { inventNpc } from '../../game/improv-npcs.js';
import { setLanguage } from '../../game/i18n.js';
import { readVitals } from '../../game/vitals.js';
import { countItems } from '../../game/inventory.js';
import { isKnockedOut } from '../../game/knockouts.js';
import { freshDb, count } from './helpers.js';
import { SETTING, goodWorld } from './world-fixtures.js';

// Scripts an rng: each [value, sides] pair becomes the random number that lands on that face.
const script = (...pairs) => {
  let i = 0;
  return () => {
    const [value, sides] = pairs[i++];
    return (value - 0.5) / sides;
  };
};

// Hero: halfling fighter, 12 HP, AC 13, attack +5, damage 1d8+3 (same as the combat engine tests).
const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'fighter', scores: [8, 15, 14, 8, 8, 15] };
const heroFirst = () => script([15, 20], [10, 20]);

function ready() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  return { db, saveId };
}

const improv = (name = 'Road Wolf') => ({ improv: { name } });

test('an improvised fight needs no slot, no warnings, and starts with the enemy the tier says', () => {
  const { db, saveId } = ready();
  const fight = beginFight(db, saveId, { ...improv(), tier: 'normal', aggressor: 'npc', rng: heroFirst() });
  assert.deepEqual(fight.enemy, { name: 'Road Wolf', tier: 'normal', hp: 14, hpMax: 14, ac: 12 });
  assert.equal(fight.status, 'open');
  const row = db.prepare('SELECT npc_slot, aggressor, quest_id FROM fights WHERE id = ?').get(fight.fightId);
  assert.deepEqual({ ...row }, { npc_slot: null, aggressor: 'npc', quest_id: null });
  assert.equal(getFightState(db, saveId).enemy.name, 'Road Wolf');
});

test('winning an improvised fight: honor follows the aggressor, and there is no knockout, no item, no ending', () => {
  const hero = ready();
  beginFight(hero.db, hero.saveId, { ...improv(), tier: 'weak', aggressor: 'hero', rng: heroFirst() });
  const won = heroAttack(hero.db, hero.saveId, { rng: script([15, 20], [5, 8]) });
  assert.deepEqual([won.status, won.enemy.hp, won.honor], ['won', 0, -15]);
  assert.equal(won.endingUnlocked, undefined);
  assert.equal(countItems(hero.db, hero.saveId), 0);
  assert.equal(count(hero.db, 'npc_knockouts'), 0);
  assert.equal(getFightState(hero.db, hero.saveId), null);

  const self = ready();
  beginFight(self.db, self.saveId, { ...improv(), tier: 'weak', aggressor: 'npc', rng: heroFirst() });
  heroAttack(self.db, self.saveId, { rng: script([15, 20], [5, 8]) });
  assert.equal(getHonor(self.db, self.saveId), 0);
});

test('an improvised win leaves real warnings and knockouts of the real people alone', () => {
  const { db, saveId } = ready();
  warnNpc(db, saveId, 'N1', 'rude');
  beginFight(db, saveId, { ...improv(), tier: 'weak', aggressor: 'hero', rng: heroFirst() });
  heroAttack(db, saveId, { rng: script([15, 20], [5, 8]) });
  assert.equal(count(db, 'npc_warnings'), 1);
  assert.equal(isKnockedOut(db, saveId, 'N1'), false);
});

test('losing an improvised fight wakes the hero at the start with full health and no honor change', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Wolf Den', description: 'A cave that smells of wet fur.' });
  beginFight(db, saveId, {
    ...improv(),
    tier: 'tough',
    aggressor: 'npc',
    rng: script([3, 20], [15, 20], [15, 20], [8, 8]),
  });
  const lost = heroAttack(db, saveId, { rng: script([2, 20], [15, 20], [8, 8]) });
  assert.deepEqual([lost.status, lost.hero.hp], ['lost', 0]);
  const here = look(db, saveId);
  assert.equal(here.location.slot, 'L1');
  assert.equal(here.detour, null);
  assert.equal(readVitals(db, saveId).hp, readVitals(db, saveId).maxHp);
  assert.equal(getHonor(db, saveId), 0);
  assert.equal(count(db, 'npc_knockouts'), 0);
});

test('fleeing an improvised fight keeps the health the hero has and costs no honor', () => {
  const { db, saveId } = ready();
  beginFight(db, saveId, {
    ...improv(),
    tier: 'normal',
    aggressor: 'hero',
    rng: script([5, 20], [15, 20], [15, 20], [3, 6]),
  });
  const state = fleeFight(db, saveId);
  assert.equal(state.status, 'fled');
  assert.equal(readVitals(db, saveId).hp, state.hero.hp);
  assert.ok(state.hero.hp < state.hero.hpMax);
  assert.equal(getHonor(db, saveId), 0);
});

test('a failed move loses the turn in an improvised fight, and a sure double hit works', () => {
  const { db, saveId } = ready();
  beginFight(db, saveId, { ...improv(), tier: 'normal', aggressor: 'hero', rng: heroFirst() });
  const lostTurn = loseHeroTurn(db, saveId, { rng: script([1, 20]) });
  assert.equal(lostTurn.round, 2);
  const hit = heroAttack(db, saveId, { sureHit: true, doubleDamage: true, rng: script([1, 20], [3, 8], [1, 20]) });
  assert.equal(hit.enemy.hp, 14 - (3 + 3) * 2);
});

test('an improvised fight works from inside a detour and on the map, and one fight at a time', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Wolf Den', description: 'A cave that smells of wet fur.' });
  beginFight(db, saveId, { ...improv(), tier: 'weak', aggressor: 'hero', rng: heroFirst() });
  assert.throws(
    () => beginFight(db, saveId, { ...improv('Other'), tier: 'weak', aggressor: 'hero', rng: heroFirst() }),
    /already in progress/i,
  );
  assert.equal(look(db, saveId).detour.name, 'The Wolf Den');
});

test('an invented person can be the enemy by name, and they stay in the list afterwards', () => {
  const { db, saveId } = ready();
  inventNpc(db, saveId, { name: 'Pickpocket Pia', description: 'Quick hands.', voice: 'Whispers fast.' });
  beginFight(db, saveId, { ...improv('Pickpocket Pia'), tier: 'weak', aggressor: 'hero', rng: heroFirst() });
  heroAttack(db, saveId, { rng: script([15, 20], [5, 8]) });
  assert.equal(count(db, 'improv_npcs'), 1);
});

test('the enemy name follows the safety rules and cannot be a real person, a slot, or empty', () => {
  const { db, saveId } = ready();
  const realName = db.prepare("SELECT name FROM world_npcs WHERE save_id = ? AND slot = 'N1'").get(saveId).name;
  const bad = [
    realName,
    realName.toUpperCase(),
    'N3',
    'L2',
    '',
    '   ',
    'x'.repeat(61),
    `A${String.fromCharCode(0x200b)}B`,
    'As an AI language model',
  ];
  for (const name of bad) {
    assert.throws(
      () => beginFight(db, saveId, { ...improv(name), tier: 'weak', aggressor: 'hero', rng: heroFirst() }),
      undefined,
      JSON.stringify(name),
    );
  }
  setLanguage(db, saveId, 'uk');
  assert.throws(
    () =>
      beginFight(db, saveId, {
        ...improv('Вовк, як штучний інтелект'),
        tier: 'weak',
        aggressor: 'hero',
        rng: heroFirst(),
      }),
    /banned phrase/,
  );
  assert.equal(count(db, 'fights'), 0);
  assert.equal(
    beginFight(db, saveId, { ...improv('Дорожній вовк'), tier: 'weak', aggressor: 'hero', rng: heroFirst() }).enemy
      .name,
    'Дорожній вовк',
  );
});

test('an improvised fight takes one of npc or improv, a real tier and aggressor, and no quest', () => {
  const { db, saveId } = ready();
  const base = { tier: 'weak', aggressor: 'hero', rng: heroFirst() };
  assert.throws(() => beginFight(db, saveId, { ...base, ...improv(), npcSlot: 'N1' }), /either/i);
  assert.throws(() => beginFight(db, saveId, { ...base }), /not here|either/i);
  assert.throws(() => beginFight(db, saveId, { ...base, ...improv(), tier: 'epic' }), /Unknown tier/);
  assert.throws(() => beginFight(db, saveId, { ...base, ...improv(), aggressor: 'both' }), /Aggressor/);
  assert.throws(() => beginFight(db, saveId, { ...base, ...improv(), questId: 'dice-roll' }), /quest/i);
  assert.equal(count(db, 'fights'), 0);
});

test('a tamper reset in the middle of an improvised fight abandons it and keeps the invented content', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Wolf Den', description: 'A cave that smells of wet fur.' });
  const { fightId } = beginFight(db, saveId, { ...improv(), tier: 'normal', aggressor: 'hero', rng: heroFirst() });
  applyTamperReset(db, saveId, { expected: 'aaa', found: 'bbb' });
  assert.equal(db.prepare('SELECT outcome FROM fights WHERE id = ?').get(fightId).outcome, 'abandoned');
  assert.equal(getFightState(db, saveId), null);
  assert.equal(count(db, 'detours'), 1);
});

test('the real fights still refuse from a detour, and the boss rules are untouched by improvised wins', () => {
  const { db, saveId } = ready();
  enterDetour(db, saveId, { name: 'The Wolf Den', description: 'A cave that smells of wet fur.' });
  assert.throws(
    () => beginFight(db, saveId, { npcSlot: 'N1', tier: 'weak', aggressor: 'hero', rng: heroFirst() }),
    /detour/i,
  );
  const map = ready();
  beginFight(map.db, map.saveId, { ...improv('Road Wolf'), tier: 'weak', aggressor: 'hero', rng: heroFirst() });
  heroAttack(map.db, map.saveId, { rng: script([15, 20], [5, 8]) });
  assert.throws(
    () => beginFight(map.db, map.saveId, { npcSlot: 'N7', tier: 'tough', aggressor: 'hero', rng: heroFirst() }),
    /./,
  );
});
