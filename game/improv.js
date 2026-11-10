import { lintVoice } from './voice.js';

// The rules every invented place, person, and task goes through. They exist to stop abuse and runaway
// saves, not to balance the game: what an invention does is the Master's call. Messages are written for
// the Master to read and relay.
export const LIMITS = {
  places: 50,
  people: 50,
  tasks: 50,
  name: 60,
  description: 400,
  voice: 200,
  title: 60,
  brief: 400,
};

// The only tables room can be counted in, so a name can never become SQL.
const TABLES = new Set(['detours', 'improv_npcs', 'side_tasks']);

// A map slot written any way: L1 to L6, N1 to N7, any case, and the wide forms of the letters and digits.
const SLOT = /^(?:L[1-6]|N[1-7])$/i;

const INVISIBLE = /[\p{Cc}\p{Cf}]/u;

function lintPhrases(label, text, lang) {
  const { hits } = lintVoice(text, lang);
  if (hits.length)
    throw new Error(`${label} contains the banned phrase "${hits[0]}". Rewrite it in the voice of the setting.`);
}

// A name: one line, plain single spaces, no invisible characters, not a map slot, not a banned phrase.
export function checkName(name, lang = 'en', label = 'Name') {
  if (typeof name !== 'string') throw new Error(`${label} must be text.`);
  // Checked before trimming: trim() would quietly drop a hidden character at either end.
  if (INVISIBLE.test(name.replace(/[\t\n\r]/g, ''))) {
    throw new Error(`${label} must not hold invisible or control characters.`);
  }
  const clean = name.trim();
  if (!clean) throw new Error(`${label} must not be empty.`);
  if (clean.length > LIMITS.name) throw new Error(`${label} is at most ${LIMITS.name} characters.`);
  if (/[^\S ]/u.test(clean) || / {2}/.test(clean)) {
    throw new Error(`${label} may only have single plain spaces between words.`);
  }
  if (SLOT.test(clean.normalize('NFKC'))) {
    throw new Error(`${label} "${clean}" looks like a map slot. Pick a name that is not L1 to L6 or N1 to N7.`);
  }
  lintPhrases(label, clean, lang);
  return clean;
}

// A description, voice, title, or brief: filled, short, no invisible characters. New lines are allowed.
export function checkText(label, text, max, lang = 'en') {
  if (typeof text !== 'string') throw new Error(`${label} must be text.`);
  if (INVISIBLE.test(text.replace(/\n/g, ''))) {
    throw new Error(`${label} must not hold invisible or control characters.`);
  }
  const clean = text.trim();
  if (!clean) throw new Error(`${label} must not be empty.`);
  if (clean.length > max) throw new Error(`${label} is at most ${max} characters.`);
  lintPhrases(label, clean, lang);
  return clean;
}

// The save may hold at most `limit` rows of this kind.
export function assertRoom(db, saveId, table, limit, what) {
  if (!TABLES.has(table)) throw new Error(`Unknown table "${table}".`);
  const { n } = db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE save_id = ?`).get(saveId);
  if (n >= limit) throw new Error(`A save holds at most ${limit} ${what}, and this one has ${n}.`);
}
