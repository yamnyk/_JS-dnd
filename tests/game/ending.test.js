import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { endingStatus, buildEnding, bossBlocker } from '../../game/ending.js';
import { beginFight, heroAttack } from '../../game/combat-engine.js';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld } from '../../game/world.js';
import { checkQuest, judgeQuest, revokeSolve } from '../../game/quests.js';
import { applyTamperReset } from '../../game/reset.js';
import { QUESTS } from '../../quests/index.js';
import { CAPSTONE_ID } from '../../quests/curriculum.js';
import { freshDb, markSolved, standInLadder } from './helpers.js';
import { setLanguage } from '../../game/i18n.js';
import { questText } from '../../quests/text/index.js';
import { SETTING, goodWorld } from './world-fixtures.js';

const solutions = join(resolve(dirname(fileURLToPath(import.meta.url))), '..', 'quests', 'solutions');
const HERO = { name: 'Bilbo', race: 'hobbit', heroClass: 'rogue', scores: [8, 15, 14, 8, 8, 15] };
const LOW = () => 0.01;
const pause = (ms) => {
  const end = Date.now() + ms;
  while (Date.now() < end);
};

// `quests` is the real registry with every missing slot filled by a stand-in, so a complete ladder exists.
// The library calls below take it as an option. The real registry is incomplete on purpose, and the tests
// further down check what it does with it.
function ready() {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  const playerDir = mkdtempSync(join(tmpdir(), 'jsdnd-ending-'));
  const quests = standInLadder();
  // Only the three starters have their reference solutions judged for real. The rest are marked solved,
  // which is all these tests need, and keeps them fast as the registry grows.
  const real = new Set(['dice-roll', 'string-shout', 'array-sum']);
  const solveOne = (quest) => {
    if (!real.has(quest.id)) return markSolved(db, saveId, quest.id);
    copyFileSync(join(solutions, `${quest.id}.reference.js`), join(playerDir, `${quest.id}.js`));
    checkQuest(db, saveId, quest.id, { playerDir, timeoutMs: 15000 });
    judgeQuest(db, saveId, quest.id, 'clean', null, { playerDir });
  };
  const solveAll = () => {
    for (const quest of quests) if (quest.id !== CAPSTONE_ID) solveOne(quest);
    solveOne(quests.find((q) => q.id === CAPSTONE_ID));
  };
  const status = () => endingStatus(db, saveId, { quests });
  const atStronghold = () => db.prepare("UPDATE heroes SET location_slot = 'L6' WHERE save_id = ?").run(saveId);
  const begin = (extra = {}) =>
    beginFight(db, saveId, { npcSlot: 'N7', tier: 'tough', aggressor: 'hero', quests, ...extra });
  // The hero always goes first and the boss always misses, so the fight is a plain grind.
  const winBoss = () => {
    // The win must land strictly after the latest solve, and timestamps are millisecond ISO strings.
    pause(2);
    atStronghold();
    begin({ rng: LOW });
    let state;
    do state = heroAttack(db, saveId, { rng: LOW, sureHit: true, doubleDamage: true, quests });
    while (state.status === 'open');
    return state;
  };
  return { db, saveId, quests, solveAll, solveOne, status, begin, atStronghold, winBoss, playerDir };
}

// Writes the boss fight as the engine would have left it, to stand in for a save from before the guard.
function insertBossWin(db, saveId, at = new Date().toISOString()) {
  db.prepare(
    "INSERT INTO fights (save_id, started_at, ended_at, trigger_reason, outcome, npc_slot) VALUES (?, ?, ?, 'x', 'won', 'N7')",
  ).run(saveId, at, at);
}

test('a fresh save is locked with nothing solved', () => {
  const { status } = ready();
  assert.deepEqual(status(), {
    questsSolved: 0,
    questsTotal: 53,
    bossDefeated: false,
    ladderComplete: true,
    unlocked: false,
  });
});

test('all quests solved without the boss stays locked', () => {
  const { solveAll, status } = ready();
  solveAll();
  const result = status();
  assert.deepEqual([result.questsSolved, result.bossDefeated, result.unlocked], [53, false, false]);
});

test('a boss win without the quests stays locked', () => {
  const { db, saveId, status } = ready();
  insertBossWin(db, saveId);
  const result = status();
  assert.deepEqual([result.bossDefeated, result.unlocked], [true, false]);
});

