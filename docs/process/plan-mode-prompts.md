# Plan-mode prompts

One paste-ready prompt per plan. Open Claude Code in this repo, enter plan mode, and paste the prompt for the plan you want to write. Plan 1 is already written and in progress.

Spec: `docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md`

## Plan 1: Foundation and tracking

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: Foundation and tracking, covering spec sections 6, 7, 8.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Plan 2: Game DB and script layer

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: Game DB and script layer, covering spec sections 6, 5.7 (fight log), 5.8.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Plan 3: Quest engine

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: Quest engine, covering spec sections 5.3, 5.5, 5.6.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Plan 4: World and hero generation

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: World and hero generation, covering spec sections 5.1, 5.2, 5.4.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Plan 5: Combat

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: Combat, covering spec section 5.7.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Plan 6: Stamina bar

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: Stamina bar, covering spec sections 5.9, 8.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Plan 7: Ending stats page

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full.
Run `node dev/cli.js status` and read the current state first.
Plan only this subsystem: Ending stats page, covering spec section 5.10.
Follow the spec's [My call] / [My guess] / [Unchecked] markers: do not treat guesses as decisions, and verify anything marked [Unchecked] before relying on it.
Constraints: commit and push yourself with plain messages (never a co-author or Claude line, never force-push without asking), ask before other outward-facing actions, no em-dash or en-dash anywhere, deterministic work in scripts, game data only in SQLite through scripts.
Write the plan to docs/superpowers/plans/ using the writing-plans skill. Tell me anything the spec leaves open and ask before you assume it.
```

## Extra plan: Multi-language (English and Ukrainian)

Not one of the original seven. Paste this into plan mode. It is longer than the others on purpose: language touches almost every part of the game, so the prompt names what to inspect and what to ask before planning.

```
Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md in full, then docs/superpowers/specs/2026-11-08-curriculum-catalog.md. Run `node dev/cli.js status` and read the current state first.

GOAL
Add multi-language support. The game is English only today. Add Ukrainian. The player picks the language, and everything the player reads is in that language: the Master's narration, quest specs and style directions, check feedback, the stamina bar, the ending page, errors the player might see, and setup messages. I accept that Ukrainian costs players extra tokens. Do not trade quality for token savings, but do not waste tokens either.

PLAN ONLY THIS SUBSYSTEM: language support (English plus Ukrainian), designed so a third language later needs a new catalog and a banned-phrase list, and no engine changes.

