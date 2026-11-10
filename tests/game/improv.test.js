import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, checkName, checkText, assertRoom } from '../../game/improv.js';
import { createSave } from '../../game/hero.js';
import { freshDb } from './helpers.js';

const ZERO_WIDTH = String.fromCharCode(0x200b);
const NBSP = String.fromCharCode(0xa0);
const BOM = String.fromCharCode(0xfeff);
const RTL = String.fromCharCode(0x202e);

test('the limits are 50 of each kind, names of 60, texts of 400, voices of 200', () => {
  assert.deepEqual(LIMITS, {
    places: 50,
    people: 50,
    tasks: 50,
    name: 60,
    description: 400,
    voice: 200,
    title: 60,
    brief: 400,
  });
});

test('a good name is trimmed and returned, in either language', () => {
  assert.equal(checkName('  The Whispering Forest  ', 'en'), 'The Whispering Forest');
  assert.equal(checkName('Шепітливий ліс', 'uk'), 'Шепітливий ліс');
  assert.equal(checkName("Smith's Forge", 'en'), "Smith's Forge");
});

test('hostile names are refused, each with a reason the Master can relay', () => {
  const bad = [
    ['', /empty/i],
    ['   ', /empty/i],
    [undefined, /text/i],
    [42, /text/i],
    ['x'.repeat(61), /at most 60/i],
    [`Fo${ZERO_WIDTH}rest`, /invisible|control/i],
    [`Forest${BOM}`, /invisible|control/i],
    [`Forest${RTL}`, /invisible|control/i],
    [`Dark${NBSP}Forest`, /spaces/i],
    ['Dark\tForest', /spaces|control/i],
    ['Dark\nForest', /spaces|control/i],
    ['Dark  Forest', /spaces/i],
    ['L1', /map/i],
    ['l3', /map/i],
    [' N7 ', /map/i],
    ['Ｌ３', /map/i],
    ['n７', /map/i],
  ];
  for (const [name, reason] of bad) assert.throws(() => checkName(name, 'en'), reason, JSON.stringify(name));
});

test('names that only look like a slot are fine, and the longest allowed name passes', () => {
  assert.equal(checkName('L10', 'en'), 'L10');
  assert.equal(checkName('The L1 Gate', 'en'), 'The L1 Gate');
  assert.equal(checkName('N77', 'en'), 'N77');
  assert.equal(checkName('x'.repeat(60), 'en').length, 60);
});

test('a banned phrase is refused in a name and in a text, in the language of the save', () => {
  assert.throws(() => checkName('As an AI language model', 'en'), /banned phrase/i);
  assert.throws(() => checkName('Меч, як штучний інтелект', 'uk'), /banned phrase/i);
  assert.throws(
    () => checkText('Description', 'Great question, traveller.', LIMITS.description, 'en'),
    /banned phrase/i,
  );
});

test('a text must be filled, short enough, and free of control and invisible characters, but may have new lines', () => {
  assert.equal(
    checkText('Description', '  Tall pines.\nA cold wind.  ', LIMITS.description, 'en'),
    'Tall pines.\nA cold wind.',
  );
  assert.throws(() => checkText('Description', '', 400, 'en'), /empty/i);
  assert.throws(() => checkText('Description', 'x'.repeat(401), 400, 'en'), /at most 400/i);
  assert.throws(() => checkText('Voice', 'x'.repeat(201), LIMITS.voice, 'en'), /at most 200/i);
  assert.throws(() => checkText('Description', `a${ZERO_WIDTH}b`, 400, 'en'), /invisible|control/i);
  assert.throws(() => checkText('Description', 'a\u0007b', 400, 'en'), /invisible|control/i);
  assert.throws(() => checkText('Description', null, 400, 'en'), /text/i);
});

test('the error names what was wrong, so the Master can fix that one thing', () => {
  assert.throws(() => checkText('Voice', '', 200, 'en'), /Voice/);
  assert.throws(() => checkName('', 'en', 'Place name'), /Place name/);
});

test('assertRoom allows the 50th and refuses the 51st of a kind, per save', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  const other = createSave(db, {});
  const add = (id, n) =>
    db
      .prepare(
        "INSERT INTO detours (save_id, base_slot, name, description, created_at) VALUES (?, 'L1', ?, 'd', 'now')",
      )
      .run(id, `Place ${n}`);
  for (let n = 1; n <= 49; n++) add(saveId, n);
  assert.doesNotThrow(() => assertRoom(db, saveId, 'detours', LIMITS.places, 'places'));
  add(saveId, 50);
  assert.throws(() => assertRoom(db, saveId, 'detours', LIMITS.places, 'places'), /at most 50 places/i);
  assert.doesNotThrow(() => assertRoom(db, other, 'detours', LIMITS.places, 'places'));
});

test('assertRoom only accepts the three table names it knows', () => {
  const db = freshDb();
  const saveId = createSave(db, {});
  assert.throws(() => assertRoom(db, saveId, 'heroes; DROP TABLE saves', 5, 'x'), /unknown table/i);
});
