import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSave, createHeroFromChoices } from '../../game/hero.js';
import { setSetting, fillWorld } from '../../game/world.js';
import { setLanguage } from '../../game/i18n.js';
import { readVitals, restHero } from '../../game/vitals.js';
import { listItems, countItems } from '../../game/inventory.js';
import { heroLineInfo } from '../../game/hero-line.js';
import { grantGold, grantRewardItem, listRewards, MAX_GOLD_GRANT } from '../../game/rewards.js';
import { freshDb } from './helpers.js';
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

test('granting gold adds it, returns the new total, and writes a ledger row with the reason', () => {
  const { db, saveId } = ready();
  const first = grantGold(db, saveId, { amount: 12, reason: 'the smith paid for the delivery' });
  assert.equal(first.gold, 12);
  assert.equal(readVitals(db, saveId).gold, 12);
  const second = grantGold(db, saveId, { amount: 3, reason: 'a tip' });
  assert.equal(second.gold, 15);
  const ledger = listRewards(db, saveId);
  assert.deepEqual(
    ledger.map((r) => [r.kind, r.amount, r.reason]),
    [
      ['gold', 12, 'the smith paid for the delivery'],
      ['gold', 3, 'a tip'],
    ],
  );
});

test('gold must be a whole number from 1 up to the safety bound, and a refusal changes nothing', () => {
  const { db, saveId } = ready();
  assert.equal(MAX_GOLD_GRANT, 1000000);
  for (const bad of [0, -5, 1.5, NaN, Infinity, '7', null, undefined, MAX_GOLD_GRANT + 1]) {
    assert.throws(() => grantGold(db, saveId, { amount: bad, reason: 'x' }), /whole number/i, String(bad));
  }
  assert.equal(grantGold(db, saveId, { amount: MAX_GOLD_GRANT, reason: 'a dragon hoard' }).gold, MAX_GOLD_GRANT);
  assert.equal(readVitals(db, saveId).gold, MAX_GOLD_GRANT);
  assert.equal(listRewards(db, saveId).length, 1);
});

test('a reason is required, short, and follows the safety rules', () => {
  const { db, saveId } = ready();
  assert.throws(() => grantGold(db, saveId, { amount: 5, reason: '' }), /Reason/);
  assert.throws(() => grantGold(db, saveId, { amount: 5 }), /Reason/);
  assert.throws(() => grantGold(db, saveId, { amount: 5, reason: 'x'.repeat(201) }), /at most 200/);
  assert.throws(() => grantGold(db, saveId, { amount: 5, reason: 'As an AI language model' }), /banned phrase/);
  assert.equal(listRewards(db, saveId).length, 0);
  assert.equal(readVitals(db, saveId).gold, 0);
});

test('gold from a reward pays for a rest, like gold from a quest', () => {
  const { db, saveId } = ready();
  db.prepare('UPDATE heroes SET hp = 3, hp_updated_at = ? WHERE save_id = ?').run(new Date().toISOString(), saveId);
  assert.throws(() => restHero(db, saveId), /5 gold/);
  grantGold(db, saveId, { amount: 5, reason: 'found coins' });
  assert.equal(restHero(db, saveId).gold, 0);
});

test('a reward item is created with its name, counted in the bar, and logged', () => {
  const { db, saveId } = ready();
  const result = grantRewardItem(db, saveId, { name: 'Brann’s lucky nail', reason: 'a thank you from the smith' });
  assert.equal(result.item.name, 'Brann’s lucky nail');
  assert.equal(result.item.source, 'reward');
  assert.equal(countItems(db, saveId), 1);
  assert.equal(heroLineInfo(db, saveId).items, 1);
  assert.deepEqual(
    listItems(db, saveId).map((i) => [i.name, i.source]),
    [['Brann’s lucky nail', 'reward']],
  );
  assert.deepEqual(
    listRewards(db, saveId).map((r) => [r.kind, r.itemName, r.reason]),
    [['item', 'Brann’s lucky nail', 'a thank you from the smith']],
  );
});

test('item names follow the safety rules: slot lookalikes, invisible characters, length, banned phrases, both languages', () => {
  const { db, saveId } = ready();
  for (const name of ['L3', '', 'x'.repeat(61), `A${String.fromCharCode(0x200b)}B`, 'As an AI language model']) {
    assert.throws(() => grantRewardItem(db, saveId, { name, reason: 'r' }), undefined, JSON.stringify(name));
  }
  setLanguage(db, saveId, 'uk');
  assert.throws(() => grantRewardItem(db, saveId, { name: 'Меч, як штучний інтелект', reason: 'r' }), /banned phrase/);
  assert.equal(countItems(db, saveId), 0);
  assert.equal(listRewards(db, saveId).length, 0);
  assert.equal(grantRewardItem(db, saveId, { name: 'Іржавий кубик', reason: 'знахідка' }).item.name, 'Іржавий кубик');
});

test('a reward can name the side task it belongs to, and only a task of this save', () => {
  const { db, saveId } = ready();
  const other = createSave(db, {});
  const task = (id) =>
    Number(
      db
        .prepare(
          "INSERT INTO side_tasks (save_id, kind, title, brief, status, created_at) VALUES (?, 'story', 't', 'b', 'open', 'now')",
        )
        .run(id).lastInsertRowid,
    );
  const mine = task(saveId);
  const theirs = task(other);
  assert.equal(grantGold(db, saveId, { amount: 4, reason: 'errand done', taskId: mine }).reward.sideTaskId, mine);
  assert.throws(() => grantGold(db, saveId, { amount: 4, reason: 'x', taskId: theirs }), /No side task/);
  assert.throws(() => grantGold(db, saveId, { amount: 4, reason: 'x', taskId: 999 }), /No side task/);
  assert.equal(listRewards(db, saveId).length, 1);
});

test('the ledger is per save and keeps its order', () => {
  const { db, saveId } = ready();
  const other = createSave(db, {});
  grantGold(db, saveId, { amount: 1, reason: 'a' });
  grantRewardItem(db, saveId, { name: 'Pebble', reason: 'b' });
  grantGold(db, saveId, { amount: 2, reason: 'c' });
  assert.deepEqual(
    listRewards(db, saveId).map((r) => r.reason),
    ['a', 'b', 'c'],
  );
  assert.equal(listRewards(db, other).length, 0);
});

test('granting needs a hero', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  assert.throws(() => grantGold(db, saveId, { amount: 5, reason: 'x' }), /no hero/i);
});
