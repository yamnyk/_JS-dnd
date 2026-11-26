// Reads an NPC's speech aloud with Piper, for a streamer who shows the feed and wants it heard too.
// Usage: node tts/speak.js <f|m> "<NPC name>" "<speech>"     (a speech of "-" is read from stdin)
//        node tts/speak.js --on | --off | --status          (voice mode for /play sessions, kept in tts/.enabled)
//        node tts/speak.js --skip                           (stops the speech and clears the queue)
//
// The call returns at once. A background job makes the sound, and jobs wait in a queue so two
// lines never talk over each other. The voice comes from the NPC's gender and name, so the same
// person always sounds the same. Install the voices with: bash setup.sh --tts
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PYTHON = join(HERE, '.venv', 'bin', 'python');
const QUEUE = process.env.JSDND_TTS_QUEUE || join(tmpdir(), 'jsdnd-tts-queue');
const ACTIVE = join(QUEUE, 'active.pid');
const MARKER = process.env.JSDND_TTS_MARKER || join(HERE, '.enabled');
const STALE_MS = 10 * 60 * 1000;

// Speaker ids of uk_UA-ukrainian_tts-medium: 0 lada, 1 mykyta, 2 tetiana.
export const VOICES = {
  uk: { model: 'uk_UA-ukrainian_tts-medium.onnx', speakers: { f: [0, 2], m: [1] } },
};

export const detectLang = (text) => (/\p{Script=Cyrillic}/u.test(text) ? 'uk' : 'en');

export function normalizeGender(value) {
  const v = String(value ?? '').toLowerCase();
  if (['f', 'female', 'feminine'].includes(v)) return 'f';
  if (['m', 'male', 'masculine'].includes(v)) return 'm';
  return null;
}

