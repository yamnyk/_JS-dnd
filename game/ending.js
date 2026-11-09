import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getProgress, defaultPlayerDir } from './quests.js';
import { QUESTS } from '../quests/index.js';
import { ladderStatus } from '../quests/curriculum.js';
import { collectStats } from './ending-stats.js';
import { renderPage } from './ending-page.js';
import { effectiveLanguage } from './i18n.js';

export const BOSS_SLOT = 'N7';

// The campaign ends when every quest is solved in the current epoch and the final boss was beaten
// after the latest tamper reset. A reset therefore locks the ending again.
// Why the final boss cannot be fought yet, or null when the way is open. The ladder must be complete first:
// the boss never opens just because the quests that happen to be built are all solved.
// `quests` is the registry. Only tests pass another one, to stand in for a complete ladder.
export function bossBlocker(db, saveId, quests = QUESTS) {
  if (!ladderStatus(quests).complete) return 'The way to the final boss is shut: the road ahead is still being built.';
  const { remaining } = getProgress(db, saveId, quests);
  if (!remaining.length) return null;
  const more = remaining.length > 5 ? `, and ${remaining.length - 5} more` : '';
  return `The way to the final boss is shut. Solve every quest first (left: ${remaining.slice(0, 5).join(', ')}${more}).`;
}

export function endingStatus(db, saveId, { quests = QUESTS } = {}) {
  const progress = getProgress(db, saveId, quests);
  const lastReset = db.prepare('SELECT MAX(created_at) AS at FROM resets WHERE save_id = ?').get(saveId).at;
  // The boss must fall after the latest solve of this epoch. A quest added or solved later reopens
  // the road, so the boss has to be beaten again.
  const lastSolve = db
    .prepare('SELECT MAX(solved_at) AS at FROM quest_solves WHERE save_id = ? AND epoch = ? AND revoked_at IS NULL')
    .get(saveId, progress.epoch).at;
  const bossDefeated = Boolean(
    db
      .prepare(
        "SELECT 1 FROM fights WHERE save_id = ? AND npc_slot = ? AND outcome = 'won' AND (? IS NULL OR ended_at > ?) AND (? IS NULL OR ended_at > ?) LIMIT 1",
      )
      .get(saveId, BOSS_SLOT, lastReset, lastReset, lastSolve, lastSolve),
  );
  const questsSolved = progress.solved.length;
  const ladderComplete = ladderStatus(quests).complete;
  return {
    questsSolved,
    questsTotal: progress.total,
    bossDefeated,
    ladderComplete,
    unlocked: ladderComplete && questsSolved === progress.total && bossDefeated,
  };
}

// Writes the stats page into the player folder. Refuses until the ending is unlocked.
export function buildEnding(db, saveId, { playerDir = defaultPlayerDir(), quests = QUESTS } = {}) {
  const status = endingStatus(db, saveId, { quests });
  if (!status.unlocked) {
    const left = [];
    if (!status.ladderComplete) left.push('the road ahead is still being built');
    if (status.questsSolved < status.questsTotal)
      left.push(`${status.questsTotal - status.questsSolved} quest(s) unsolved`);
    if (!status.bossDefeated) left.push('the final boss still stands');
    throw new Error(`The road is not over yet: ${left.join(' and ')}.`);
  }
  const stats = collectStats(db, saveId, { quests });
  mkdirSync(playerDir, { recursive: true });
  const file = join(playerDir, 'ending.html');
  writeFileSync(file, renderPage(stats, effectiveLanguage(db, saveId)));
  return { file, minutes: stats.minutes };
}
