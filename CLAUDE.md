# CLAUDE.md - JS D&D Campaign

A D&D-style adventure played in the terminal where every quest is a JS task. Public repo: https://github.com/yamnyk/_JS-dnd

- Design spec: `docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md`. Read it before planning or building anything. Items marked `[My guess]` or `[Unchecked]` are not decisions.
- Plans live in `docs/superpowers/plans/`. Paste-ready plan-mode prompts: `docs/process/plan-mode-prompts.md`.
- Tasks: GitHub Issues and the "JS D&D" Projects board (project 3, owner `yamnyk`).

## Playing versus developing

- If the user ran `/play` (or just wants to play), you are the Dungeon Master. Follow the `play` skill (`.claude/skills/play/`) and ignore every developer rule below: no dev greeting, no dev notes, no talk about plans or git.
- Otherwise you are building the game. The rules below apply.
- The play harness: the `play` skill inlines `node game/cli.js resume` before the model sees the prompt. `game/play-hook.js` gives `/play` sessions a `[game]` state line per prompt and the full state after a compaction. Three subagents keep the session cheap: `world-smith` (Opus, writes the world), `move-smith` (Sonnet, writes the hidden tests of advanced moves), and `side-smith` (Sonnet, writes the hidden tests of JS side quests). `play.sh` starts the session on Sonnet and pre-approves the game commands with `--allowedTools` for that launch only: the committed settings pre-approve nothing.
- Update check: when a player types `/play`, `game/play-hook.js` asks `game/update-check.js` whether the game folder is behind its upstream, and blocks the prompt (exit 2) with a plain message to run `git pull`. It blocks only for a clean fast-forward case; offline, no upstream, a detached HEAD, a diverged branch, or edited tracked files never block. It never pulls. `JSDND_SKIP_UPDATE_CHECK=1` turns it off for developers and tests.
- The hook, `resume`, and the status line must never import the sealed dice files (`game/dice.js`, `game/rolls.js`). `tests/game/play-hook-tamper.test.js` pins it. Read-only fight reads live in `game/fight-state.js` for that reason.

## Working rules

- Claude makes the commits and pushes to origin/main after each finished piece. Plain commit messages. NEVER a `Co-Authored-By` line, a "Generated with Claude" line, or any Claude attribution in commits or PR text.
- Never force-push or rewrite pushed history without asking Gogi first.
- Ask before other outward-facing actions (GitHub issues, projects, posts).
- No em-dash or en-dash anywhere: code, comments, docs, commit text, output.
- Deterministic work belongs in scripts. The agent only does judgment work.
- Game state lives in SQLite reached through scripts. Never JSON or markdown files as game state.
- The dev notes DB (`.dev/dev.db`) is gitignored and separate from the game DB.

## Languages

- Game text is English and Ukrainian. `node game/cli.js lang show` and `lang set <en|uk>` read and change the save language.
- Every player-facing string lives in `game/locales/{en,uk}.js` or `quests/text/{en,uk}.js`, never inline in a module. A lint rule enforces it for the player-facing modules.
- Ukrainian text is a draft until Gogi has reviewed it. Any new or changed Ukrainian text is added to `docs/i18n/uk-review-checklist.md` (the review gate).
- The Master brief `.claude/skills/play/` and all developer text stay English.

## Hero vitals

- Health, gold, and items live in SQLite (`game/vitals.js`, `game/inventory.js`). The status line shows them above the stamina bar (`game/hero-line.js`). Max HP is the class hit die plus the CON modifier (`game/hero-stats.js`, `game/rules.js`).
- Gold and items are paid by `judgeQuest` and the fight engine, and taken back by `revokeSolve`. Nothing else writes them.

## Invented content

- The 6 places and 7 people are the spine, not a limit. The Master invents places as detours (`game/detours.js`): the hero keeps their real map place and gets a `detour_id` while off the map, so rest, quests, and the status bar keep working. `go` from a detour leaves it. A tamper reset or a lost fight brings the hero back to the map and keeps the invented places.
- Every invented name and text goes through `game/improv.js` (limits of 50 per kind, no slot lookalikes, no invisible characters, banned phrases per language). Invented content never opens a rung, solves a ladder quest, or unlocks the ending.
- People are `game/improv-npcs.js` (`npc invent`, `talk "<name>"`). Rewards are `game/rewards.js` (`reward gold|item|list`): the Master decides what to give, the scripts only range-check and log every grant. Improvised fights are `fight begin --improv`: no warnings, no knockout, no automatic item.
- Errands are `game/side-tasks.js` (`side add story|list|done|drop`, open tasks capped at 50). JS side quests are `game/side-quests.js` (`side propose --data -`, `side check <id>`): the hidden problem comes from `side-smith`, the player's file is `player/side-<id>.js`, and a pass closes the task and nothing else. The hook, `resume`, and the status line read tasks through `game/side-tasks.js` only: `game/side-quests.js` runs player code and they must never import it.

## Session start

The SessionStart hook prints the dev state (tasks, last completed, predictions, board). Greet Gogi with that current state, short, before anything else.

## Session end

Before the session ends, record state in the dev notes DB:

1. `node dev/cli.js task <issue> <todo|in_progress|blocked|done> "<title>" ["<detail>"]` for the current task.
2. If the task is done, `node dev/cli.js note completed <issue> "<what was completed>"`, stating exactly what was completed.
3. `node dev/cli.js note prediction - "<likely next step>"` for each predicted next step from the conversation. Predictions are guesses and stay labeled as such.

Run `node dev/cli.js status` to see what is currently recorded.

## Commands

- `node --test` runs all tests. They include a style test: `npm run lint` and `npm run format` fix what it flags.
- Code style is Prettier (`.prettierrc.json`) plus ESLint (`eslint.config.js`). `game/dice.js` and `game/rolls.js` are excluded from both: they are fingerprinted together in `game/dice.sha256`, never format them. After an intended change run `node game/seal.js`.
- The player's quest files are checked with `eslint.player.config.js` and the same Prettier config (`game/style-check.js`).
- `bash setup.sh` checks Node and `node:sqlite`.
- `bash dev/github/seed.sh` is a dry run. `--apply` creates labels, the board, and issues, and must not be run again without Gogi's approval.
