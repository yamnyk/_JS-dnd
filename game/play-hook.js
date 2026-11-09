// Claude Code hook for /play sessions (UserPromptSubmit and SessionStart after compaction).
// The prompt "/play" marks the session as a game. After that, every prompt gets one state line,
// and a compaction gets the full state back. Sessions that never ran /play get nothing.
// It must never throw, block a prompt, or slow a dev session down.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultGameDbPath, openGameDb } from './db.js';
import { resumeState, stateLine } from './resume.js';
import { updateStatus } from './update-check.js';
import { effectiveLanguage, t } from './i18n.js';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Set when a prompt must be blocked: the hook then exits 2, which stops the prompt and shows the message.
let blockedMessage = null;

// A new session starts with /play. If the game has new commits to pull, the prompt is blocked with the
// reason, and it stays blocked on every later prompt of that session until the player has pulled. The
// remote is asked once per session (at /play, or at the first later prompt if the marker is older).
function checkForUpdate(db, sessionId, { fetch }) {
  const status = updateStatus({ cwd: REPO, fetch });
  if (fetch) {
    db.prepare('UPDATE play_sessions SET update_checked_at = ? WHERE session_id = ?').run(
      new Date().toISOString(),
      sessionId,
    );
  }
  if (!status.blocked) return;
  const save = db.prepare('SELECT id FROM saves ORDER BY id LIMIT 1').get();
  const lang = save ? effectiveLanguage(db, save.id) : 'en';
  blockedMessage = t(lang, 'update.blocked', { count: status.behind });
}

function readPayload() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

function run() {
  const payload = readPayload();
  const sessionId = payload?.session_id;
  if (typeof sessionId !== 'string' || !sessionId) return;
  const isPlayPrompt =
    payload.hook_event_name === 'UserPromptSubmit' && /^\/play(\s|$)/.test(String(payload.prompt ?? '').trim());

  if (isPlayPrompt) {
    const db = openGameDb();
    db.prepare('INSERT OR IGNORE INTO play_sessions (session_id, started_at) VALUES (?, ?)').run(
      sessionId,
      new Date().toISOString(),
    );
    checkForUpdate(db, sessionId, { fetch: true });
    return;
  }

  if (!existsSync(defaultGameDbPath())) return;
  const db = openGameDb(undefined, { busyTimeoutMs: 300, runMigrations: false });
  const marker = db.prepare('SELECT update_checked_at FROM play_sessions WHERE session_id = ?').get(sessionId);
  if (!marker) return;
  if (payload.hook_event_name === 'UserPromptSubmit') {
    checkForUpdate(db, sessionId, { fetch: !marker.update_checked_at });
    if (blockedMessage) return;
  }
  const save = db.prepare('SELECT id FROM saves ORDER BY id LIMIT 1').get();
  if (!save) return;

  if (payload.hook_event_name === 'UserPromptSubmit') {
    const line = stateLine(db, save.id);
    if (line) process.stdout.write(`${line}\n`);
  } else if (payload.hook_event_name === 'SessionStart') {
    process.stdout.write(
      `You are the Dungeon Master of this /play session. Game state after compaction: ${JSON.stringify(resumeState(db, save.id))}\n`,
    );
  }
}

try {
  run();
} catch {
  // An old database without the play_sessions table, or a busy one: say nothing this turn.
}
if (blockedMessage) {
  process.stderr.write(`${blockedMessage}\n`);
  process.exit(2);
}
process.exit(0);
