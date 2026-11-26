import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectLang, normalizeGender, pickVoice, prepareText } from '../tts/speak.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const speak = (args, env = {}) =>
  spawnSync(process.execPath, [join(root, 'tts', 'speak.js'), ...args], {
    encoding: 'utf8',
    env: { ...process.env, JSDND_TTS_DRY: '1', ...env },
  });

test('cyrillic text is Ukrainian, anything else is English', () => {
  assert.equal(detectLang('Ласкаво просимо'), 'uk');
  assert.equal(detectLang('Welcome, traveller'), 'en');
});

test('genders are read from short and long spellings, and nothing else', () => {
  for (const value of ['f', 'F', 'female', 'feminine']) assert.equal(normalizeGender(value), 'f');
  for (const value of ['m', 'male', 'masculine']) assert.equal(normalizeGender(value), 'm');
  for (const value of ['x', '', undefined]) assert.equal(normalizeGender(value), null);
});

test('feminine and masculine NPCs get different speakers, and a name keeps its voice', () => {
  const names = ['Мирослава', 'Орися', 'Ярина', 'Леся', 'Соломія'];
  const feminine = new Set(names.map((name) => pickVoice('f', name, 'uk').speaker));
  const masculine = new Set(['Тарас', 'Орест', 'Богдан'].map((name) => pickVoice('m', name, 'uk').speaker));
  assert.deepEqual([...masculine], [1]);
  assert.ok([...feminine].every((speaker) => speaker === 0 || speaker === 2));
  assert.ok(!feminine.has(1), 'a feminine NPC never gets the masculine speaker');
  assert.deepEqual(pickVoice('f', 'Мирослава', 'uk'), pickVoice('f', 'мирослава', 'uk'));
  const pace = pickVoice('m', 'Тарас', 'uk').lengthScale;
  assert.ok(pace >= 0.94 && pace <= 1.06);
});

test('there is no English voice yet', () => {
  assert.equal(pickVoice('f', 'Mira', 'en'), null);
});

test('the text is cleaned for the model: lowercase, plain apostrophe, no markup or quotes', () => {
  assert.equal(prepareText('«Ти — *справжній* героʼй», сказав він.', 'uk'), "ти — справжній геро'й, сказав він.");
  assert.equal(prepareText('  Hello,\n\n  "world"  ', 'en'), 'Hello, world');
});

test('a dry run shows the plan for a speech passed as arguments or on stdin', () => {
  const direct = speak(['f', 'Мирослава', 'Добрий вечір, подорожню.']);
  assert.equal(direct.status, 0, direct.stderr);
  const plan = JSON.parse(direct.stdout);
  assert.equal(plan.lang, 'uk');
  assert.equal(plan.text, 'добрий вечір, подорожню.');
  const piped = spawnSync(process.execPath, [join(root, 'tts', 'speak.js'), 'm', 'Тарас', '-'], {
    encoding: 'utf8',
    input: 'Бережи себе.\n',
    env: { ...process.env, JSDND_TTS_DRY: '1' },
  });
  assert.equal(JSON.parse(piped.stdout).speaker, 1);
});

test('bad calls are refused with a clear message', () => {
  assert.match(speak([]).stderr, /Usage/);
  assert.match(speak(['x', 'Тарас', 'привіт']).stderr, /Usage/);
  assert.match(speak(['m', 'Тарас', ' ** ']).stderr, /Nothing to say/);
  assert.match(speak(['m', 'Tom', 'Hello there']).stderr, /Only Ukrainian/);
  for (const args of [[], ['x', 'Тарас', 'привіт'], ['m', 'Tom', 'Hello']]) assert.equal(speak(args).status, 1);
});

test('without the voices installed it says how to install them', () => {
  const result = spawnSync(process.execPath, [join(root, 'tts', 'speak.js'), 'm', 'Тарас', 'привіт'], {
    encoding: 'utf8',
    env: { ...process.env, JSDND_TTS_DRY: '', JSDND_TTS_QUEUE: mkdtempSync(join(tmpdir(), 'jsdnd-tts-')) },
  });
  const installed = existsSync(join(root, 'tts', '.venv', 'bin', 'python'));
  if (!installed) {
    assert.equal(result.status, 1);
    assert.match(result.stderr, /bash setup\.sh --tts/);
  }
});

const voices = existsSync(join(root, 'tts', '.venv', 'bin', 'python')) && existsSync(join(root, 'tts', 'models'));

