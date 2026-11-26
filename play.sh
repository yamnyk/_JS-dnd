#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

# The oldest Claude Code this game supports: subagents skip CLAUDE.md from this version on. It was built and
# tested on 2.1.311. Older ones only get a warning.
MIN_VERSION="2.1.271"

if ! command -v claude >/dev/null 2>&1; then
  echo "Claude Code is not installed. Get it from https://claude.com/claude-code, then run this script again." >&2
  exit 1
fi

# True when $1 is older than $2, comparing each number of a.b.c as a number.
older_than() {
  local IFS=.
  local -a have=($1) need=($2)
  local i
  for i in 0 1 2; do
    if (( ${have[i]:-0} < ${need[i]:-0} )); then return 0; fi
    if (( ${have[i]:-0} > ${need[i]:-0} )); then return 1; fi
  done
  return 1
}

# A version that cannot be read is no reason to warn or to stop.
VERSION="$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1 || true)"
if [ -n "$VERSION" ] && older_than "$VERSION" "$MIN_VERSION"; then
  echo "Claude Code $VERSION is older than $MIN_VERSION, the oldest version this game supports. It may cost more tokens or miss features. Update Claude Code if anything looks off." >&2
fi

# --tts turns on voice mode and keeps it on: NPC speech is read aloud by tts/speak.js (install it with:
# bash setup.sh --tts, turn it off with: node tts/speak.js --off).
# The flag is ours, so it is taken out of the arguments that go to Claude Code.
TTS=""
PASS=()
for arg in "$@"; do
  if [ "$arg" = "--tts" ]; then TTS=1; else PASS+=("$arg"); fi
done

# Voice mode is on with --tts, or while the marker file exists (node tts/speak.js --on and --off).
MARKER="${JSDND_TTS_MARKER:-$HERE/tts/.enabled}"
if [ -n "$TTS" ] && [ ! -f "$MARKER" ]; then
  node "$HERE/tts/speak.js" --on >/dev/null 2>&1 || true
fi
if [ -f "$MARKER" ]; then TTS=1; fi

ALLOW=("Bash(node game/cli.js *)")
VOICE=()
if [ -n "$TTS" ]; then
  ALLOW+=("Bash(node tts/speak.js *)")
  VOICE=(--append-system-prompt "$(cat "$HERE/tts/master-note.txt")")
fi

# The prompt goes first because --allowedTools takes a list and would swallow a prompt placed after it.
# The whole session starts on Sonnet, because a skill's model setting only lasts one turn. The game
# commands are pre-approved for this launch only: nothing is committed to the project settings.
# Extra arguments go last, for example: bash play.sh --continue
exec claude "/play" --model sonnet ${VOICE[@]+"${VOICE[@]}"} --allowedTools "${ALLOW[@]}" ${PASS[@]+"${PASS[@]}"}
