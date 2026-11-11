import { join } from 'node:path';
import { inTransaction } from './db.js';
import { getHero } from './hero.js';
import { worldStatus } from './world-status.js';
import { effectiveLanguage } from './i18n.js';
import { LIMITS, checkText, findByName } from './improv.js';
import { defaultPlayerDir } from './quests.js';

// Errands the Master makes up: story tasks, which have no verdict (the Master closes them when the story
// says they are done). They are never quests: they do not open a rung, count toward the ladder, or unlock
// the ending. A task stands where the hero stood when it was made (a detour, or the map), and may name the
// invented person who gave it. This module imports nothing that depends on the sealed dice files, so the
// resume state and the play hook can read it.
const now = () => new Date().toISOString();
const RESUME_CAP = 5;

export function requireReady(db, saveId) {
  const hero = getHero(db, saveId);
  if (!hero) throw new Error('No hero yet. Create one first.');
  const status = worldStatus(db, saveId);
  if (!status.complete) throw new Error(`The world is not ready yet (missing: ${status.missing.join(', ')}).`);
  return hero;
}

const select = `SELECT t.*, d.name AS place_name, n.name AS giver_name FROM side_tasks t
  LEFT JOIN detours d ON d.id = t.detour_id
  LEFT JOIN improv_npcs n ON n.id = t.npc_id`;

// A JS side quest is written to a file the player edits. Its path is derived, so it is always the one in use now.
const sideFile = (id) => join(defaultPlayerDir(), `side-${id}.js`);

export const shapeTask = (row) => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  brief: row.brief,
  status: row.status,
  place: row.place_name ?? null,
  giver: row.giver_name ?? null,
  ...(row.kind === 'js' ? { file: sideFile(row.id) } : {}),
  createdAt: row.created_at,
  closedAt: row.closed_at,
});

// What resume and the Master read: no status or times, those are always "open" and never matter.
const slim = ({ id, kind, title, brief, place, giver, file }) => ({
  id,
  kind,
  title,
  brief,
  place,
  giver,
  ...(file ? { file } : {}),
});

export const rawTask = (db, saveId, id) =>
  Number.isSafeInteger(id) ? db.prepare(`${select} WHERE t.id = ? AND t.save_id = ?`).get(id, saveId) : undefined;

export function listTasks(db, saveId, { all = false } = {}) {
  return db
    .prepare(`${select} WHERE t.save_id = ? ${all ? '' : "AND t.status = 'open'"} ORDER BY t.id`)
    .all(saveId)
    .map(shapeTask);
}

// The open tasks standing in a detour, for `detour show`.
export const tasksInDetour = (db, saveId, detourId) =>
  db
    .prepare(`${select} WHERE t.save_id = ? AND t.detour_id = ? AND t.status = 'open' ORDER BY t.id`)
    .all(saveId, detourId)
    .map((row) => slim(shapeTask(row)));

// The open tasks an invented person gave, for `talk`.
export const tasksOfNpc = (db, saveId, npcId) =>
  db
    .prepare(`${select} WHERE t.save_id = ? AND t.npc_id = ? AND t.status = 'open' ORDER BY t.id`)
    .all(saveId, npcId)
    .map((row) => slim(shapeTask(row)));

// The real count of open tasks and the newest few, so resume stays small after a long game.
export function openTasksSummary(db, saveId, cap = RESUME_CAP) {
  const open = listTasks(db, saveId);
  return { open: open.length, items: open.slice(-cap).map(slim) };
}

// The invented person who gave a task, by name. Null when nobody did.
export function resolveGiver(db, saveId, giver) {
  if (giver === undefined || giver === null) return null;
  const npc = findByName(
    db.prepare('SELECT id, name FROM improv_npcs WHERE save_id = ?').all(saveId),
    String(giver).trim(),
  );
  if (!npc) {
    throw new Error(
      `Nobody called "${giver}" has been invented. Make them first: node game/cli.js npc invent "<name>" "<description>" "<voice>".`,
    );
  }
  return npc.id;
}

// The cap is on open tasks: finished and dropped ones stay as history and do not use up the room.
export function assertTaskRoom(db, saveId) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM side_tasks WHERE save_id = ? AND status = 'open'").get(saveId);
  if (n >= LIMITS.tasks) throw new Error(`A save holds at most ${LIMITS.tasks} open tasks, and this one has ${n}.`);
}

export function addStoryTask(db, saveId, { title, brief, giver } = {}) {
  return inTransaction(db, () => {
    const hero = requireReady(db, saveId);
    const lang = effectiveLanguage(db, saveId);
    const cleanTitle = checkText('Title', title, LIMITS.title, lang);
    const cleanBrief = checkText('Brief', brief, LIMITS.brief, lang);
    const npcId = resolveGiver(db, saveId, giver);
    assertTaskRoom(db, saveId);
    const id = Number(
      db
        .prepare(
          `INSERT INTO side_tasks (save_id, detour_id, npc_id, kind, title, brief, status, created_at)
           VALUES (?, ?, ?, 'story', ?, ?, 'open', ?)`,
        )
        .run(saveId, hero.detourId, npcId, cleanTitle, cleanBrief, now()).lastInsertRowid,
    );
    return { task: shapeTask(rawTask(db, saveId, id)) };
  });
}

function close(db, saveId, id, status) {
  const row = rawTask(db, saveId, id);
  if (!row) throw new Error(`No side task ${id} in this save.`);
  if (row.status !== 'open') throw new Error(`Side task ${id} is not open (it is ${row.status}).`);
  if (status === 'done' && row.kind !== 'story') {
    throw new Error(
      `Side task ${id} is a JS side quest. It closes only when its code passes: node game/cli.js side check ${id}.`,
    );
  }
  db.prepare('UPDATE side_tasks SET status = ?, closed_at = ? WHERE id = ?').run(status, now(), id);
  return { task: shapeTask(rawTask(db, saveId, id)) };
}

export const finishTask = (db, saveId, id) => inTransaction(db, () => close(db, saveId, id, 'done'));
export const dropTask = (db, saveId, id) => inTransaction(db, () => close(db, saveId, id, 'dropped'));