test('every quest plus the boss unlocks the ending, and a tamper reset locks it again until both are redone', () => {
  const { db, saveId, solveAll, winBoss, status } = ready();
  solveAll();
  winBoss();
  assert.equal(status().unlocked, true);

  pause(5);
  applyTamperReset(db, saveId, { expected: 'a', found: 'b' });
  const reset = status();
  assert.deepEqual([reset.questsSolved, reset.bossDefeated, reset.unlocked], [0, false, false]);

  pause(5);
  solveAll();
  assert.equal(status().unlocked, false);
  db.prepare('UPDATE heroes SET level = 1 WHERE save_id = ?').run(saveId);
  winBoss();
  assert.equal(status().unlocked, true);
});

test('the boss fight is refused until every quest is solved, and only at tough', () => {
  const { db, saveId, solveAll, atStronghold, begin } = ready();
  atStronghold();
  assert.throws(() => begin(), /quest/i);
  solveAll();
  for (const tier of ['weak', 'normal']) assert.throws(() => begin({ tier }), /tough/i);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fights').get().n, 0);
  assert.equal(begin({ rng: LOW }).enemy.tier, 'tough');
});

test('the boss stays shut while only the capstone is unsolved, and names it', () => {
  const { solveOne, quests, atStronghold, begin } = ready();
  for (const quest of quests) if (quest.id !== CAPSTONE_ID) solveOne(quest);
  atStronghold();
  assert.throws(() => begin(), new RegExp(CAPSTONE_ID));
});

test('winning against the boss reports endingUnlocked, winning against anyone else does not', () => {
  const { db, saveId, quests, solveAll, winBoss } = ready();
  const first = beginFight(db, saveId, { npcSlot: 'N1', tier: 'weak', aggressor: 'hero', rng: LOW, quests });
  assert.equal(first.status, 'open');
  let state;
  do state = heroAttack(db, saveId, { rng: LOW, sureHit: true, doubleDamage: true, quests });
  while (state.status === 'open');
  assert.equal(state.status, 'won');
  assert.equal('endingUnlocked' in state, false);

  solveAll();
  assert.equal(winBoss().endingUnlocked, true);
});

test('the boss win without every quest never reports endingUnlocked', () => {
  const { db, saveId, quests, atStronghold } = ready();
  atStronghold();
  // Bypass the gate on purpose: write the boss fight as the engine would have left it.
  db.prepare(
    "INSERT INTO fights (save_id, started_at, trigger_reason, npc_slot, aggressor, enemy_name, enemy_tier, enemy_hp, enemy_hp_max, enemy_ac, hero_hp, hero_hp_max) VALUES (?, ?, 'x', 'N7', 'hero', 'Boss', 'tough', 1, 26, 14, 12, 12)",
  ).run(saveId, new Date().toISOString());
  const state = heroAttack(db, saveId, { rng: LOW, sureHit: true, doubleDamage: true, quests });
  assert.equal(state.status, 'won');
  assert.equal('endingUnlocked' in state, false);
});

test('buildEnding writes the page only when the ending is unlocked', () => {
  const { db, saveId, quests, solveAll, winBoss } = ready();
  const dir = mkdtempSync(join(tmpdir(), 'jsdnd-page-'));
  assert.throws(() => buildEnding(db, saveId, { playerDir: dir, quests }), /not over|boss|quest/i);
  assert.equal(existsSync(join(dir, 'ending.html')), false);
  solveAll();
  winBoss();
  const built = buildEnding(db, saveId, { playerDir: dir, quests });
  assert.equal(built.file, join(dir, 'ending.html'));
  const html = readFileSync(built.file, 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Bilbo/);
  assert.match(html, /53 of 53/);
});

test('a boss fight that was lost, fled, or abandoned never unlocks the ending', () => {
  const { db, saveId, solveAll, status } = ready();
  solveAll();
  for (const outcome of ['lost', 'fled', 'abandoned']) {
    db.prepare(
      "INSERT INTO fights (save_id, started_at, ended_at, trigger_reason, outcome, npc_slot) VALUES (?, ?, ?, 'x', ?, 'N7')",
    ).run(saveId, new Date().toISOString(), new Date().toISOString(), outcome);
    const result = status();
    assert.deepEqual([result.bossDefeated, result.unlocked], [false, false], outcome);
  }
});

test('a boss win in another save does not unlock this one', () => {
  const { db, saveId, solveAll, status } = ready();
  solveAll();
  insertBossWin(db, createSave(db, {}));
  assert.equal(status().bossDefeated, false);
});

test('a quest solved after the boss win locks the ending until the boss is beaten again', () => {
  const { db, saveId, solveAll, winBoss, status } = ready();
  solveAll();
  winBoss();
  assert.equal(status().unlocked, true);

  pause(5);
  // A quest that did not exist when the boss fell, solved afterwards.
  markSolved(db, saveId, 'future-quest');
  const locked = status();
  assert.deepEqual([locked.bossDefeated, locked.unlocked], [false, false]);

  pause(5);
  const again = winBoss();
  assert.equal(again.endingUnlocked, true);
  assert.equal(status().unlocked, true);
});

