#!/usr/bin/env bash
# Installs the optional voices: a Python venv with Piper (tts/requirements.txt) and the voice models
# (tts/models.txt, each checked against its sha256). Safe to run again: what is in place is kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi
}

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is missing. Install Python 3.9 or newer, then run this again." >&2
  exit 1
fi

if [ ! -x "$HERE/.venv/bin/python" ]; then
  python3 -m venv "$HERE/.venv"
fi
"$HERE/.venv/bin/python" -m pip install --quiet --disable-pip-version-check -r "$HERE/requirements.txt"

mkdir -p "$HERE/models"
while read -r file sum url; do
  case "$file" in ''|'#'*) continue ;; esac
  target="$HERE/models/$file"
  if [ -f "$target" ] && [ "$(sha256_of "$target")" = "$sum" ]; then continue; fi
  curl -fsSL -o "$target.part" "$url"
  if [ "$(sha256_of "$target.part")" != "$sum" ]; then
    rm -f "$target.part"
    echo "$file did not match its checksum, so it was thrown away." >&2
    exit 1
  fi
  mv "$target.part" "$target"
done < "$HERE/models.txt"
touch "$HERE/.enabled"
echo "Voices installed in $HERE"
