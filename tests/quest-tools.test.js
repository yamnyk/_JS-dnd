import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const prove = join(root, 'dev', 'quest-tools', 'prove.mjs');
const assemble = join(root, 'dev', 'quest-tools', 'assemble.cjs');

test('prove.mjs proves a registered quest: reference passes, wrong and hardcoded fail, exit 0', () => {
  const result = spawnSync('node', [prove, 'string-shout'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /string-shout: reference pass/);
  assert.match(result.stdout, /string-shout: wrong fail/);
  assert.match(result.stdout, /string-shout: hardcoded fail/);
});

test('prove.mjs exits 1 and says why when a quest has no solution files', () => {
  const result = spawnSync('node', [prove, 'no-such-quest'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stdout + result.stderr, /no-such-quest/);
});

// The assembler appends fragment entries to quests/text/<lang>.js. Tests point it at a copy.
function sandbox() {
  const dir = mkdtempSync(join(tmpdir(), 'jsdnd-assemble-'));
  cpSync(join(root, 'quests', 'text'), join(dir, 'quests', 'text'), { recursive: true });
  const fragment = join(dir, 'fragment.cjs');
  writeFileSync(
    fragment,
    `module.exports = { 'demo-quest': { title: 'Demo', brief: 'Write demo().', stub: '// Quest: demo.\\nexport function demo() {\\n  // your code here\\n}\\n', expected: ['\`demo()\` gives \`1\`', '\`demo()\` gives \`1\`'], specific: ['One line.'] } };\n`,
  );
  const run = (...args) =>
    spawnSync('node', [assemble, ...args], { encoding: 'utf8', env: { ...process.env, QUEST_TOOLS_ROOT: dir } });
  return { dir, fragment, run };
}

test('assemble.cjs appends a fragment entry to the catalog, and a second run adds nothing', () => {
  const { dir, fragment, run } = sandbox();
  const first = run('en', fragment);
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /added 1 entries/);
  const text = readFileSync(join(dir, 'quests', 'text', 'en.js'), 'utf8');
  assert.match(text, /'demo-quest': \{/);
  assert.match(text, /stub: `\/\/ Quest: demo\./);
  const second = run('en', fragment);
  assert.match(second.stdout, /added 0 entries/);
});

test('assemble.cjs refuses an unknown language and a fragment missing a field', () => {
  const { dir, fragment, run } = sandbox();
  assert.notEqual(run('de', fragment).status, 0);
  const broken = join(dir, 'broken.cjs');
  writeFileSync(broken, "module.exports = { 'half-quest': { title: 'x' } };\n");
  const result = run('en', broken);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /half-quest has no brief/);
});
