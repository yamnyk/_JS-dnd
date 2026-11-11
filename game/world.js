import { inTransaction } from './db.js';
import { getHero } from './hero.js';
import { getProgress } from './quests.js';
import { requireAwake } from './knockouts.js';
import { lintVoice } from './voice.js';
import { effectiveLanguage } from './i18n.js';
import { worldStatus } from './world-status.js';
import { SKELETON } from '../world/skeleton.js';
import { QUESTS } from '../quests/index.js';
import { currentDetour, clearDetour, needMapMessage } from './detours.js';
import { npcsHere, talkToInvented } from './improv-npcs.js';
import { findByName } from './improv.js';
import { questText } from '../quests/text/index.js';

const SOURCES = ['offered', 'customized', 'written'];
const now = () => new Date().toISOString();

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// The world is locked once onboarding is finished (setting and world complete) and the player
// has attempted a quest, so names never change mid-game. A stray attempt made before the world
// exists does not lock anything, so onboarding can always be finished.
function assertNotStarted(db, saveId) {
  const attempted = db.prepare('SELECT 1 FROM quest_attempts WHERE save_id = ? LIMIT 1').get(saveId);
  if (attempted && worldStatus(db, saveId).complete) {
    throw new Error('The game has started (a quest was attempted), so the world is locked.');
  }
}

// Collects problems for one text field: empty, wrong type, or banned AI-speak.
function checkText(problems, lang, label, value) {
  if (typeof value !== 'string' || !value.trim()) {
    problems.push(`${label} must not be empty.`);
    return;
  }
  const { hits } = lintVoice(value, lang);
  for (const hit of hits)
    problems.push(`${label} contains the banned phrase "${hit}". Rewrite it in the setting's voice.`);
}

