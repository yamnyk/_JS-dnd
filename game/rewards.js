import { inTransaction } from './db.js';
import { getHero } from './hero.js';
import { effectiveLanguage } from './i18n.js';
import { addGold } from './vitals.js';
import { grantItem, nameItem } from './inventory.js';
import { checkName, checkText } from './improv.js';

// Gold and items the Master hands out for things the scripts do not own (an errand, a thank you, a find).
// What to give is the Master's call. The scripts only keep the numbers sane and write every grant to a ledger
// with its reason. This module imports nothing that depends on the sealed dice files.
// The bound is for safety, not balance: it keeps the gold figure something the bar can show.
export const MAX_GOLD_GRANT = 1_000_000;
const MAX_REASON = 200;
const now = () => new Date().toISOString();

function requireHero(db, saveId) {
  if (!getHero(db, saveId)) throw new Error('No hero yet. Create one first.');
}

// A side task the reward belongs to must exist, and belong to this save.
function checkTask(db, saveId, taskId) {
  if (taskId === undefined || taskId === null) return null;
  const row = Number.isSafeInteger(taskId)
    ? db.prepare('SELECT id FROM side_tasks WHERE id = ? AND save_id = ?').get(taskId, saveId)
    : undefined;
  if (!row) throw new Error(`No side task ${taskId} in this save.`);
  return row.id;
}

const shape = (row) => ({
  id: row.id,
  kind: row.kind,
  amount: row.amount,
  itemName: row.item_name,
  reason: row.reason,
  sideTaskId: row.side_task_id,
  createdAt: row.created_at,
});

export function listRewards(db, saveId) {
  return db.prepare('SELECT * FROM rewards WHERE save_id = ? ORDER BY id').all(saveId).map(shape);
}

export function grantGold(db, saveId, { amount, reason, taskId } = {}) {
  return inTransaction(db, () => {
    requireHero(db, saveId);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_GOLD_GRANT) {
      throw new Error(`Gold must be a whole number from 1 to ${MAX_GOLD_GRANT}.`);
    }
    const why = checkText('Reason', reason, MAX_REASON, effectiveLanguage(db, saveId));
    const task = checkTask(db, saveId, taskId);
    const gold = addGold(db, saveId, amount);
    const id = Number(
      db
        .prepare(
          'INSERT INTO rewards (save_id, kind, amount, reason, side_task_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(saveId, 'gold', amount, why, task, now()).lastInsertRowid,
    );
    return { gold, reward: shape(db.prepare('SELECT * FROM rewards WHERE id = ?').get(id)) };
  });
}

export function grantRewardItem(db, saveId, { name, reason, taskId } = {}) {
  return inTransaction(db, () => {
    requireHero(db, saveId);
    const lang = effectiveLanguage(db, saveId);
    const clean = checkName(name, lang, 'Item name');
    const why = checkText('Reason', reason, MAX_REASON, lang);
    const task = checkTask(db, saveId, taskId);
    const itemId = grantItem(db, saveId, { source: 'reward' });
    nameItem(db, saveId, itemId, clean);
    const id = Number(
      db
        .prepare(
          'INSERT INTO rewards (save_id, kind, item_name, reason, side_task_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run(saveId, 'item', clean, why, task, now()).lastInsertRowid,
    );
    return {
      item: { id: itemId, name: clean, source: 'reward' },
      reward: shape(db.prepare('SELECT * FROM rewards WHERE id = ?').get(id)),
    };
  });
}
