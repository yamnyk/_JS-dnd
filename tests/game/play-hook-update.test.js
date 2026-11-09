import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openGameDb } from '../../game/db.js';
import { createSave } from '../../game/hero.js';
import { setLanguage } from '../../game/i18n.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'tester',
  GIT_AUTHOR_EMAIL: 'tester@example.test',
  GIT_COMMITTER_NAME: 'tester',
  GIT_COMMITTER_EMAIL: 'tester@example.test',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_SYSTEM: '/dev/null',
  GIT_TERMINAL_PROMPT: '0',
  // The tests of the check itself must not inherit the switch that turns it off.
  JSDND_SKIP_UPDATE_CHECK: undefined,
};
const git = (cwd, ...args) => {
  const result = spawnSync('git', args, { cwd, env: GIT_ENV, encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
};

// A bare remote, a clone with a copy of the game committed in it (the player's folder), and a second clone
// that the "author" pushes new commits from. The hook runs from the player's folder.
function setup({ language = null } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'jsdnd-update-'));
  const remote = join(base, 'remote.git');
  const work = join(base, 'work');
  const other = join(base, 'other');
  git(base, 'init', '--bare', '-b', 'main', remote);
  git(base, 'clone', '-q', remote, work);
  git(work, 'checkout', '-q', '-b', 'main');
  for (const part of ['game', 'quests', 'world', 'package.json'])
    cpSync(join(root, part), join(work, part), { recursive: true });
  git(work, 'add', '-A');
  git(work, 'commit', '-q', '-m', 'game');
  git(work, 'push', '-q', '-u', 'origin', 'main');
  git(base, 'clone', '-q', remote, other);

  const dbPath = join(base, 'game.db');
  const db = openGameDb(dbPath);
  const saveId = createSave(db, { name: 'Save 1' });
  if (language) setLanguage(db, saveId, language);
  db.close();

  const hook = (prompt, session = 'game') =>
    spawnSync('node', [join(work, 'game', 'play-hook.js')], {
      cwd: work,
      env: { ...GIT_ENV, JSDND_GAME_DB: dbPath },
      encoding: 'utf8',
      input: JSON.stringify({ session_id: session, hook_event_name: 'UserPromptSubmit', prompt }),
    });
  // The author pushes `count` new commits.
  const publish = (count = 1) => {
    git(other, 'pull', '-q');
    for (let i = 0; i < count; i++) {
      writeFileSync(join(other, `news-${Date.now()}-${i}.txt`), `news ${i}\n`);
      git(other, 'add', '-A');
      git(other, 'commit', '-q', '-m', `news ${i}`);
    }
    git(other, 'push', '-q', 'origin', 'main');
  };
  return { base, remote, work, other, hook, publish };
}

const play = '/play';

test('a player who starts /play while the remote has new commits is blocked and told to pull', () => {
  const { hook, publish } = setup();
  publish(2);
  const result = hook(play);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /git pull/);
  assert.match(result.stderr, /\/play/);
  assert.match(result.stderr, /2 new commits/);
  assert.equal(result.stdout, '');
});

test('one new commit is told in the singular', () => {
  const { hook, publish } = setup();
  publish(1);
  assert.match(hook(play).stderr, /1 new commit\b(?!s)/);
});

test('the block stays on every later prompt of that session until the player has pulled, then it lifts', () => {
  const { hook, publish, work } = setup();
  publish(1);
  assert.equal(hook(play).status, 2);
  assert.equal(hook('I walk to the market').status, 2);
  git(work, 'pull', '-q');
  const after = hook('I walk to the market');
  assert.equal(after.status, 0, after.stderr);
  assert.equal(hook(play, 'second-session').status, 0);
});