export function setSetting(db, saveId, { source, name, description, voice }) {
  const lang = effectiveLanguage(db, saveId);
  const problems = [];
  if (!SOURCES.includes(source)) problems.push(`Unknown source "${source}". Use one of: ${SOURCES.join(', ')}.`);
  checkText(problems, lang, 'Setting name', name);
  checkText(problems, lang, 'Setting description', description);
  checkText(problems, lang, 'Setting voice', voice);
  if (problems.length) throw new Error(problems.join(' '));

  assertNotStarted(db, saveId);
  inTransaction(db, () => {
    db.prepare('DELETE FROM world_settings WHERE save_id = ?').run(saveId);
    db.prepare(
      'INSERT INTO world_settings (save_id, created_at, source, name, description, voice) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(saveId, now(), source, name.trim(), description.trim(), voice.trim());
  });
}

function checkSlots(problems, kind, given, wanted) {
  if (!isPlainObject(given)) {
    problems.push(`${kind}s must be an object keyed by slot (${wanted.join(', ')}).`);
    return false;
  }
  for (const slot of wanted) if (!isPlainObject(given[slot])) problems.push(`Missing ${kind} ${slot}.`);
  for (const slot of Object.keys(given)) if (!wanted.includes(slot)) problems.push(`Unknown ${kind} slot ${slot}.`);
  return true;
}

function checkUniqueNames(problems, kind, given) {
  const seen = new Map();
  for (const [slot, entry] of Object.entries(given)) {
    const name = typeof entry?.name === 'string' ? entry.name.trim().toLowerCase() : null;
    if (!name) continue;
    if (seen.has(name)) problems.push(`Duplicate ${kind} name "${entry.name}" (${seen.get(name)} and ${slot}).`);
    else seen.set(name, slot);
  }
}

// Stores the Master's whole world in one transaction. Nothing is written unless every slot is valid.
export function fillWorld(db, saveId, data) {
  const lang = effectiveLanguage(db, saveId);
  const locationSlots = SKELETON.locations.map((l) => l.slot);
  const npcSlots = SKELETON.npcs.map((n) => n.slot);
  const problems = [];

  const locations = isPlainObject(data) ? data.locations : undefined;
  const npcs = isPlainObject(data) ? data.npcs : undefined;
  const locationsOk = checkSlots(problems, 'location', locations, locationSlots);
  const npcsOk = checkSlots(problems, 'npc', npcs, npcSlots);

  if (locationsOk) {
    for (const slot of locationSlots) {
      if (!isPlainObject(locations[slot])) continue;
      checkText(problems, lang, `Location ${slot} name`, locations[slot].name);
      checkText(problems, lang, `Location ${slot} description`, locations[slot].description);
    }
    checkUniqueNames(problems, 'location', locations);
  }
  if (npcsOk) {
    for (const slot of npcSlots) {
      if (!isPlainObject(npcs[slot])) continue;
      checkText(problems, lang, `NPC ${slot} name`, npcs[slot].name);
      checkText(problems, lang, `NPC ${slot} description`, npcs[slot].description);
      checkText(problems, lang, `NPC ${slot} voice`, npcs[slot].voice);
    }
    checkUniqueNames(problems, 'npc', npcs);
  }
  if (problems.length) throw new Error(problems.join(' '));

  assertNotStarted(db, saveId);
  inTransaction(db, () => {
    db.prepare('DELETE FROM world_locations WHERE save_id = ?').run(saveId);
    db.prepare('DELETE FROM world_npcs WHERE save_id = ?').run(saveId);
    const insertLocation = db.prepare(
      'INSERT INTO world_locations (save_id, slot, name, description) VALUES (?, ?, ?, ?)',
    );
    for (const slot of locationSlots) {
      insertLocation.run(saveId, slot, locations[slot].name.trim(), locations[slot].description.trim());
    }
    const insertNpc = db.prepare(
      'INSERT INTO world_npcs (save_id, slot, name, description, voice) VALUES (?, ?, ?, ?, ?)',
    );
    for (const slot of npcSlots) {
      insertNpc.run(saveId, slot, npcs[slot].name.trim(), npcs[slot].description.trim(), npcs[slot].voice.trim());
    }
  });
  return { locations: locationSlots.length, npcs: npcSlots.length };
}

export { worldStatus };

// What the Master needs to recall the world's voice when a saved game is resumed.
export function getSetting(db, saveId) {
  const row = db.prepare('SELECT source, name, description, voice FROM world_settings WHERE save_id = ?').get(saveId);
  return row ? { source: row.source, name: row.name, description: row.description, voice: row.voice } : null;
}

// Everything below needs a hero and a finished world.
function requireReady(db, saveId) {
  const hero = getHero(db, saveId);
  if (!hero) throw new Error('No hero yet. Create one first.');
  const status = worldStatus(db, saveId);
  if (!status.complete) throw new Error(`The world is not ready yet (missing: ${status.missing.join(', ')}).`);
  return hero;
}

const locationRow = (db, saveId, slot) => {
  const row = db
    .prepare('SELECT slot, name, description FROM world_locations WHERE save_id = ? AND slot = ?')
    .get(saveId, slot);
  return { slot: row.slot, name: row.name, description: row.description };
};

const skeletonLocation = (slot) => SKELETON.locations.find((l) => l.slot === slot);

export function look(db, saveId) {
  const hero = requireReady(db, saveId);
  const here = skeletonLocation(hero.locationSlot);
  const npcNames = db.prepare('SELECT slot, name FROM world_npcs WHERE save_id = ?').all(saveId);
  const detour = currentDetour(db, saveId);
  return {
    location: locationRow(db, saveId, here.slot),
    // Off the map the real people are out of reach: they stand at the map place, not in the detour.
    detour: detour && { name: detour.name, description: detour.description, parent: detour.parent },
    // Invented people who stand where the hero stands, on the map place or in the detour.
    strangers: npcsHere(db, saveId).map((n) => ({ name: n.name })),
    exits: here.exits.map((slot) => {
      const row = locationRow(db, saveId, slot);
      return { slot, name: row.name };
    }),
    npcs: detour
      ? []
      : SKELETON.npcs
          .filter((n) => n.location === here.slot)
          .map((n) => ({ slot: n.slot, name: npcNames.find((r) => r.slot === n.slot).name })),
  };
}

// target is an exit slot (L2) or an exit name, case-insensitive.
export function go(db, saveId, target) {
  const hero = requireReady(db, saveId);
  const here = skeletonLocation(hero.locationSlot);
  const wanted = String(target ?? '')
    .trim()
    .toLowerCase();
  const exits = here.exits.map((slot) => locationRow(db, saveId, slot));
  const destination = wanted && exits.find((e) => e.slot.toLowerCase() === wanted || e.name.toLowerCase() === wanted);
  if (!destination) {
    const current = locationRow(db, saveId, here.slot);
    throw new Error(
      `"${target}" is not an exit from ${current.name}. Exits: ${exits.map((e) => `${e.slot} ${e.name}`).join(', ')}.`,
    );
  }
  // One unit: a crash between the two writes must not leave the hero at a new place inside an old detour.
  inTransaction(db, () => {
    db.prepare('UPDATE heroes SET location_slot = ? WHERE save_id = ?').run(destination.slot, saveId);
    // Walking on from a detour, at any depth, leaves all of them.
    clearDetour(db, saveId);
  });
  return { location: { slot: destination.slot, name: destination.name } };
}

// A quest giver offers the open, unsolved quests of their rung (see world/skeleton.js). `quests` is the registry;
// only tests pass another one, to stand in for a complete ladder.
export function talk(db, saveId, npcSlot, { quests = QUESTS } = {}) {
  const hero = requireReady(db, saveId);
  // The real people by slot or by their name, anyone else by the name the Master gave them.
  const raw = String(npcSlot ?? '').trim();
  const byName = findByName(db.prepare('SELECT slot, name FROM world_npcs WHERE save_id = ?').all(saveId), raw);
  const slotText = /^N[1-7]$/i.test(raw) ? raw.toUpperCase() : (byName?.slot ?? null);
  // Only N1 to N7 are slots: a person called N8 is invented, and is found by name.
  if (slotText === null) return talkToInvented(db, saveId, hero, raw);
  if (hero.detourId !== null) throw new Error(needMapMessage('the real people are out of reach'));
  const spot = SKELETON.npcs.find((n) => n.slot === slotText);
  if (!spot || spot.location !== hero.locationSlot) throw new Error(`${npcSlot} is not here.`);

  requireAwake(db, saveId, spot.slot);
  const npc = db
    .prepare('SELECT slot, name, description, voice FROM world_npcs WHERE save_id = ? AND slot = ?')
    .get(saveId, spot.slot);

  // The NPC offers the quests of their rung that are open and not solved yet: the first in play order as
  // `offer`, the others as `open`, so the Master can offer a choice.
  const lang = effectiveLanguage(db, saveId);
  const { open: openIds } = getProgress(db, saveId, quests);
  const here = quests.filter((q) => q.rung === spot.rung && openIds.includes(q.id));
  const textOf = (quest) => questText(quest.id, lang) ?? { title: quest.id, brief: '' };
  const offerOf = (quest) => ({ questId: quest.id, title: textOf(quest).title });
  const offer = here.length ? { ...offerOf(here[0]), brief: textOf(here[0]).brief } : null;
  const open = here.slice(1).map((quest) => ({ ...offerOf(quest), tier: quest.tier }));
  return { npc: { slot: npc.slot, name: npc.name, description: npc.description, voice: npc.voice }, offer, open };
}
