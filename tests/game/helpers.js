import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openGameDb } from '../../game/db.js';
import { QUESTS } from '../../quests/index.js';
import {
  LADDER_RUNGS,
  OPENING_ID,
  OPENING_SUBJECT,
  CAPSTONE_ID,
  CAPSTONE_SUBJECT,
  TIERS,
  SUBJECTS,
} from '../../quests/curriculum.js';

// Every test that opens a game database runs the translator strictly: a missing key or placeholder
// throws, so a leak of a raw {placeholder} fails a test. Spawned CLI processes inherit it.
process.env.JSDND_I18N_STRICT = '1';
// The real hook asks the remote for new commits when a session starts. Tests must never go to the network.
process.env.JSDND_SKIP_UPDATE_CHECK = '1';

export const freshDb = () => openGameDb(join(mkdtempSync(join(tmpdir(), 'jsdnd-game-')), 'game.db'));

export const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

// Records a passing, judged solve without running anything, so a test can stand at any rung.
export function markSolved(db, saveId, questId, solvedAt = new Date().toISOString()) {
  const epoch = db.prepare('SELECT COUNT(*) AS n FROM resets WHERE save_id = ?').get(saveId).n;
  const attempt = db
    .prepare(
      "INSERT INTO quest_attempts (save_id, quest_id, created_at, status, expected, got, message, complexity) VALUES (?, ?, ?, 'pass', '', '', '', 1)",
    )
    .run(saveId, questId, solvedAt);
  db.prepare(
    'INSERT INTO quest_solves (save_id, quest_id, attempt_id, solved_at, epoch, hints_used, complexity) VALUES (?, ?, ?, ?, ?, 0, 1)',
  ).run(saveId, questId, Number(attempt.lastInsertRowid), solvedAt, epoch);
  db.prepare("INSERT INTO quest_judgments (attempt_id, created_at, verdict, note) VALUES (?, ?, 'clean', NULL)").run(
    Number(attempt.lastInsertRowid),
    solvedAt,
  );
}

// Solves every quest that comes before this one in the ladder.
export function markSolvedBefore(db, saveId, questId) {
  for (const quest of QUESTS.slice(
    0,
    QUESTS.findIndex((q) => q.id === questId),
  ))
    markSolved(db, saveId, quest.id);
}

// The real registry has only part of the ladder. This fills every missing slot with a stand-in quest, so
// the rules that need a complete ladder (the boss, the ending) can be tested before it is all built.
// The real quests keep their place. Stand-ins have no check, so they are solved with markSolved.
export function standInLadder(real = QUESTS) {
  const have = new Map(real.map((q) => [`${q.subject}/${q.tier}`, q]));
  const slots = [
    { id: OPENING_ID, subject: OPENING_SUBJECT, tier: null, rung: 1 },
    ...SUBJECTS.flatMap((s) => TIERS.map((tier) => ({ id: `${s.id}-${tier}`, subject: s.id, tier, rung: s.rung }))),
    { id: CAPSTONE_ID, subject: CAPSTONE_SUBJECT, tier: null, rung: LADDER_RUNGS + 1 },
  ];
  return slots.map((slot) => have.get(`${slot.subject}/${slot.tier}`) ?? { ...slot, complexity: 1 });
}