WHAT EXISTS TODAY: INSPECT EACH OF THESE BEFORE PLANNING, AND TELL ME WHAT YOU FOUND
1. .claude/commands/play.md: the whole Master brief, in English. Decide how the Master gets the language and how its replies, onboarding questions, honor tone (gentle review, roast) and NPC voices follow it.
2. game/voice.js: BANNED_PHRASES is English only, and the whole-word matcher uses Latin-only boundaries `(?<![a-z0-9])`. Ukrainian text would pass it unchecked or match wrongly. The spec's anti-goal (sloppy AI language) applies per language and needs a Ukrainian list.
3. game/honor-rules.js (toneFor: gentle at 0 and above, roast below 0): the roast is savage and swears. Decide what that means in Ukrainian.
4. quests/*.js and quests/style.js: brief, stub comments, `expected` and `got` strings from the checks, the nine GENERAL_STYLE directions, plus the 51 planned templates in the curriculum catalog (spec, expected examples, style.specific). The player's JS code, identifiers, file names, and exported function names stay English.
5. game/rules.js: race and class names, and ALIASES ("hobbit", "magician") that players type. Players will type race and class names in Ukrainian. Canonical keys must stay stable.
6. game/cli.js, game/quests.js, game/combat-engine.js and others: error messages (JSON `error` fields the Master reads), plus text scripts produce for the player directly: the collapse line, the quest style problems from game/style-check.js, honor and fight log details.
7. Direct player-facing script output that no Master filters: game/stamina.js (renderBar: "STAMINA", "left", "resets in"), game/statusline.js, game/ending-page.js (every label, dates, `<html lang="en">`), setup.sh, README.md, CLAUDE.md.
8. game/links.js: the legal documentation list matches exact hosts. Ukrainian mirrors may exist (for example a uk subdomain of javascript.info, a /uk/ locale path on MDN). Verify each against the real sites before relying on it. A legal Ukrainian link must not cost honor.
9. World content the Master writes into the DB (setting, location names, NPC names, descriptions, voices): it must come out in the player's language, pass `voice lint`, and survive a language switch.
10. The data model: where the player's language lives (the game DB, per save, never a file), and what happens to already stored text when it changes.

CONSTRAINTS (all the project's standing rules, plus the language ones)
- Commit and push yourself with plain messages. Never a co-author or Claude line. Never force-push or rewrite pushed history without asking. Ask before other outward-facing actions.
- No em-dash and no en-dash anywhere, in Ukrainian text too. Ukrainian often uses a dash where English uses "is"; the plan must say how those sentences are written instead, and flag the cost.
- Ukrainian is written in Cyrillic only. Never Latin transliteration, anywhere: UI, tests, docs, comments.
- Deterministic work in scripts. Game state only in SQLite through scripts. Checks stay deterministic and language independent: language changes text, never behavior, expected values, or what passes.
- The game keeps zero npm dependencies. Use Node's built-in Intl (Intl.PluralRules supports Ukrainian one/few/many/other). Dev dependencies need my approval. Do not add an i18n library without asking.
- Machine-readable surfaces stay English and stable: CLI commands, JSON keys, DB columns, honor kinds, quest ids, error codes if you introduce them.
- The Master reads script JSON. Decide, with costs, which text is translated by scripts (a reviewed catalog, deterministic) and which is translated by the Master on the fly. Do not assume either.
- Follow the spec's [My call] / [My guess] / [Unchecked] markers. Do not treat guesses as decisions. Verify anything [Unchecked] and anything you state about Ukrainian technical terminology.
- Tests first for everything. At least: every key exists in every language with the same placeholders, no Latin letters inside Ukrainian strings except an allowlist of code identifiers and placeholders, no dash characters, correct plural forms for 1, 2, 5, 11, 12, 21, 22, 25, 100 and 101, the banned-phrase matcher works with Cyrillic, a missing key falls back to English in a way the tests can see, and a test that fails when new player-facing text bypasses the catalog (say how you enforce that).

ASK ME BEFORE ASSUMING: USE AskUserQuestion, ONE DECISION AT A TIME OR SMALL RELATED GROUPS, WITH YOUR RECOMMENDATION FIRST. DO NOT WRITE THE PLAN UNTIL THESE ARE ANSWERED:
1. When and how the language is chosen: first question of /play, stored per save, changeable later? What happens to stored world text, quest text already shown, and the ending page when it changes.
2. Who translates what: reviewed catalogs in the repo (scripts return the player's language), the Master translating from English source on the fly, or a split. Compare cost, determinism, and quality for quest specs, check messages, errors, and style directions.
3. The Master brief: one English play.md that says "reply in language X", per-language briefs, or a shared core plus a small per-language file. Compare tokens and risk of drift.
4. Which surfaces get translated: status bar, ending page, setup.sh, CLI errors, README and docs. Does a Ukrainian README exist?
5. Race and class names: Ukrainian display names with canonical English keys? Which aliases per language? Check how the Ukrainian D&D 5e community names them and tell me what you find.
6. The Ukrainian roast: same savage-and-swearing rule as English? Word choice boundaries? I am a native speaker and will review the list.
7. The Ukrainian banned-phrase list (calques and chatbot-isms). You draft it, I review it.
8. JavaScript terminology: closures, promises, callbacks and the rest. Ukrainian term, English term in parentheses, or English only? You propose a glossary, I approve it. Mark it [Unchecked] until I do.
9. Ukrainian documentation mirrors on the legal link list.
10. A player who types in one language and plays in another, and mixed-language answers to onboarding questions.
11. Developer-only text (the session-start greeting, dev notes, board tooling): stays English, correct?

PROCESS
- Read the real sources first (the files above, Node's Intl.PluralRules for uk, the actual Ukrainian doc mirrors). Do not freestyle from memory.
- Tell me anything the spec or the code leaves open. Separate confirmed facts from inference and label inference as inference.
- Write the plan to docs/superpowers/plans/ using the writing-plans skill: header, Global Constraints, Decisions (mine versus your calls), Review Focus with a test per line, tasks in test-first order with exact interfaces. Review Focus must cover at least: plural forms, Cyrillic and Latin mixing, banned-phrase boundaries with Cyrillic, a missing key at runtime, switching language mid-game with stored text, scripts that parse JSON text fields, and the stamina bar and ending page with Cyrillic text.
- End with the execution handoff question (subagent-driven or native) and your recommendation.
```

## Extra plan: Fix the deferred review findings

Every final review left Minors that the plans deferred. They are collected, with where each came from and a status, in `docs/process/deferred-findings.md`. Paste this into plan mode to turn them into a fix plan.

```
Read docs/process/deferred-findings.md in full, then docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md, docs/superpowers/specs/2026-11-08-curriculum-catalog.md, and docs/superpowers/plans/2026-11-08-multi-language.md (approved, not built yet). Run `node dev/cli.js status` and read the current state first.

GOAL
Fix the deferred review findings that are worth fixing, test first, in a few small plans-worth of tasks. The register has about 50 items from Plans 2 to 7. They were all graded Minor by the reviewers, and some of that grading was about the spec's silence, not about the effect on a player. Re-grade every item by what a reasonable player or the Master gets if it ships, then fix the ones that matter and say plainly which ones you leave and why.

PLAN ONLY THIS SUBSYSTEM: the deferred findings (register ids A1 to F2). The owner-call items (G1 to G4, and B10) are decisions for me, not bugs.

STEP 0: VERIFY BEFORE PLANNING
The register says "open" for most items, but code has moved since each review. For every item, read the current code and tests and confirm whether it is still true. Run a probe or a mutation test where a claim is about behavior (for example "two parallel `move check` calls both apply", "a passing attempt from before a reset can be judged after it", "a never-settling promise gives a vague error", "a location named L3 hijacks `go`"). Report each item as: still true (verified by running), still true (inference only, label it), or already fixed. Drop the fixed ones from the plan and update the register status in the plan.

STEP 1: RE-GRADE BY EFFECT
Sort what remains into Important (a player can be cheated, blocked, or lose or gain honor wrongly; state can be corrupted; the Master can be misled) and Minor (polish, test gaps, rare edge cases). Candidates I suspect deserve Important, but you decide from evidence: A7 (parallel calls double-apply), A5 (tamper path crashes if the DB cannot open), B5 (the ending can re-unlock without the Master being told), B9 (honor from a pre-reset attempt), B7 and C7 (quest commands ignore gating and hide the file path), D1 (a never-settling promise gives a vague error, and rungs 4 and 5 are about promises and timers), E1 (a flaky test fails about 1 run in 120 and one was seen again recently), B1 (`--quest` bypasses the warning gate).

CONSTRAINTS
- Commit and push yourself with plain messages. Never a co-author or Claude line. Never force-push or rewrite pushed history without asking. Ask before other outward-facing actions.
- No em-dash and no en-dash anywhere.
- Deterministic work in scripts. Game state only in SQLite through scripts. Every connection uses `openGameDb`.
- Zero npm runtime dependencies. Prettier and ESLint are dev dependencies already in place: `npm run lint` and `npm run format:check` must stay green. Never touch or format `game/dice.js`: it is fingerprinted.
- Tests first for every fix: write the test, watch it fail for the right reason, then fix, then run the whole suite. A fix without a test that failed first does not count. Prefer tests that fail when the production change is removed (name that change before writing the test).
- Machine-readable surfaces stay English and stable. A fix must not change CLI command names, JSON keys, DB column names, honor kinds, or quest ids, unless I approve it.
- The multi-language plan is approved but not built. Any new player-facing or Master-facing message you add is English for now, and the plan must say how each one will be keyed later, so the language work does not have to chase them.
- Migrations are append-only. Never edit an applied one.
- Keep each fix as small as the finding. No refactors for taste.

ASK ME BEFORE ASSUMING: USE AskUserQuestion, ONE DECISION AT A TIME OR SMALL RELATED GROUPS, WITH YOUR RECOMMENDATION FIRST. DO NOT WRITE THE PLAN UNTIL THESE ARE ANSWERED:
1. Order: before or after the multi-language plan, and before or after the 51-quest curriculum. List which findings must land before the curriculum (the ones the new quests depend on) and which can wait.
2. Scope: fix everything that is still true, only the ones you re-graded Important, or Important plus the cheap test gaps. Show me the counts for each choice.
3. Each owner call, one by one, with what it costs either way: G1 (a tamper reset wipes race bonuses, per spec 5.8), G2 (reading a legal doc drops the clean bonus from +8 to +5), G3 (player code is unsandboxed), G4 (the fingerprint covers only dice.js, not rolls.js or cli.js), and B10 (a solve cannot be revoked by a later cheated verdict).
4. A7, parallel calls: how strict should it be? Options include moving every state read inside the transaction, a per-save advisory lock, or refusing a second concurrent write with a clear error. Recommend one and say what each costs.
5. E1, the flaky tests: inject a seeded rng through an environment variable the test sets, restructure the tests to use the library with a scripted rng, or retry. Recommend one.
6. D1, never-settling promises: what should the player see, and should a check wait with a timeout and say which function never finished.
7. B6 and B7 (knockout deadlock and quest commands ignoring gating): should the scripts enforce that a quest can only start when its NPC is awake and the hero is in the right place, or stay permissive so the Master can always recover?
8. Anything you find while verifying that is not in the register: list it and ask whether it joins this plan.

PROCESS
- Read the real code and tests first. Do not trust the register's wording: it was written from reviewer reports.
- Separate confirmed facts from inference and label inference as inference. Never present a guess as evidence.
- Write the plan to docs/superpowers/plans/ using the writing-plans skill: header, Global Constraints, Decisions (mine versus your calls), Review Focus with a test per line, tasks grouped by area (atomicity and the DB, game rules, input validation, robustness, tests, docs), each task with exact interfaces and test names, test first.
- Review Focus must cover at least: two processes writing at once, a crash in the middle of a multi-row write, a tamper reset in the middle of a quest or a fight, a quest added after the ending was unlocked, a hostile or odd name (NBSP, zero-width, very long, a slot name), a bad option under a tamper, and the file path the player is told to edit.
- Update docs/process/deferred-findings.md statuses as part of the plan's last task, so the register stays the source of truth.
- End with the execution handoff question (subagent-driven or native) and your recommendation.
```

## Extra plan: Play harness follow-up (PR #14)

A contributor's pull request (#14, branch `feature/harness-token-savings`) moves `/play` into a skill, adds a `resume` command, a play hook, a `move-smith` subagent, and `play.sh`. My review found problems and I made decisions. This plan applies them. Paste this into plan mode.

```
Read the review decisions below, then the PR itself: `gh pr view 14` and `gh pr diff 14` (read-only, the PR may or may not be merged yet). Then read CLAUDE.md, docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md, docs/superpowers/plans/2026-11-09-hero-status-bar.md, and docs/process/deferred-findings.md. Run `node dev/cli.js status` and read the current state first.

GOAL
Take the contributor's token-saving harness and make it safe and complete on top of the current game (languages, vitals, the sealed dice, the front door CLI). Cheaper turns are the point, but not at the price of breaking the tamper rules, the language, or the state the Master relies on. I told you to be extremely careful: I do not know this part of the harness well and I am trusting your judgment. A wrong move here can silently break every play session, so prefer small steps, prove each one with a test that failed first, and stop and ask when something is unclear.

WHAT THE PR DOES (verify this against the diff, do not trust this summary)
- `.claude/skills/play/` replaces `.claude/commands/play.md`: a core `SKILL.md` plus `onboarding.md`, `combat.md`, `stamina.md`, `ending.md`, `vitals.md` that the Master reads when the moment comes. `SKILL.md` runs the command `node game/cli.js resume` before the model sees the prompt and inlines its JSON.
- `game/resume.js` (`resumeState`, `stateLine`), a `resume` case in `game/cli-main.js`, and an exit-0 path for `resume` in `game/cli.js` (the front door).
- `game/play-hook.js` wired in `.claude/settings.json` for `UserPromptSubmit` and `SessionStart` with matcher `compact`. A `play_sessions` table (migration 14) marks which Claude Code sessions typed `/play`. Those sessions get a one-line `[game]` state line per prompt, and the full state after a compaction.
- `.claude/agents/move-smith.md` (Sonnet, Bash only, `omitClaudeMd: true`) writes the hidden tests for advanced combat moves.
- `play.sh` starts `claude --model sonnet` with `/play` as the first prompt.

DECISIONS I ALREADY MADE (do not re-ask these)
1. World writing gets its own subagent on Opus. The play session stays on Sonnet (set by `play.sh`), and a new `world-smith` agent (`.claude/agents/world-smith.md`, `model: opus`, `tools: Bash`, `omitClaudeMd: true`) writes the whole world: names and descriptions for all six locations, and names, descriptions, and voices for all seven NPCs including the final boss, in the setting's voice and the save's language, and submits it with `node game/cli.js world fill --data -` on stdin. The Master still runs the player conversation (race, class, scores, name, the setting choice) and hands world-smith the chosen setting (name, description, voice), the hero, and the language. World text is not secret, so unlike move-smith it may report what it wrote. The quality bar is the whole point of using Opus here: no slop, no AI-speak, real specificity per setting. It must follow the language pack (glossary, banned phrases, voice tips) returned by `lang show`.
2. The auto-approval rule `Bash(node game/cli.js *)` does NOT go in the committed `.claude/settings.json`. Remove it from there. `play.sh` passes it on the command line as `--allowedTools "Bash(node game/cli.js *)"`, so only sessions started through `play.sh` get it. The skill's own `allowed-tools` frontmatter (a grant for the invoking turn only) stays. Documented behavior, from the Claude Code docs: `--allowedTools` is a per-invocation flag, a skill's `allowed-tools` clears when the player sends the next message, and a skill's `model` override lasts only for the current turn.
3. Fix the hook crash risk. `game/play-hook.js` imports `resume.js`, which imports `combat-engine.js`, which pulls in the sealed `game/dice.js` and `game/rolls.js`. A static import failure happens before the hook's try/catch. Move the read-only fight reads (`openFight`, `getFightState`, and what they need) into a new `game/fight-state.js` that imports no sealed code, and have `combat-engine.js` and `resume.js` use it. Behavior of combat must not change at all. Pin it with a test like the existing status line tamper test: delete or break both sealed files, run the hook, and expect exit 0 and no stack trace. Note from the docs: a hook that exits 1 is a non-blocking error, only exit 2 blocks a prompt, so this is Minor in effect but cheap and worth doing.
4. One source of truth for the game state. Move everything `cli-main.js` adds to the `resume` output (`language`, the language `pack` from `packFor`, `vitals` with the item count, `raceDisplay` and `classDisplay`) into `resumeState` in `game/resume.js`, so the `resume` command, the compaction dump, and the per-prompt line all share it. Add health and gold to the `[game]` line (for example `HP 9/12 | 15 gold`). Keep the line short: it is paid on every prompt.
5. Chain log calls with `;` instead of `&&` in the skill text, and tell the Master to read both lines of output. A failed log call must not swallow the real action, and each part still matches the allow rule on its own.
6. Drop the contributor's ending-test commit if it is still there: `pause` already exists in `tests/game/ending.test.js`, and the test did not flake on main in 8 of 8 runs. Verify, then remove it only if it is redundant.
7. `omitClaudeMd` is a real documented subagent field (Claude Code v2.1.271 or later; unknown fields are ignored without an error). The README requirements must state the minimum Claude Code version that the features used need. Find out what each used feature needs from the docs instead of guessing, and say which ones are unverified.

STEP 0: VERIFY BEFORE PLANNING
For each claim above, read the current code and run a probe on a throwaway save (`JSDND_GAME_DB`, `JSDND_PLAYER_DIR` pointing at temp paths): the hook with a missing `game/dice.js`, the compaction output today versus `resume`, the `[game]` line today. Label every result: verified by running, inference only, or already fixed. If the PR is not merged yet you cannot run its code in this repo: say so, and plan against the diff, and ask me how I want to sequence it (see below).

CONSTRAINTS
- Commit and push yourself with plain messages. NEVER a `Co-Authored-By` line, a "Generated with Claude" line, or any Claude attribution in commits or PR text. Never force-push or rewrite pushed history without asking. Ask before other outward-facing actions, including any comment, review, or push on the contributor's PR or branch.
- No em-dash and no en-dash anywhere: code, comments, docs, commit text, output.
- `game/dice.js` and `game/rolls.js` are sealed in `game/dice.sha256`. Never edit or format them. A missing or broken one must still reach the front door tamper path (exit 2, reset) and must never crash `game/reset.js`, `game/statusline.js`, or the new hook.
- Game state only in SQLite through scripts. Migrations are append-only: the PR's `play_sessions` is migration 14 and nothing already applied may change.
- Player-facing and Master-facing text: English text for the Master brief stays English. Anything the player reads goes through `game/locales/{en,uk}.js` or `quests/text`. The ESLint guard `playerFacing` list in `eslint.config.js` must stay green and cover any new module that prints player text. New Ukrainian text goes on `docs/i18n/uk-review-checklist.md`.
- Tests first for every change: write the test, watch it fail for the right reason, then fix, then run the whole suite, `npm run lint`, `npm run format:check`, and the dash scan. Name the production change that would make each test fail before writing it, and mutation-check the important ones.
- Machine-readable surfaces stay stable: CLI command names, JSON keys of existing commands, DB columns, honor kinds, quest ids. `resume` is new, so its shape is yours to define, but write it down.
- `.claude/skills/play/*.md` and `.claude/agents/*.md` are what the Master reads. They must say exactly what the scripts do. The existing tests in `tests/game/play-command.test.js` pin the brief; extend them instead of loosening them.
- Keep each change as small as its reason. No refactors for taste.

ASK ME BEFORE ASSUMING: USE AskUserQuestion, ONE DECISION AT A TIME OR SMALL RELATED GROUPS, WITH YOUR RECOMMENDATION FIRST. DO NOT WRITE THE PLAN UNTIL THESE ARE ANSWERED:
1. Sequencing. The PR is the contributor's branch. Options: I merge it first and you plan a follow-up on main; you plan changes the contributor applies on his branch (I post your review comment); or you apply the changes on main after merging. Recommend one and say what each costs, including who gets to commit what.
2. world-smith failure path. If Opus is not available on a player's plan or the call fails, what should happen? Options: the Master writes the world itself on the session model, the Master tells the player and stops, or world-smith falls back to Sonnet. Recommend one.
3. world-smith inputs and output. What exactly does the Master hand over, what does the agent run first (`world skeleton`, `lang show`), what does it report back (names only, or a short summary), and how does the Master then describe the arrival? Show me a draft of the agent file text before the plan is final, because its prompt decides the quality of every world.
4. `resume` size. The state is paid once per `/play` and again after a compaction. Which fields must be in the compaction dump and which can be fetched when needed? Show the byte size of each field on a realistic save.
5. The `[game]` line fields. Which exact fields, in which order, in which language? It is injected on every player prompt, so every token counts.
6. Minimum versions. After you check the docs, which Claude Code version do the skill, the hook, `--allowedTools`, and `omitClaudeMd` each need, and what happens on an older version (silent degrade versus a broken `/play`)? Recommend what the README and `play.sh` should say or check.
7. Anything you find that is not in this prompt: list it and ask whether it joins the plan.

REVIEW FOCUS (each line gets a test or a probe)
- The hook with `game/dice.js` missing, and with `rolls.js` containing a syntax error: exit 0, no stack trace on stdout or stderr.
- The hook in a session that never ran `/play`, with no database, with a database from before migration 14, and with a busy database: silent, exit 0, fast.
- The compaction output carries the language pack, vitals, and display names, and is valid text for the Master, in both languages.
- `resume` on a fresh install, on a tampered install (`tamper: true`, exit 0 through the front door), with a broken database, and with a collapsed hero.
- `play.sh` with `claude` missing, with extra arguments, and with the allow flag present exactly once. The committed `.claude/settings.json` has no allow rule.
- world-smith: a rejected `world fill` (banned phrase, duplicate name, missing slot) is retried by the agent; the written world is in the save language; the final boss gets a voice that fits a last enemy; it never writes to anything but the game through `node game/cli.js`.
- `;` chaining: a failing log call followed by a successful action.
- A returning player resuming a half-onboarded save (hero but no world, world setting but no fill).

PROCESS
- Read the real code and tests first. Separate confirmed facts from inference and label inference as inference. Never present a guess as evidence.
- Write the plan to docs/superpowers/plans/ using the writing-plans skill: header, Global Constraints, Decisions (mine versus your calls), Review Focus with a test per line, tasks (fight-state split, resume enrichment, hook, play.sh and settings, skill text, world-smith, docs and README, final review), each with exact interfaces and test names, test first.
- Add a short "Live checks for Gogi" list at the end: the things only a real `claude` session can prove (the `/play` start with `resume` inlined, the `[game]` line on a prompt, a compaction in a long session, `play.sh` on Sonnet, the world-smith run on Opus, the allow flag skipping approvals).
- Update docs/process/deferred-findings.md with anything deferred.
- End with the execution handoff question (subagent-driven or native) and your recommendation.
```
