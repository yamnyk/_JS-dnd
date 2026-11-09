import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKELETON } from '../../world/skeleton.js';
import { QUESTS } from '../../quests/index.js';
import { standInLadder } from '../game/helpers.js';

const bySlot = Object.fromEntries(SKELETON.locations.map((l) => [l.slot, l]));

test('six locations and seven npcs with unique slots, and the start is L1', () => {
  assert.equal(SKELETON.locations.length, 6);
  assert.equal(SKELETON.npcs.length, 7);
  assert.equal(new Set(SKELETON.locations.map((l) => l.slot)).size, 6);
  assert.equal(new Set(SKELETON.npcs.map((n) => n.slot)).size, 7);
  assert.equal(SKELETON.start, 'L1');
  assert.ok(bySlot.L1);
});

test('the map is connected and exits are symmetric', () => {
  for (const location of SKELETON.locations) {
    for (const exit of location.exits) {
      assert.ok(bySlot[exit], `${location.slot} exits to unknown ${exit}`);
      assert.ok(bySlot[exit].exits.includes(location.slot), `${exit} does not lead back to ${location.slot}`);
      assert.notEqual(exit, location.slot);
    }
  }
  const seen = new Set([SKELETON.start]);
  const queue = [SKELETON.start];
  while (queue.length) {
    for (const next of bySlot[queue.shift()].exits) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  assert.equal(seen.size, SKELETON.locations.length);
});

test('no location has more than 4 exits (choice prompts take 2 to 4 options)', () => {
  for (const location of SKELETON.locations) {
    assert.ok(
      location.exits.length >= 1 && location.exits.length <= 4,
      `${location.slot} has ${location.exits.length} exits`,
    );
  }
});

test('every npc stands in a real location, and N1 to N6 own rungs 1 to 6 while N7 owns the capstone rung', () => {
  for (const npc of SKELETON.npcs) assert.ok(bySlot[npc.location], `${npc.slot} is in unknown ${npc.location}`);
  assert.deepEqual(
    SKELETON.npcs.map((n) => [n.slot, n.rung]),
    [
      ['N1', 1],
      ['N2', 2],
      ['N3', 3],
      ['N4', 4],
      ['N5', 5],
      ['N6', 6],
      ['N7', 7],
    ],
  );
  assert.ok(
    SKELETON.npcs.every((n) => n.questId === undefined),
    'a fixed quest per NPC is gone',
  );
});

test('every quest of the real registry has exactly one NPC that owns its rung', () => {
  for (const quest of QUESTS) {
    const owners = SKELETON.npcs.filter((n) => n.rung === quest.rung);
    assert.equal(owners.length, 1, `${quest.id} on rung ${quest.rung}`);
  }
});

test('a complete ladder spreads 13, 9, 12, 6, 6, 6 quests over N1 to N6 and gives N7 only the capstone', () => {
  const perOwner = Object.fromEntries(SKELETON.npcs.map((n) => [n.slot, 0]));
  for (const quest of standInLadder()) perOwner[SKELETON.npcs.find((n) => n.rung === quest.rung).slot] += 1;
  assert.deepEqual(perOwner, { N1: 13, N2: 9, N3: 12, N4: 6, N5: 6, N6: 6, N7: 1 });
});

test('N7 is the final boss at the stronghold, holds no quest, and shares L6 with the captain', () => {
  const boss = SKELETON.npcs.find((n) => n.slot === 'N7');
  assert.deepEqual(boss, { slot: 'N7', location: 'L6', role: 'boss', rung: 7 });
  assert.deepEqual(
    SKELETON.npcs.filter((n) => n.location === 'L6').map((n) => n.slot),
    ['N6', 'N7'],
  );
});