// A small stable hash of the name (FNV-1a), so a person keeps their voice for the whole campaign.
export function nameHash(name) {
  let h = 2166136261;
  for (const ch of String(name).toLowerCase()) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

// The speaker comes from the gender's pool, and the pace from the name (0.94 to 1.06), so two
// people who share a speaker still sound a little different.
export function pickVoice(gender, name, lang) {
  const voice = VOICES[lang];
  if (!voice) return null;
  const pool = voice.speakers[gender];
  const h = nameHash(name);
  return {
    model: voice.model,
    speaker: pool[h % pool.length],
    lengthScale: Number((0.94 + ((h >>> 8) % 13) / 100).toFixed(2)),
  };
}

// The Ukrainian model reads raw characters and knows only lowercase letters and the plain apostrophe.
export function prepareText(text, lang) {
  const clean = String(text)
    .replace(/["“”„«»]/g, '')
    .replace(/[*_`~#>[\]{}]/g, ' ')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return lang === 'uk' ? clean.toLowerCase() : clean;
}

function playerCommand() {
  if (process.env.JSDND_TTS_PLAYER) return process.env.JSDND_TTS_PLAYER.split(' ');
  if (process.platform === 'darwin') return ['afplay'];
  for (const [bin, ...args] of [
    ['paplay'],
    ['aplay', '-q'],
    ['ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet'],
  ]) {
    if (spawnSync('which', [bin], { stdio: 'ignore' }).status === 0) return [bin, ...args];
  }
  return null;
}

// Waits until this job's file is the oldest one in the queue. Files left by a crashed job are dropped.
// Returns false when the file is gone, because the line was skipped.
async function waitForTurn(file) {
  for (;;) {
    const jobs = readdirSync(QUEUE)
      .filter((name) => name.endsWith('.json'))
      .filter((name) => {
        const stale = Date.now() - statSync(join(QUEUE, name)).mtimeMs > STALE_MS;
        if (stale) rmSync(join(QUEUE, name), { force: true });
        return !stale;
      })
      .sort();
    if (!jobs.includes(basename(file))) return false;
    if (jobs[0] === basename(file)) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

// Runs a command and notes its pid, so --skip can stop it. Resolves with the exit code.
function run(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, options);
    writeFileSync(ACTIVE, JSON.stringify({ pid: child.pid, tag: basename(command) }));
    child.on('error', () => resolve(1));
    child.on('close', (code) => {
      rmSync(ACTIVE, { force: true });
      resolve(code);
    });
    if (options.input !== undefined) child.stdin.end(options.input);
  });
}

async function runJob(file) {
  const wav = file.replace(/\.json$/, '.wav');
  try {
    const job = JSON.parse(readFileSync(file, 'utf8'));
    if (!(await waitForTurn(file))) return;
    const args = ['-m', 'piper', '-m', join(HERE, 'models', job.model), '-s', String(job.speaker)];
    args.push('--length-scale', String(job.lengthScale), '-f', wav);
    const made = await run(PYTHON, args, { stdio: ['pipe', 'ignore', 'ignore'], input: job.text });
    const player = playerCommand();
    if (made === 0 && player && existsSync(file)) {
      await run(player[0], [...player.slice(1), wav], { stdio: 'ignore' });
    }
  } finally {
    rmSync(file, { force: true });
    rmSync(wav, { force: true });
  }
}

// Stops the line that is speaking and throws away every line waiting behind it. Returns how many
// lines were dropped. The pid is only trusted if that process still looks like what we started.
export function skipAll() {
  if (!existsSync(QUEUE)) return 0;
  const waiting = readdirSync(QUEUE).filter((name) => name.endsWith('.json'));
  for (const name of waiting) rmSync(join(QUEUE, name), { force: true });
  try {
    const { pid, tag } = JSON.parse(readFileSync(ACTIVE, 'utf8'));
    const command = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' }).stdout;
    if (command.includes(tag)) process.kill(pid, 'SIGTERM');
  } catch {
    // No sound is playing, which is fine.
  }
  rmSync(ACTIVE, { force: true });
  return waiting.length;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function main(argv) {
  if (argv[0] === '--job') return runJob(argv[1]);
  if (['--on', '--off', '--status'].includes(argv[0])) {
    const installed = existsSync(PYTHON) && existsSync(join(HERE, 'models', VOICES.uk.model));
    if (argv[0] === '--on') {
      if (!installed) fail('The voices are not installed. Run: bash setup.sh --tts');
      writeFileSync(MARKER, 'on\n');
    }
    if (argv[0] === '--off') rmSync(MARKER, { force: true });
    console.log(JSON.stringify({ voice: existsSync(MARKER) ? 'on' : 'off', installed }));
    return;
  }
  if (argv[0] === '--skip') {
    console.log(JSON.stringify({ skipped: skipAll() }));
    return;
  }

  const gender = normalizeGender(argv[0]);
  const name = argv[1];
  if (!gender || !name || argv[2] === undefined) {
    fail('Usage: node tts/speak.js <f|m> "<NPC name>" "<speech>"');
  }
  const raw = argv[2] === '-' ? readFileSync(0, 'utf8') : argv.slice(2).join(' ');
  const lang = detectLang(raw);
  const text = prepareText(raw, lang);
  if (!text) fail('Nothing to say.');
  const voice = pickVoice(gender, name, lang);
  if (!voice) fail(`No voice for this language is installed (${lang}). Only Ukrainian speech can be read aloud.`);

  if (process.env.JSDND_TTS_DRY === '1') {
    console.log(JSON.stringify({ lang, gender, name, ...voice, text }));
    return;
  }
  if (!existsSync(PYTHON) || !existsSync(join(HERE, 'models', voice.model))) {
    fail('The voices are not installed. Run: bash setup.sh --tts');
  }

  mkdirSync(QUEUE, { recursive: true });
  const file = join(QUEUE, `${String(Date.now()).padStart(15, '0')}-${process.pid}.json`);
  writeFileSync(file, JSON.stringify({ ...voice, text }));
  if (process.env.JSDND_TTS_FOREGROUND === '1') return runJob(file);
  const script = fileURLToPath(import.meta.url);
  spawn(process.execPath, [script, '--job', file], { detached: true, stdio: 'ignore' }).unref();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main(process.argv.slice(2));
}
