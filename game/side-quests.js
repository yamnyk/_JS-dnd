import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inTransaction } from './db.js';
import { runMoveTests, validateMoveProblem } from './move-runner.js';
import { defaultPlayerDir } from './quests.js';
import { effectiveLanguage, t } from './i18n.js';
import { LIMITS, checkText } from './improv.js';
import { requireReady, resolveGiver, assertTaskRoom, rawTask, shapeTask } from './side-tasks.js';

// JS side quests: a small problem the Master has written (through the side-smith subagent) for an errand,
// checked by the same hidden-test runner the advanced moves use. A pass closes the side quest and nothing
// else: it is not a ladder quest, so it never opens a rung, and what it pays is the Master's call through the
// reward commands. This module runs the player's code, so the resume state and the play hook never import it.
const now = () => new Date().toISOString();
const comment = (text) =>
  text
    .split('\n')
    .map((line) => `// ${line}`.trimEnd())
    .join('\n');

// Everything that can be refused without running the reference solution. It reads only, so it runs again
// under the write lock before anything is stored.
function precheck(db, saveId, problem) {
  const hero = requireReady(db, saveId);
  const lang = effectiveLanguage(db, saveId);
  return {
    hero,
    lang,
    title: checkText('Title', problem.title, LIMITS.title, lang),
    brief: checkText('Brief', problem.brief, LIMITS.brief, lang),
    npcId: resolveGiver(db, saveId, problem.giver),
  };
}

// The Master proposes a problem for an errand. Nothing is stored unless the problem's own reference
// solution passes its own tests. The tests stay in the DB, hidden from the player.
export function proposeSideQuest(db, saveId, problem, { playerDir = defaultPlayerDir(), timeoutMs } = {}) {
  if (problem === null || typeof problem !== 'object' || Array.isArray(problem)) {
    throw new Error(validateMoveProblem(problem).errors.join(' '));
  }
  // Cheap checks first, so a pointless proposal never runs the reference solution.
  precheck(db, saveId, problem);
  assertTaskRoom(db, saveId);
  const check = validateMoveProblem(problem, timeoutMs ? { timeoutMs } : undefined);
  if (!check.ok) throw new Error(check.errors.join(' '));

  // The row and the stub are one unit: if the file cannot be written the row is rolled back, and
  // a file the player already has under that name is kept as side-<id>.old.js, never overwritten.
  return inTransaction(db, () => {
    const { hero, lang, title, brief, npcId } = precheck(db, saveId, problem);
    assertTaskRoom(db, saveId);
    const taskId = Number(
      db
        .prepare(
          `INSERT INTO side_tasks (save_id, detour_id, npc_id, kind, title, brief, difficulty, tests, status, created_at)
           VALUES (?, ?, ?, 'js', ?, ?, ?, ?, 'open', ?)`,
        )
        .run(saveId, hero.detourId, npcId, title, brief, problem.difficulty, JSON.stringify(problem.tests), now())
        .lastInsertRowid,
    );
    mkdirSync(playerDir, { recursive: true });
    const file = join(playerDir, `side-${taskId}.js`);
    const temp = `${file}.tmp`;
    writeFileSync(
      temp,
      `${comment(t(lang, 'side.stub.title', { title }))}\n${comment(brief)}\n${comment(t(lang, 'move.stub.export'))}\nexport function solve() {\n  ${comment(t(lang, 'move.stub.code'))}\n}\n`,
    );
    if (existsSync(file)) renameSync(file, join(playerDir, `side-${taskId}.old.js`));
    renameSync(temp, file);
    return { taskId, file, title, brief };
  });
}

// Runs the player's solve() against the hidden tests. A pass closes the side quest as done; anything else
// (wrong, error, timeout, missing file) leaves it open for another try.
export function checkSideQuest(db, saveId, taskId, { playerDir = defaultPlayerDir(), timeoutMs } = {}) {
  const readTask = () => {
    const row = rawTask(db, saveId, taskId);
    if (!row) throw new Error(`No side task ${taskId} in this save.`);
    if (row.kind !== 'js') {
      throw new Error(
        `Side task ${taskId} is a story task, so it has no code to check. Close it with: node game/cli.js side done ${taskId}.`,
      );
    }
    if (row.status !== 'open') throw new Error(`Side task ${taskId} is not open (it is ${row.status}).`);
    return row;
  };

  // The player's code can run for seconds, so it runs outside the lock. The task is read again under the
  // lock before anything is applied, so two checks at once cannot both count.
  const tests = JSON.parse(readTask().tests);
  const check = runMoveTests(join(playerDir, `side-${taskId}.js`), tests, {
    ...(timeoutMs ? { timeoutMs } : {}),
    lang: effectiveLanguage(db, saveId),
  });
  if (check.status !== 'pass') return { taskStatus: 'open', check, task: shapeTask(rawTask(db, saveId, taskId)) };
  return inTransaction(db, () => {
    readTask();
    db.prepare("UPDATE side_tasks SET status = 'done', closed_at = ? WHERE id = ?").run(now(), taskId);
    return { taskStatus: 'done', check, task: shapeTask(rawTask(db, saveId, taskId)) };
  });
}
