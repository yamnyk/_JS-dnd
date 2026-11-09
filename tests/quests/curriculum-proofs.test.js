import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUESTS } from '../../quests/index.js';
import { questText } from '../../quests/text/index.js';
import { runQuestCheck } from '../../game/quest-runner.js';

// Every quest in the registry has to prove itself here. A quest without these proofs is not built:
// a reference solution passes, a wrong one fails with a readable message, a hardcoded one fails, and the
// text exists in both languages. Adding a quest to the registry adds its tests to this file by itself.
const solutions = join(resolve(dirname(fileURLToPath(import.meta.url))), 'solutions');
const solution = (id, kind) => join(solutions, `${id}.${kind}.js`);
const dashes = [String.fromCharCode(0x2013), String.fromCharCode(0x2014)];

const codeOf = (stub) =>
  stub
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('//'))
    .join('\n');

describe('every quest proves itself', { concurrency: 8 }, () => {
  for (const quest of QUESTS) {
    describe(quest.id, () => {
      it('has its three solution files', () => {
        for (const kind of ['reference', 'wrong', 'hardcoded']) {
          assert.ok(existsSync(solution(quest.id, kind)), `${quest.id}.${kind}.js is missing`);
        }
      });

      it('passes with the reference solution', () => {
        const result = runQuestCheck(quest.id, solution(quest.id, 'reference'), { timeoutMs: 15000 });
        assert.equal(result.status, 'pass', `${result.message} | got ${result.got} | expected ${result.expected}`);
      });

      it('fails a wrong solution and says what it got and what it expected', () => {
        const result = runQuestCheck(quest.id, solution(quest.id, 'wrong'), { timeoutMs: 15000 });
        assert.equal(result.status, 'fail', result.message);
        assert.ok(result.expected.length > 0 && result.got.length > 0);
        assert.notEqual(result.got, result.expected);
        assert.doesNotMatch(`${result.got}${result.expected}${result.message}`, /\{\w+\}/, 'a raw placeholder leaked');
      });

      it('fails a hardcoded solution', () => {
        const result = runQuestCheck(quest.id, solution(quest.id, 'hardcoded'), { timeoutMs: 15000 });
        assert.equal(result.status, 'fail', result.message);
      });

      it('has complete English and Ukrainian text with the same code in the starter file', () => {
        const english = questText(quest.id, 'en');
        const ukrainian = questText(quest.id, 'uk');
        for (const text of [english, ukrainian]) {
          assert.ok(text.title.trim() && text.brief.trim());
          assert.match(text.stub, /export /);
          assert.ok(Array.isArray(text.specific) && text.specific.every((line) => line.trim()));
          assert.ok(text.expected.length >= 2 && text.expected.length <= 4);
          for (const field of [text.title, text.brief, text.stub, ...text.specific, ...text.expected]) {
            for (const dash of dashes) assert.ok(!field.includes(dash), `${quest.id}: a long dash in ${field}`);
          }
        }
        assert.equal(codeOf(ukrainian.stub), codeOf(english.stub), `${quest.id}: the starter code differs`);
        assert.match(ukrainian.title + ukrainian.brief, /\p{Script=Cyrillic}/u, `${quest.id} has no Ukrainian`);
        assert.equal(
          english.expected.length,
          ukrainian.expected.length,
          `${quest.id}: expected examples differ in number`,
        );
      });
    });
  }
});

describe('the solution folder', () => {
  it('holds only the three files of a registered quest, so nothing is left behind', () => {
    const ids = new Set(QUESTS.map((q) => q.id));
    for (const file of readdirSync(solutions)) {
      const match = /^(.+)\.(reference|wrong|hardcoded)\.js$/.exec(file);
      assert.ok(match, `${file} does not look like a solution file`);
      assert.ok(ids.has(match[1]), `${file} belongs to no registered quest`);
    }
  });
});