test('revoking a solve locks the ending and the boss, and the boss must fall again after the re-solve', () => {
  const { db, saveId, solveAll, winBoss, playerDir, status, begin } = ready();
  solveAll();
  winBoss();
  assert.equal(status().unlocked, true);

  revokeSolve(db, saveId, 'array-sum', 'the Master found a hardcoded answer');
  const locked = status();
  assert.deepEqual([locked.questsSolved, locked.unlocked], [52, false]);
  assert.throws(() => begin(), /array-sum/i);

  pause(5);
  checkQuest(db, saveId, 'array-sum', { playerDir, timeoutMs: 15000 });
  judgeQuest(db, saveId, 'array-sum', 'clean', null, { playerDir });
  assert.equal(status().unlocked, false);
  pause(5);
  assert.equal(winBoss().endingUnlocked, true);
});

test('a reset or a solve in the same millisecond as the boss win does not count as before it', () => {
  const { db, saveId, status } = ready();
  const at = new Date().toISOString();
  insertBossWin(db, saveId, at);
  db.prepare(
    "INSERT INTO resets (save_id, created_at, reason, fingerprint_expected, fingerprint_found) VALUES (?, ?, 'x', 'a', 'b')",
  ).run(saveId, at);
  assert.equal(status().bossDefeated, false);

  const solved = ready();
  insertBossWin(solved.db, solved.saveId, at);
  markSolved(solved.db, solved.saveId, 'dice-roll', at);
  assert.equal(solved.status().bossDefeated, false);
});

test('the ending page is built in the language of the save', () => {
  const { db, saveId, quests, solveAll, winBoss } = ready();
  solveAll();
  winBoss();
  setLanguage(db, saveId, 'uk');
  const dir = mkdtempSync(join(tmpdir(), 'jsdnd-page-uk-'));
  const html = readFileSync(buildEnding(db, saveId, { playerDir: dir, quests }).file, 'utf8');
  assert.match(html, /<html lang="uk">/);
  assert.match(html, /кінець дороги/);
  assert.ok(html.includes(questText('dice-roll', 'uk').title));
});

// ---- the guard: the real registry is not a complete ladder yet, so the campaign cannot end

test('with the real registry the ladder is incomplete, so even every built quest plus a boss win does not unlock', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  for (const quest of QUESTS) markSolved(db, saveId, quest.id);
  pause(2);
  insertBossWin(db, saveId);
  const status = endingStatus(db, saveId);
  assert.deepEqual(
    [status.questsSolved, status.questsTotal, status.bossDefeated, status.ladderComplete, status.unlocked],
    [QUESTS.length, QUESTS.length, true, false, false],
  );
});

test('with the real registry the boss fight is refused and says the road is still being built', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  setSetting(db, saveId, SETTING);
  fillWorld(db, saveId, goodWorld());
  for (const quest of QUESTS) markSolved(db, saveId, quest.id);
  db.prepare("UPDATE heroes SET location_slot = 'L6' WHERE save_id = ?").run(saveId);
  assert.throws(
    () => beginFight(db, saveId, { npcSlot: 'N7', tier: 'tough', aggressor: 'hero' }),
    /road ahead is still being built/i,
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM fights').get().n, 0);
});

test('with the real registry the ending page is refused for a save that already won the boss', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHeroFromChoices(db, saveId, HERO);
  for (const quest of QUESTS) markSolved(db, saveId, quest.id);
  insertBossWin(db, saveId);
  const dir = mkdtempSync(join(tmpdir(), 'jsdnd-page-old-'));
  assert.throws(() => buildEnding(db, saveId, { playerDir: dir }), /road ahead is still being built/i);
  assert.equal(existsSync(join(dir, 'ending.html')), false);
});

test('bossBlocker says nothing when the ladder is complete and solved, and names what is left otherwise', () => {
  const { db, saveId, quests, solveOne } = ready();
  assert.match(bossBlocker(db, saveId, quests), /Solve every quest first \(left: .*, and 48 more\)/);
  for (const quest of quests.slice(0, 50)) solveOne(quest);
  assert.match(bossBlocker(db, saveId, quests), /left: [^)]*\)/);
  for (const quest of quests.slice(50)) solveOne(quest);
  assert.equal(bossBlocker(db, saveId, quests), null);
});

test('bossBlocker puts an incomplete ladder before unsolved quests, so the player hears about the road first', () => {
  const { db, saveId } = ready();
  assert.match(bossBlocker(db, saveId), /road ahead is still being built/i);
});
