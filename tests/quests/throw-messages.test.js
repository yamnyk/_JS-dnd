import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrongThrow, wrongThrown } from '../../quests/messages.js';
import { t } from '../../game/i18n.js';

const render = (lang, part) => t(lang, part.key, part.params);

test('wrongThrow says what should be thrown and what happened, in both languages', () => {
  const none = wrongThrow('requirePositiveInt(0)', 'RangeError', undefined);
  assert.equal(none.pass, false);
  assert.equal(render('en', none.expected), 'requirePositiveInt(0) throws RangeError');
  assert.equal(render('en', none.got), 'requirePositiveInt(0) did not throw');
  assert.equal(render('uk', none.expected), '`requirePositiveInt(0)` кидає RangeError');
  assert.equal(render('uk', none.got), '`requirePositiveInt(0)` не кинула помилку');

  const other = wrongThrow('requirePositiveInt(0)', 'RangeError', 'TypeError');
  assert.equal(render('en', other.got), 'requirePositiveInt(0) threw TypeError');
  assert.equal(render('uk', other.got), '`requirePositiveInt(0)` кинула TypeError');
});

test('wrongThrown says a call that should give a value threw instead', () => {
  const result = wrongThrown('safeParse("nope", 1)', '1', 'SyntaxError');
  assert.equal(render('en', result.expected), 'safeParse("nope", 1) gives 1');
  assert.equal(render('en', result.got), 'safeParse("nope", 1) threw SyntaxError');
  assert.equal(render('uk', result.expected), '`safeParse("nope", 1)` дає 1');
  assert.equal(render('uk', result.got), '`safeParse("nope", 1)` кинула SyntaxError');
});