test(
  'a real line is made, handed to the player, and leaves nothing in the queue',
  { skip: !voices && 'run bash setup.sh --tts' },
  () => {
    const dir = mkdtempSync(join(tmpdir(), 'jsdnd-tts-'));
    const played = join(dir, 'played.txt');
    const player = join(dir, 'player.sh');
    spawnSync('/bin/sh', [
      '-c',
      `printf '#!/bin/sh\\nls -l "$1" > "${played}"\\n' > "${player}"; chmod +x "${player}"`,
    ]);
    const result = spawnSync(process.execPath, [join(root, 'tts', 'speak.js'), 'f', 'Мирослава', 'Добрий вечір.'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        JSDND_TTS_DRY: '',
        JSDND_TTS_FOREGROUND: '1',
        JSDND_TTS_QUEUE: join(dir, 'queue'),
        JSDND_TTS_PLAYER: player,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(played, 'utf8'), /\.wav/);
    assert.deepEqual(readdirSync(join(dir, 'queue')), []);
  },
);

test('the voice files are pinned: every model line has a sha256 and a fixed commit URL', () => {
  const lines = readFileSync(join(root, 'tts', 'models.txt'), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'));
  assert.ok(lines.length >= 2);
  for (const line of lines) {
    const [file, sum, url] = line.split(' ');
    assert.match(sum, /^[0-9a-f]{64}$/, file);
    assert.match(url, /^https:\/\/huggingface\.co\/rhasspy\/piper-voices\/resolve\/[0-9a-f]{40}\//, file);
  }
  const requirements = readFileSync(join(root, 'tts', 'requirements.txt'), 'utf8');
  assert.match(requirements, /^piper-tts==\d/m);
  for (const line of requirements.split('\n').filter((l) => l && !l.startsWith('#'))) assert.match(line, /==/);
});

test('--skip throws away every waiting line and says how many', () => {
  const queue = mkdtempSync(join(tmpdir(), 'jsdnd-tts-'));
  for (const name of ['000000000000001-1.json', '000000000000002-2.json']) writeFileSync(join(queue, name), '{}');
  const result = speak(['--skip'], { JSDND_TTS_QUEUE: queue });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { skipped: 2 });
  assert.deepEqual(readdirSync(queue), []);
});

test('--on, --off and --status switch voice mode through the marker file', () => {
  const marker = join(mkdtempSync(join(tmpdir(), 'jsdnd-tts-')), 'enabled');
  const env = { JSDND_TTS_MARKER: marker };
  assert.equal(JSON.parse(speak(['--status'], env).stdout).voice, 'off');
  assert.equal(existsSync(marker), false);
  const on = speak(['--on'], env);
  if (JSON.parse(speak(['--status'], env).stdout).installed) {
    assert.equal(JSON.parse(on.stdout).voice, 'on');
    assert.ok(existsSync(marker));
    assert.equal(JSON.parse(speak(['--off'], env).stdout).voice, 'off');
    assert.equal(existsSync(marker), false);
  } else {
    assert.equal(on.status, 1);
    assert.match(on.stderr, /bash setup\.sh --tts/);
    assert.equal(existsSync(marker), false, 'voice mode cannot be on without voices');
  }
});

test('--skip with nothing queued is harmless', () => {
  const result = speak(['--skip'], { JSDND_TTS_QUEUE: join(tmpdir(), 'jsdnd-tts-never-made') });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { skipped: 0 });
});

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('--skip stops a line that is already playing', { skip: !voices && 'run bash setup.sh --tts' }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'jsdnd-tts-'));
  const player = join(dir, 'longplayer.sh');
  writeFileSync(player, '#!/bin/sh\nsleep 60\n');
  chmodSync(player, 0o755);
  const env = { ...process.env, JSDND_TTS_DRY: '', JSDND_TTS_QUEUE: join(dir, 'queue'), JSDND_TTS_PLAYER: player };
  const script = join(root, 'tts', 'speak.js');
  for (const text of ['Перша репліка.', 'Друга репліка.']) {
    assert.equal(spawnSync(process.execPath, [script, 'f', 'Мирослава', text], { env }).status, 0);
  }
  const activeFile = join(dir, 'queue', 'active.pid');
  let playing = null;
  for (let i = 0; i < 150 && !playing; i++) {
    await sleep(100);
    if (existsSync(activeFile)) {
      const info = JSON.parse(readFileSync(activeFile, 'utf8'));
      if (info.tag === 'longplayer.sh') playing = info.pid;
    }
  }
  assert.ok(playing, 'the player should have started');
  const result = spawnSync(process.execPath, [script, '--skip'], { env, encoding: 'utf8' });
  // The line being spoken counts too: it and the one waiting behind it are both dropped.
  assert.deepEqual(JSON.parse(result.stdout), { skipped: 2 });
  for (let i = 0; i < 50 && alive(playing); i++) await sleep(100);
  assert.equal(alive(playing), false, 'the player should be stopped');
  await sleep(500);
  assert.deepEqual(readdirSync(join(dir, 'queue')), [], 'nothing is left, and the second line never plays');
});
