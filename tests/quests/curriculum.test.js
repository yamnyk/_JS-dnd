import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTS } from '../../quests/index.js';
import {
  LADDER_RUNGS,
  LADDER_QUEST_COUNT,
  OPENING_ID,
  CAPSTONE_ID,
  TIERS,
  SUBJECTS,
  OPENING_SUBJECT,
  CAPSTONE_SUBJECT,
  ladderStatus,
} from '../../quests/curriculum.js';

// A full registry made of stand-ins, one per slot, so the real one can be incomplete while the rules are tested.
const slot = (subject, tier, rung, id) => ({ id, subject, tier, rung, complexity: 1 });
const fullLadder = () => [
  slot(OPENING_SUBJECT, null, 1, OPENING_ID),
  ...SUBJECTS.flatMap((s) => TIERS.map((tier) => slot(s.id, tier, s.rung, `${s.id}-${tier}`))),
  slot(CAPSTONE_SUBJECT, null, LADDER_RUNGS + 1, CAPSTONE_ID),
];

test('the ladder has 6 rungs and 17 subjects spread the way the catalog says', () => {
  assert.equal(LADDER_RUNGS, 6);
  assert.deepEqual(TIERS, ['easy', 'medium', 'hard']);
  assert.equal(SUBJECTS.length, 17);
  assert.equal(new Set(SUBJECTS.map((s) => s.id)).size, 17);
  const perRung = {};
  for (const s of SUBJECTS) perRung[s.rung] = (perRung[s.rung] ?? 0) + 1;
  assert.deepEqual(perRung, { 1: 4, 2: 3, 3: 4, 4: 2, 5: 2, 6: 2 });
  assert.deepEqual(
    SUBJECTS.map((s) => s.rung),
    [...SUBJECTS.map((s) => s.rung)].sort((a, b) => a - b),
    'subjects are listed rung by rung',
  );
  assert.equal(OPENING_ID, 'dice-roll');
  assert.equal(CAPSTONE_ID, 'final-exam');
});

test('the subject ids are the ones the catalog uses, in catalog order', () => {
  assert.deepEqual(
    SUBJECTS.map((s) => s.id),
    [
      'values',
      'strings',
      'arrays',
      'objects',
      'conditionals',
      'loops',
      'functions',
      'callbacks',
      'array-methods',
      'string-methods',
      'closures',
      'errors',
      'timeouts',
      'promises',
      'async-await',
      'fetch-json',
      'event-loop',
    ],
  );
});

test('every registered quest names a known subject and tier, on the rung of that subject', () => {
  const bySubject = new Map(SUBJECTS.map((s) => [s.id, s]));
  assert.equal(new Set(QUESTS.map((q) => q.id)).size, QUESTS.length);
  for (const quest of QUESTS) {
    assert.ok(quest.complexity >= 1 && quest.complexity <= 5, `${quest.id} complexity`);
    if (quest.id === OPENING_ID) {
      assert.deepEqual([quest.subject, quest.tier, quest.rung], [OPENING_SUBJECT, null, 1]);
    } else if (quest.id === CAPSTONE_ID) {
      assert.deepEqual([quest.subject, quest.tier, quest.rung], [CAPSTONE_SUBJECT, null, LADDER_RUNGS + 1]);
    } else {
      const subject = bySubject.get(quest.subject);
      assert.ok(subject, `${quest.id} has unknown subject ${quest.subject}`);
      assert.ok(TIERS.includes(quest.tier), `${quest.id} has unknown tier ${quest.tier}`);
      assert.equal(quest.rung, subject.rung, `${quest.id} is on the wrong rung`);
    }
  }
});

test('the registry is in play order: rung, then opening first, then subject order, then tier', () => {
  const subjectOrder = (q) => (q.subject === OPENING_SUBJECT ? -1 : SUBJECTS.findIndex((s) => s.id === q.subject));
  const key = (q) => [q.rung, subjectOrder(q), q.tier === null ? -1 : TIERS.indexOf(q.tier)];
  for (let i = 1; i < QUESTS.length; i++) {
    const [a, b] = [key(QUESTS[i - 1]), key(QUESTS[i])];
    const ordered = a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2])));
    assert.ok(ordered, `${QUESTS[i - 1].id} must come before ${QUESTS[i].id}`);
  }
});

test('the three quests that exist keep their ids and take their place in the ladder', () => {
  const by = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
  assert.deepEqual(
    ['dice-roll', 'string-shout', 'array-sum'].map((id) => [by[id].subject, by[id].tier, by[id].rung]),
    [
      ['opening', null, 1],
      ['strings', 'easy', 1],
      ['arrays', 'medium', 1],
    ],
  );
});

test('the real registry is not a complete ladder yet, and says what is missing', () => {
  const status = ladderStatus();
  assert.equal(status.complete, false);
  assert.equal(status.capstone, false);
  const missing = status.missing.map((m) => `${m.subject}/${m.tier}`);
  assert.ok(missing.includes('callbacks/easy'), 'rung 3 is not built yet');
  assert.ok(!missing.includes('conditionals/easy'), 'rung 2 is built');
  assert.ok(!missing.includes('strings/easy'), 'string-shout fills strings/easy');
  assert.ok(!missing.includes('arrays/medium'), 'array-sum fills arrays/medium');
  assert.ok(!missing.includes('values/easy'), 'rung 1 is built');
  assert.equal(status.opening, true);
});

test('a registry with every slot filled is a complete ladder', () => {
  assert.deepEqual(ladderStatus(fullLadder()), { complete: true, missing: [], opening: true, capstone: true });
  assert.equal(fullLadder().length, 53);
});

test('taking any one slot away makes the ladder incomplete and names that slot', () => {
  const full = fullLadder();
  for (let i = 0; i < full.length; i++) {
    const without = full.filter((_, j) => j !== i);
    const status = ladderStatus(without);
    assert.equal(status.complete, false, `without ${full[i].id}`);
    if (full[i].id === OPENING_ID) assert.equal(status.opening, false);
    else if (full[i].id === CAPSTONE_ID) assert.equal(status.capstone, false);
    else assert.deepEqual(status.missing, [{ subject: full[i].subject, tier: full[i].tier }]);
  }
});

test('a duplicate slot or a quest with an unknown subject does not complete the ladder', () => {
  const full = fullLadder();
  const bogus = full.map((q) => (q.id === 'values-easy' ? { ...q, subject: 'nonsense' } : q));
  assert.equal(ladderStatus(bogus).complete, false);
  assert.deepEqual(ladderStatus(bogus).missing, [{ subject: 'values', tier: 'easy' }]);
});

test('the whole ladder is 53 quests: 51 in the grid, the opening, and the capstone', () => {
  assert.equal(LADDER_QUEST_COUNT, 53);
  assert.equal(LADDER_QUEST_COUNT, fullLadder().length);
});