test('a player who is up to date is not blocked and no message is printed', () => {
  const { hook } = setup();
  const result = hook(play);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('a session that never typed /play is never checked, even when the remote is ahead', () => {
  const { hook, publish } = setup();
  publish(3);
  const result = hook('fix the failing tests', 'dev-session');
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
});

test('a player with commits of their own that are not pushed is not blocked', () => {
  const { hook, work } = setup();
  writeFileSync(join(work, 'mine.txt'), 'mine\n');
  git(work, 'add', '-A');
  git(work, 'commit', '-q', '-m', 'mine');
  assert.equal(hook(play).status, 0);
});

test('a diverged branch (their commit and a new remote commit) is not blocked, because a pull could not fast-forward', () => {
  const { hook, work, publish } = setup();
  writeFileSync(join(work, 'mine.txt'), 'mine\n');
  git(work, 'add', '-A');
  git(work, 'commit', '-q', '-m', 'mine');
  publish(1);
  const result = hook(play);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('edited tracked files are not blocked, and the working tree is never touched by the hook', () => {
  const { hook, work, publish } = setup();
  publish(1);
  writeFileSync(join(work, 'package.json'), '{"edited":true}\n');
  const before = git(work, 'status', '--porcelain');
  const result = hook(play);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(work, 'status', '--porcelain'), before);
});

test('the hook never pulls: after a blocked prompt the player is still on the old commit', () => {
  const { hook, work, publish } = setup();
  const head = git(work, 'rev-parse', 'HEAD');
  publish(1);
  assert.equal(hook(play).status, 2);
  assert.equal(git(work, 'rev-parse', 'HEAD'), head);
});

test('a branch with no upstream, a detached HEAD, and a folder that is not a git repo are never blocked', () => {
  const noUpstream = setup();
  noUpstream.publish(1);
  git(noUpstream.work, 'branch', '--unset-upstream');
  assert.equal(noUpstream.hook(play).status, 0);

  const detached = setup();
  detached.publish(1);
  git(detached.work, 'checkout', '-q', '--detach');
  assert.equal(detached.hook(play).status, 0);

  const plain = setup();
  plain.publish(1);
  rmSync(join(plain.work, '.git'), { recursive: true, force: true });
  const result = plain.hook(play);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('an unreachable remote does not block and does not make the prompt wait', () => {
  const { hook, work } = setup();
  git(work, 'remote', 'set-url', 'origin', '/nonexistent/path/remote.git');
  const started = Date.now();
  const result = hook(play);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(Date.now() - started < 8000, 'the hook waited too long');
});

test('the message is Ukrainian for a Ukrainian save, with the right plural', () => {
  const { hook, publish } = setup({ language: 'uk' });
  publish(2);
  const result = hook(play);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /git pull/);
  assert.match(result.stderr, /2 нові зміни/);
  assert.doesNotMatch(result.stderr, /new commits/);
  const many = setup({ language: 'uk' });
  many.publish(5);
  assert.match(many.hook(play).stderr, /5 нових змін/);
});

test('the hook still exits 0 and prints nothing when the remote is ahead but the database is missing', () => {
  const { hook, publish, base } = setup();
  publish(1);
  rmSync(join(base, 'game.db'), { force: true });
  const result = hook('hello', 'no-such-session');
  assert.equal(result.status, 0);
});

test('JSDND_SKIP_UPDATE_CHECK=1 turns the check off for developers and tests, and nothing else does', () => {
  const { work, publish, base } = setup();
  publish(1);
  const run = (extra) =>
    spawnSync('node', [join(work, 'game', 'play-hook.js')], {
      cwd: work,
      env: { ...GIT_ENV, JSDND_GAME_DB: join(base, 'game.db'), ...extra },
      encoding: 'utf8',
      input: JSON.stringify({ session_id: 'game', hook_event_name: 'UserPromptSubmit', prompt: '/play' }),
    });
  assert.equal(run({}).status, 2);
  assert.equal(run({ JSDND_SKIP_UPDATE_CHECK: '1' }).status, 0);
  assert.equal(run({ JSDND_SKIP_UPDATE_CHECK: '0' }).status, 2, 'only the value 1 switches it off');
  assert.equal(run({ JSDND_SKIP_UPDATE_CHECK: '' }).status, 2);
});
