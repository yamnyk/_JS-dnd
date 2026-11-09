import { QUESTS } from './index.js';

// The shape of the whole ladder, from the curriculum catalog (docs/superpowers/specs/2026-11-08-curriculum-catalog.md).
// The registry in quests/index.js holds the quests that are built. This file says how many there must be
// before the campaign can end. The boss and the ending stay locked until ladderStatus() is complete.
export const LADDER_RUNGS = 6;
export const TIERS = ['easy', 'medium', 'hard'];

// The dice quest opens the game, outside the subject grid. The capstone is the final exam on rung 7.
export const OPENING_ID = 'dice-roll';
export const OPENING_SUBJECT = 'opening';
export const CAPSTONE_ID = 'final-exam';
export const CAPSTONE_SUBJECT = 'capstone';

// 17 subjects, 3 tiers each. Order here is play order inside a rung.
export const SUBJECTS = [
  { id: 'values', rung: 1 },
  { id: 'strings', rung: 1 },
  { id: 'arrays', rung: 1 },
  { id: 'objects', rung: 1 },
  { id: 'conditionals', rung: 2 },
  { id: 'loops', rung: 2 },
  { id: 'functions', rung: 2 },
  { id: 'callbacks', rung: 3 },
  { id: 'array-methods', rung: 3 },
  { id: 'string-methods', rung: 3 },
  { id: 'closures', rung: 3 },
  { id: 'errors', rung: 4 },
  { id: 'timeouts', rung: 4 },
  { id: 'promises', rung: 5 },
  { id: 'async-await', rung: 5 },
  { id: 'fetch-json', rung: 6 },
  { id: 'event-loop', rung: 6 },
];

// How many quests the whole ladder holds: every subject at every tier, the opening, and the capstone.
export const LADDER_QUEST_COUNT = SUBJECTS.length * TIERS.length + 2;

// Which slots of the ladder are filled by the given quests. `complete` is true only when the opening quest,
// every subject at every tier, and the capstone all exist.
export function ladderStatus(quests = QUESTS) {
  const filled = new Set(quests.map((q) => `${q.subject}/${q.tier}`));
  const missing = [];
  for (const subject of SUBJECTS) {
    for (const tier of TIERS) {
      if (!filled.has(`${subject.id}/${tier}`)) missing.push({ subject: subject.id, tier });
    }
  }
  const opening = quests.some((q) => q.id === OPENING_ID && q.subject === OPENING_SUBJECT);
  const capstone = quests.some((q) => q.id === CAPSTONE_ID && q.subject === CAPSTONE_SUBJECT);
  return { complete: missing.length === 0 && opening && capstone, missing, opening, capstone };
}
