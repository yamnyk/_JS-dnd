import { inTransaction } from './db.js';
import { getHero } from './hero.js';
import { worldStatus } from './world-status.js';
import { effectiveLanguage } from './i18n.js';
import { LIMITS, checkName, checkText, assertRoom, findByName } from './improv.js';
import { tasksInDetour } from './side-tasks.js';

// Places the Master invents on the go. The hero keeps a real map place (heroes.location_slot) and gets a
// detour_id while off the map, so everything keyed on the six places (rest, quests, the status bar) keeps
// working. A detour hangs off the map place where it was made, and may hold detours of its own.
// This module imports nothing that depends on the sealed dice files.
const now = () => new Date().toISOString();

const LEAVE = 'Run: node game/cli.js detour leave, then try again.';

function requireReady(db, saveId) {
  const hero = getHero(db, saveId);
  if (!hero) throw new Error('No hero yet. Create one first.');
  const status = worldStatus(db, saveId);
  if (!status.complete) throw new Error(`The world is not ready yet (missing: ${status.missing.join(', ')}).`);
  return hero;
}

const mapPlaceName = (db, saveId, slot) =>
  db.prepare('SELECT name FROM world_locations WHERE save_id = ? AND slot = ?').get(saveId, slot)?.name ?? slot;

function shape(db, saveId, row) {
  if (!row) return null;
  const parent = row.parent_id ? db.prepare('SELECT name FROM detours WHERE id = ?').get(row.parent_id) : null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    baseSlot: row.base_slot,
    baseName: mapPlaceName(db, saveId, row.base_slot),
    parent: parent?.name ?? null,
  };
}

// The detour the hero is in now, or null on the map. Reads only.
export function currentDetour(db, saveId) {
  const row = db
    .prepare('SELECT d.* FROM heroes h JOIN detours d ON d.id = h.detour_id WHERE h.save_id = ?')
    .get(saveId);
  const here = shape(db, saveId, row);
  return here && { ...here, tasks: tasksInDetour(db, saveId, here.id) };
}

export function listDetours(db, saveId) {
  return db
    .prepare('SELECT * FROM detours WHERE save_id = ? ORDER BY id')
    .all(saveId)
    .map((row) => shape(db, saveId, row));
}

// Puts the hero back on the map, wherever they were.
export const clearDetour = (db, saveId) =>
  db.prepare('UPDATE heroes SET detour_id = NULL WHERE save_id = ?').run(saveId);

// What the Master is told when a real person or a rest needs the map.
export const needMapMessage = (what) => `The hero is in a detour, so ${what}. ${LEAVE}`;

// Enters a place by name, making it first when it does not exist yet (then it needs a description).
export function enterDetour(db, saveId, { name, description } = {}) {
  return inTransaction(db, () => {
    const hero = requireReady(db, saveId);
    const lang = effectiveLanguage(db, saveId);
    const clean = checkName(name, lang, 'Place name');
    const current = db.prepare('SELECT * FROM detours WHERE id = ?').get(hero.detourId ?? -1) ?? null;
    const existing = findByName(db.prepare('SELECT * FROM detours WHERE save_id = ?').all(saveId), clean);

    if (existing) {
      if (existing.base_slot !== hero.locationSlot) {
        throw new Error(
          `"${existing.name}" is near ${mapPlaceName(db, saveId, existing.base_slot)}, not here. Go there first.`,
        );
      }
      if (existing.id !== current?.id && (existing.parent_id ?? null) !== (current?.id ?? null)) {
        throw new Error(`"${existing.name}" is not inside the place the hero is in. ${LEAVE}`);
      }
      db.prepare('UPDATE heroes SET detour_id = ? WHERE save_id = ?').run(existing.id, saveId);
      return { created: false, detour: shape(db, saveId, existing) };
    }

    if (description === undefined || description === null || description === '') {
      throw new Error(
        `"${clean}" is a new place, so it needs a description: node game/cli.js detour enter "${clean}" "<description>".`,
      );
    }
    const text = checkText('Description', description, LIMITS.description, lang);
    assertRoom(db, saveId, 'detours', LIMITS.places, 'places');
    const id = Number(
      db
        .prepare(
          'INSERT INTO detours (save_id, parent_id, base_slot, name, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(saveId, current?.id ?? null, hero.locationSlot, clean, text, now()).lastInsertRowid,
    );
    db.prepare('UPDATE heroes SET detour_id = ? WHERE save_id = ?').run(id, saveId);
    return { created: true, detour: shape(db, saveId, db.prepare('SELECT * FROM detours WHERE id = ?').get(id)) };
  });
}

// One level out: to the place the detour is inside, or to the map.
export function leaveDetour(db, saveId) {
  return inTransaction(db, () => {
    const hero = requireReady(db, saveId);
    if (hero.detourId === null || hero.detourId === undefined) throw new Error('The hero is not in a detour.');
    const row = db.prepare('SELECT * FROM detours WHERE id = ?').get(hero.detourId);
    db.prepare('UPDATE heroes SET detour_id = ? WHERE save_id = ?').run(row?.parent_id ?? null, saveId);
    return {
      detour: shape(
        db,
        saveId,
        row?.parent_id ? db.prepare('SELECT * FROM detours WHERE id = ?').get(row.parent_id) : null,
      ),
      location: { slot: hero.locationSlot, name: mapPlaceName(db, saveId, hero.locationSlot) },
    };
  });
}
