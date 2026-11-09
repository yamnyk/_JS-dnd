import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isQuestOpen, missingFor } from '../../game/quests.js';
import {
  LADDER_RUNGS,
  OPENING_ID,
  CAPSTONE_ID,
  TIERS,
  SUBJECTS,
  OPENING_SUBJECT,
  CAPSTONE_SUBJECT,
} from '../../quests/curriculum.js';

// A full registry of stand-ins: the opening, every subject at every tier, and the capstone.
const slot = (subject, tier, rung, id) => ({ id, subject, tier, rung, complexity: 1 });
const ladder = [
  slot(OPENING_SUBJECT, null, 1, OPENING_ID),
  ...SUBJECTS.flatMap((s) => TIERS.map((tier) => slot(s.id, tier, s.rung, `${s.id}-${tier}`))),
  slot(CAPSTONE_SUBJECT, null, LADDER_RUNGS + 1, CAPSTONE_ID),
];
const byId = (id) => ladder.find((q) => q.id === id);
const open = (id, solved) => isQuestOpen(byId(id), solved, ladder);

// The ids that count as "rung r is done": the easy and the medium of every subject, plus the opening for rung 1.
const rungDone = (rung) =>
  ladder
    .filter((q) => q.rung === rung && (q.id === OPENING_ID || q.tier === 'easy' || q.tier === 'medium'))
    .map((q) => q.id);

test('rung 1 is open from the start, in any order, including the hard quests', () => {
  for (const quest of ladder.filter((q) => q.rung === 1)) assert.equal(isQuestOpen(quest, [], ladder), true, quest.id);
});

test('rung 2 stays closed until the opening and the easy and medium quest of every rung 1 subject are solved', () => {
  assert.equal(open('conditionals-easy', []), false);
  assert.equal(open('conditionals-easy', rungDone(1)), true);
  assert.equal(open('functions-hard', rungDone(1)), true);
});

test('the hard quests of the previous rung are not needed to open the next one', () => {
  const solved = rungDone(1);
  assert.ok(!solved.some((id) => id.endsWith('-hard')));
  assert.equal(open('loops-medium', solved), true);
});

test('one missing medium, easy, or the opening keeps the next rung closed', () => {
  for (const missing of rungDone(1)) {
    const solved = rungDone(1).filter((id) => id !== missing);
    assert.equal(open('conditionals-easy', solved), false, `without ${missing}`);
  }
});

test('a rung needs every earlier rung, not only the one before it', () => {
  const solved = [...rungDone(2), ...rungDone(3)];
  assert.equal(open('errors-easy', solved), false, 'rung 1 is not done');
  assert.equal(open('errors-easy', [...rungDone(1), ...rungDone(2), ...rungDone(3)]), true);
});

test('every rung from 2 to 6 opens in turn as the rungs before it are done', () => {
  let solved = [];
  for (let rung = 2; rung <= LADDER_RUNGS; rung++) {
    const first = ladder.find((q) => q.rung === rung);
    assert.equal(isQuestOpen(first, solved, ladder), false, `rung ${rung} must be closed`);
    solved = [...solved, ...rungDone(rung - 1)];
    assert.equal(isQuestOpen(first, solved, ladder), true, `rung ${rung} must be open`);
  }
});

test('the capstone opens only when all 52 other quests are solved, hard ones included', () => {
  const others = ladder.filter((q) => q.id !== CAPSTONE_ID).map((q) => q.id);
  assert.equal(others.length, 52);
  assert.equal(open(CAPSTONE_ID, []), false);
  assert.equal(open(CAPSTONE_ID, others.slice(0, 51)), false);
  assert.equal(
    open(
      CAPSTONE_ID,
      others.filter((id) => id !== 'event-loop-hard'),
    ),
    false,
  );
  assert.equal(open(CAPSTONE_ID, others), true);
});

test('solved quests can be given as an array or a set, and unknown ids are ignored', () => {
  assert.equal(isQuestOpen(byId('conditionals-easy'), new Set(rungDone(1)), ladder), true);
  assert.equal(isQuestOpen(byId('conditionals-easy'), [...rungDone(1), 'nonsense'], ladder), true);
});

test('missingFor names what is still to solve, in play order, and nothing when the quest is open', () => {
  assert.deepEqual(missingFor(byId('values-easy'), [], ladder), []);
  const missing = missingFor(byId('conditionals-easy'), [], ladder);
  assert.equal(missing[0], OPENING_ID);
  assert.deepEqual(missing, rungDone(1));
  assert.deepEqual(missingFor(byId('conditionals-easy'), rungDone(1), ladder), []);
  assert.equal(missingFor(byId(CAPSTONE_ID), [], ladder).length, 52);
});

test('a revoked solve closes what depended on it again', () => {
  const solved = rungDone(1);
  assert.equal(open('conditionals-easy', solved), true);
  assert.equal(
    open(
      'conditionals-easy',
      solved.filter((id) => id !== 'objects-medium'),
    ),
    false,
  );
});

test('with the registry that exists today every quest is on rung 1 and open from the start', async () => {
  const { QUESTS } = await import('../../quests/index.js');
  for (const quest of QUESTS) assert.equal(isQuestOpen(quest, []), true, quest.id);
});
