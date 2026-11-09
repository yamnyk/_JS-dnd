import { spawnSync } from 'node:child_process';

// Is the game folder behind its upstream? Used by the play hook to ask a player to pull before a session.
// Everything here is read only except `git fetch`, which updates the remote tracking refs and never the
// working tree. It imports nothing from the game, so it works even when the dice files are broken.
// A state that is not clearly "behind and a plain pull can catch up" never blocks: no git, not a repo,
// a detached HEAD, no upstream, a branch with commits of its own, or edited tracked files.
const FETCH_TIMEOUT_MS = 3000;
const GIT_TIMEOUT_MS = 3000;

const run = (cwd, args, timeout = GIT_TIMEOUT_MS) =>
  spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    timeout,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });

const out = (cwd, args) => {
  const result = run(cwd, args);
  return result.error || result.status !== 0 ? null : result.stdout.trim();
};

// { blocked, behind, reason }. With fetch: true it asks the remote first, with a short timeout. A failed
// fetch is ignored: refs fetched earlier still say whether the folder is behind.
export function updateStatus({ cwd, fetch = false } = {}) {
  const quiet = (reason) => ({ blocked: false, behind: 0, reason });
  // Developers and tests switch the check off with JSDND_SKIP_UPDATE_CHECK=1. It only ever removes a convenience.
  if (process.env.JSDND_SKIP_UPDATE_CHECK === '1') return quiet('skipped');
  if (out(cwd, ['rev-parse', '--is-inside-work-tree']) !== 'true') return quiet('not-a-repo');
  if (out(cwd, ['symbolic-ref', '-q', 'HEAD']) === null) return quiet('detached');
  if (out(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']) === null) return quiet('no-upstream');
  if (fetch) run(cwd, ['fetch', '--quiet'], FETCH_TIMEOUT_MS);

  const behind = Number(out(cwd, ['rev-list', '--count', 'HEAD..@{u}']));
  const ahead = Number(out(cwd, ['rev-list', '--count', '@{u}..HEAD']));
  if (!Number.isInteger(behind) || !Number.isInteger(ahead)) return quiet('unreadable');
  if (behind === 0) return quiet('up-to-date');
  if (ahead > 0) return { blocked: false, behind, reason: 'diverged' };
  const edited = out(cwd, ['status', '--porcelain', '--untracked-files=no']);
  if (edited === null || edited !== '') return { blocked: false, behind, reason: 'edited' };
  return { blocked: true, behind, reason: 'behind' };
}
