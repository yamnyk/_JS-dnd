import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { MIGRATIONS } from '../../game/schema.js';
import { migrate, openGameDb } from '../../game/db.js';
import { createSave, createHero } from '../../game/hero.js';
import { grantItem } from '../../game/inventory.js';
import { freshDb } from './helpers.js';

const columns = (db, table) =>
  db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((c) => c.name);

test('migration 16 is the last one and adds the detour column, the three invention tables, and the rewards ledger', () => {
  assert.equal(MIGRATIONS.at(-1).version, 16);
  const db = freshDb();
  assert.ok(columns(db, 'heroes').includes('detour_id'));
  assert.deepEqual(columns(db, 'detours'), [
    'id',
    'save_id',
    'parent_id',
    'base_slot',
    'name',
    'description',
    'created_at',
  ]);
  assert.deepEqual(columns(db, 'improv_npcs'), [
    'id',
    'save_id',
    'base_slot',
    'detour_id',
    'name',
    'description',
    'voice',
    'created_at',
  ]);
  assert.deepEqual(columns(db, 'side_tasks'), [
    'id',
    'save_id',
    'detour_id',
    'npc_id',
    'kind',
    'title',
    'brief',
    'difficulty',
    'tests',
    'status',
    'created_at',
    'closed_at',
  ]);
  assert.deepEqual(columns(db, 'rewards'), [
    'id',
    'save_id',
    'kind',
    'amount',
    'item_name',
    'reason',
    'side_task_id',
    'created_at',
  ]);
});

test('names are unique per save and kind, ignoring case', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  const other = createSave(db, {});
  const place = (id, name) =>
    db
      .prepare(
        "INSERT INTO detours (save_id, base_slot, name, description, created_at) VALUES (?, 'L1', ?, 'd', 'now')",
      )
      .run(id, name);
  place(saveId, 'The Forest');
  assert.throws(() => place(saveId, 'the forest'));
  place(other, 'The Forest');
  const person = (id, name) =>
    db
      .prepare(
        "INSERT INTO improv_npcs (save_id, base_slot, name, description, voice, created_at) VALUES (?, 'L1', ?, 'd', 'v', 'now')",
      )
      .run(id, name);
  person(saveId, 'Smith');
  assert.throws(() => person(saveId, 'SMITH'));
  person(other, 'Smith');
});

test('the check constraints reject a bad task kind, a bad status, and a bad reward kind', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  const task = (kind, status) =>
    db
      .prepare(
        "INSERT INTO side_tasks (save_id, kind, title, brief, status, created_at) VALUES (?, ?, 't', 'b', ?, 'now')",
      )
      .run(saveId, kind, status);
  task('story', 'open');
  task('js', 'done');
  assert.throws(() => task('quest', 'open'));
  assert.throws(() => task('story', 'finished'));
  const reward = (kind) =>
    db.prepare("INSERT INTO rewards (save_id, kind, reason, created_at) VALUES (?, ?, 'r', 'now')").run(saveId, kind);
  reward('gold');
  reward('item');
  assert.throws(() => reward('honor'));
});

test('an item can have the source reward, and every older kind of item still works', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  grantItem(db, saveId, { source: 'quest', questId: 'dice-roll' });
  grantItem(db, saveId, { source: 'reward' });
  assert.throws(() => grantItem(db, saveId, { source: 'gift' }));
});

test('migration 16 keeps every item a save already had, with its name, source, and revoked mark', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jsdnd-m16-'));
  const path = join(dir, 'game.db');
  // A database as it was at migration 15: apply the first 15 migrations only.
  const raw = new DatabaseSync(path);
  raw.exec('PRAGMA foreign_keys = ON');
  raw.exec('CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  for (const m of MIGRATIONS.filter((x) => x.version <= 15)) {
    raw.exec(m.sql);
    raw.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(m.version, 'then');
  }
  raw.prepare("INSERT INTO saves (name, created_at) VALUES ('Save 1', 'then')").run();
  const insert = raw.prepare(
    'INSERT INTO inventory_items (save_id, name, source, quest_id, created_at, revoked_at) VALUES (1, ?, ?, ?, ?, ?)',
  );
  insert.run('Old coin', 'quest', 'dice-roll', 't1', null);
  insert.run(null, 'fight', null, 't2', 'gone');
  raw.close();

  const db = openGameDb(path);
  assert.equal(db.prepare('SELECT MAX(version) AS v FROM schema_migrations').get().v, 16);
  const items = db
    .prepare('SELECT id, name, source, quest_id, created_at, revoked_at FROM inventory_items ORDER BY id')
    .all()
    .map((row) => ({ ...row }));
  assert.deepEqual(items, [
    { id: 1, name: 'Old coin', source: 'quest', quest_id: 'dice-roll', created_at: 't1', revoked_at: null },
    { id: 2, name: null, source: 'fight', quest_id: null, created_at: 't2', revoked_at: 'gone' },
  ]);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
});

test('a hero starts on the map with no detour', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  createHero(db, saveId, { name: 'Bilbo', race: 'halfling', heroClass: 'rogue' });
  assert.equal(db.prepare('SELECT detour_id FROM heroes WHERE save_id = ?').get(saveId).detour_id, null);
  assert.doesNotThrow(() => migrate(db));
});
