// Usage: node dev/quest-tools/prove.mjs <quest-id> [<quest-id> ...]
// Proves quests/<id>.js against tests/quests/solutions/<id>.{reference,wrong,hardcoded}.js without the quest
// having to be in the registry yet: the reference must pass, the wrong and the hardcoded one must fail, and the
// wrong one must fail with a readable "got" and "expected". Exit 0 when every quest is proven, 1 otherwise.
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { runQuestCheck } = await import(pathToFileURL(join(root, 'game', 'quest-runner.js')).href);
let failed = false;

for (const id of process.argv.slice(2)) {
  const questFile = join(root, 'quests', `${id}.js`);
  const solution = (kind) => join(root, 'tests', 'quests', 'solutions', `${id}.${kind}.js`);
  const missing = [questFile, solution('reference'), solution('wrong'), solution('hardcoded')].filter(
    (f) => !existsSync(f),
  );
  if (missing.length) {
    console.log(`${id}: cannot prove, missing ${missing.map((f) => f.slice(root.length + 1)).join(', ')}`);
    failed = true;
    continue;
  }
  const registry = join(mkdtempSync(join(tmpdir(), 'jsdnd-prove-')), 'index.js');
  writeFileSync(
    registry,
    `import quest from ${JSON.stringify(pathToFileURL(questFile).href)};\n` +
      `export const getQuest = (id) => (id === quest.id ? quest : undefined);\n`,
  );
  const run = (kind) => runQuestCheck(id, solution(kind), { timeoutMs: 15000, questsModule: registry });
  const reference = run('reference');
  const wrong = run('wrong');
  const hardcoded = run('hardcoded');
  const okRef = reference.status === 'pass';
  const okWrong = wrong.status === 'fail' && wrong.got && wrong.expected && wrong.got !== wrong.expected;
  const okHard = hardcoded.status === 'fail';
  console.log(`${id}: reference ${reference.status}${okRef ? '' : ` <-- MUST PASS: ${JSON.stringify(reference)}`}`);
  console.log(
    `${id}: wrong ${wrong.status}${okWrong ? '' : ` <-- MUST FAIL WITH got AND expected: ${JSON.stringify(wrong)}`}`,
  );
  console.log(`${id}: hardcoded ${hardcoded.status}${okHard ? '' : ` <-- MUST FAIL: ${JSON.stringify(hardcoded)}`}`);
  console.log(`${id}: sample failure -> expected: ${wrong.expected} | got: ${wrong.got}`);
  if (!(okRef && okWrong && okHard)) failed = true;
}
process.exit(failed ? 1 : 0);
