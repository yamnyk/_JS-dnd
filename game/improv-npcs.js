import { inTransaction } from './db.js';
import { getHero } from './hero.js';
import { worldStatus } from './world-status.js';
import { effectiveLanguage } from './i18n.js';
import { LIMITS, checkName, checkText, assertRoom } from './improv.js';

// People the Master invents on the go. A person stands at a map place (base_slot), and in a detour when
// detour_id is set. They are scenery and conversation: they hold no quests, and what they give is the
// Master's call (see game/rewards.js). This module imports nothing that depends on the sealed dice files.
const now = () => new Date().toISOString();

function requireReady(db, saveId) {
  const hero = getHero(db, saveId);
  if (!hero) throw new Error('No hero yet. Create one first.');
  const status = worldStatus(db, saveId);
  if (!status.complete) throw new Error(`The world is not ready yet (missing: ${status.missing.join(', ')}).`);
  return hero;
}

const mapPlaceName = (db, saveId, slot) =>
  db.prepare('SELECT name FROM world_locations WHERE save_id = ? AND slot = ?').get(saveId, slot)?.name ?? slot;

// Where a person stands, in words: the detour's name, or the map place's.
function placeOf(db, saveId, row) {
  if (row.detour_id) return db.prepare('SELECT name FROM detours WHERE id = ?').get(row.detour_id)?.name ?? '';
  return mapPlaceName(db, saveId, row.base_slot);
}

const shape = (db, saveId, row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  voice: row.voice,
  place: placeOf(db, saveId, row),
});

export function listNpcs(db, saveId) {
  return db
    .prepare('SELECT * FROM improv_npcs WHERE save_id = ? ORDER BY id')
    .all(saveId)
    .map((row) => shape(db, saveId, row));
}

// The invented people who stand where the hero is now: the same map place and the same detour (or none).
export function npcsHere(db, saveId) {
  const hero = getHero(db, saveId);
  if (!hero) return [];
  return db
    .prepare('SELECT * FROM improv_npcs WHERE save_id = ? AND base_slot = ? AND detour_id IS ? ORDER BY id')
    .all(saveId, hero.locationSlot, hero.detourId)
    .map((row) => shape(db, saveId, row));
}

// A new person where the hero stands now (on the map place, or in the detour they are in).
export function inventNpc(db, saveId, { name, description, voice } = {}) {
  return inTransaction(db, () => {
    const hero = requireReady(db, saveId);
    const lang = effectiveLanguage(db, saveId);
    const clean = checkName(name, lang, 'Person name');
    const taken =
      db.prepare('SELECT 1 FROM improv_npcs WHERE save_id = ? AND lower(name) = lower(?)').get(saveId, clean) ??
      db.prepare('SELECT 1 FROM world_npcs WHERE save_id = ? AND lower(name) = lower(?)').get(saveId, clean);
    if (taken) throw new Error(`Somebody called "${clean}" already exists. Talk to them, or pick another name.`);
    const text = checkText('Description', description, LIMITS.description, lang);
    const speech = checkText('Voice', voice, LIMITS.voice, lang);
    assertRoom(db, saveId, 'improv_npcs', LIMITS.people, 'people');
    const id = Number(
      db
        .prepare(
          'INSERT INTO improv_npcs (save_id, base_slot, detour_id, name, description, voice, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run(saveId, hero.locationSlot, hero.detourId, clean, text, speech, now()).lastInsertRowid,
    );
    return { npc: shape(db, saveId, db.prepare('SELECT * FROM improv_npcs WHERE id = ?').get(id)) };
  });
}

// Talking to someone by a name that is not a real person. The hero is already known to be ready.
export function talkToInvented(db, saveId, hero, name) {
  const row = db.prepare('SELECT * FROM improv_npcs WHERE save_id = ? AND lower(name) = lower(?)').get(saveId, name);
  if (!row) {
    throw new Error(
      `"${name}" is not here. To bring a new person into the story, run: node game/cli.js npc invent "<name>" "<description>" "<voice>".`,
    );
  }
  if (row.base_slot !== hero.locationSlot || (row.detour_id ?? null) !== (hero.detourId ?? null)) {
    throw new Error(`"${row.name}" is not here. They stand at ${placeOf(db, saveId, row)}.`);
  }
  return {
    npc: { slot: null, name: row.name, description: row.description, voice: row.voice, improvised: true },
    offer: null,
    open: [],
  };
}
