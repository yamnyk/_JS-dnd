CONTEXT: why the Master refuses today (verified by reading the code on 2026-11-09, no guesses)

Players ask for things the generated world does not list: a forest, a blacksmith, a side job. The Master refuses.

1. `go` is a wall. `game/world.js` `go()` accepts only the exits of the 6 fixed places. Any other target throws "X is not an exit from Y. Exits: ...", and the Master reads that error as a refusal.
2. The brief says the scripts are the whole world. The ground rule in `.claude/skills/play/SKILL.md` is "never keep game state in files and never rely on your memory for it, everything is stored and read through scripts". Nothing says the Master may improvise beyond what the scripts list, so it follows the rule literally.
3. No script path exists for anything unlisted. `talk` works only for the 7 NPCs at the hero's place. A fight needs an NPC slot at the hero's place (`fight begin --npc`). Quests come only from the fixed registry. Gold and items come only from solves and won fights. So an invented forest, stranger, or task has nowhere to live.
4. The fixed skeleton is intentional. Spec section 5.2 fixes the number of places, people, and quests so the learning path is the same for everyone. The intent is: the skeleton is the spine, not a cage. Only the setting and its flavor were meant to vary, and the player must never be stopped from exploring.

Read docs/superpowers/specs/2026-11-07-js-dnd-campaign-design.md (sections 4, 5.2, 5.5, 5.8), CLAUDE.md, and the skill files in .claude/skills/play/. Then read the real code before you trust this prompt: game/world.js (go, look, talk, requireReady, the exits and slot handling), world/skeleton.js, game/combat-engine.js (beginFight and what it needs from an npc slot), game/fight-state.js, game/knockouts.js, game/honor-rules.js, game/moves.js and game/move-runner.js and .claude/agents/move-smith.md (the existing way a Master-written JS problem is validated by a script), game/vitals.js and game/inventory.js (where gold and items come from), game/hero-line.js, game/statusline.js, game/resume.js and game/play-hook.js (what the Master sees each prompt), game/schema.js (migrations are append-only), and tests/game/navigation.test.js. Run `node dev/cli.js status` first.

GOAL
The Master must never refuse a reasonable request because the world "does not have it". If the player wants to go to a forest, find a blacksmith, or take a side job, the Master invents it on the spot, and it stays real: the same forest, the same blacksmith, the same side job in the next session and after a compaction. The 6 places, 7 people, and the quest ladder stay the spine that the learning path and the ending run on.

DECISIONS ALREADY MADE BY GOGI (do not re-ask these)
- The skeleton stays: 6 places, 7 people, the ladder, the ending gate. It is the spine, not a cage.
- The Master may invent places, people, and tasks on the go, as many as it likes. "Places, tasks, NPCs" are all in scope.
- Invented things must persist in SQLite through scripts (the project rule is that game state lives only in the database), so continuity survives sessions and compactions. The scope is the brief rule PLUS saved detours, and more: invented people and tasks too.
- What invented content may do is the Master's call. Gogi was warned that rewards (gold, items, honor) then depend on the Master and chose it anyway. Do NOT re-ask whether to limit it. You must still tell him, in the plan, exactly which systems depend on those numbers (list them), and propose the smallest set of script-owned facts that keep everything else trustworthy (see the questions below, which ask him to confirm that list, not to reopen the decision).

CONSTRAINTS
- Commit and push yourself with plain messages. NEVER a `Co-Authored-By` line, a "Generated with Claude" line, or any Claude attribution. Never force-push or rewrite pushed history without asking. Ask before other outward-facing actions.
- No em-dash and no en-dash anywhere: code, comments, docs, commit text, output.
- `game/dice.js` and `game/rolls.js` are sealed in `game/dice.sha256`: never edit or format them. Tamper must stay exit 2 through the front door. The hook, `resume`, and the status line must never import the sealed files (the tests in tests/game/play-hook-tamper.test.js pin it).
- Game state only in SQLite through scripts. Migrations are append-only (the next is 16). Machine-readable surfaces stay stable unless Gogi approves a change: existing CLI command names, JSON keys, DB columns, honor kinds, quest ids.
- Player-facing text goes through the language catalogs; invented text is stored in the save's language and checked against its banned phrases (`voice lint`). New Ukrainian text goes on docs/i18n/uk-review-checklist.md. The ESLint player-facing guard stays green.
- Tests first for every change, mutation-check the important ones; the whole suite, `npm run lint`, `npm run format:check`, and the dash scan after every task.
- The curriculum plan (docs/superpowers/plans, the ladder of 53 quests) and the update check are in progress: your change must not break the ladder gate, the boss and ending guard, or the quest handout.

ASK ME BEFORE ASSUMING: USE AskUserQuestion, ONE DECISION AT A TIME OR SMALL RELATED GROUPS, WITH YOUR RECOMMENDATION FIRST. DO NOT WRITE THE PLAN UNTIL THESE ARE ANSWERED:
1. The data model. Options: one `detours` table for improvised places plus a table for improvised people and one for side tasks; or one generic `improvised` table with a kind column; or permanent extra map places that join the graph. Say how each handles: coming back to a place, a place inside a place (the forest has a cave), who stands where, the hero's location in the status bar and the `[game]` line, and `look`. Recommend one.
2. Moving. How does the hero leave the map for an improvised place and come back? Does `go` learn a new form, or is there a separate command? Can the hero talk to a skeleton NPC while standing in a detour (N1 is in L1, the hero is in a forest near L1)? Define "near" and "back", and what quest gating, `rest` (start place only), and fights do in a detour.
3. Improvised tasks. A task needs a verdict. Options: (a) a JS side quest validated by a script, through the same path advanced moves use today (the Master hands the writing to a subagent, a script runs the reference solution against the hidden tests and rejects a problem whose own reference fails); (b) a task with no JS, pure story, no verdict needed; (c) both. For (a): where do the problem, the player's file, and the result live, how is cheating judged and honor applied, and does a side quest count anywhere (it must not count toward the ladder or the ending unless Gogi says so)?
4. Rewards. Gold and items today come only from clean solves and won fights, honor only through the honor rules table. Since the Master decides, what are the script commands it uses to grant a reward (gold, an item, an honor event) and what is the smallest guard that keeps the numbers meaningful? Show me what breaks without any guard: gold floor and the cost of `rest`, the honor clamp at 100 and the roast threshold at 0, item counts in the bar, the ending page statistics. Recommend a minimal guard and let me confirm it.
5. Fights. Can the hero fight an improvised person? The fight engine keys on an NPC slot (warnings, knockouts, honor by aggressor). Options: a generic fight command with a made-up enemy name and a tier, no knockout state and no warnings; or extend slots. Recommend one, and say what happens to honor (a kill in self defense costs nothing today).
6. What the Master sees. The status bar, the `[game]` line, `resume`, and the compaction dump must show where the hero is when it is a detour, without growing by much (they are paid on every prompt). Propose the exact fields and the byte cost.
7. The Master brief. Draft the exact new rules: what is free, what the scripts still own, what to do when a request is unreasonable (the player asks for a spaceship in a medieval world), and the rule that the Master must save an invention the moment it introduces it, before the story goes on. Show me the text before the plan is final.
8. Tamper, revoke, and reset. What happens to detours and invented content when the dice are tampered with (the hero starts over), or a solve is revoked? Is invented content part of the "epoch"?
9. Abuse and hostile input. Names that collide with slots (L3, N7), very long names, NBSP and zero-width characters, banned phrases, a thousand detours in one save. Which limits do you need purely for safety (not for game balance)?
10. The ending page and stats: should invented places and side tasks appear (time played, places visited)? Optional.
11. Sequencing against the curriculum rungs and the update check. Say which tasks can land independently.
12. Anything you find while verifying that is not in this prompt: list it and ask whether it joins the plan.

REVIEW FOCUS (each line gets a test or a probe)
- A reasonable request for an unlisted place, person, or task is never refused by a script error; a script error about the skeleton is never the final answer to the player.
- Persistence: an invented place and its people survive a new process, a new session, a compaction, and a language switch (text stays as written, new text follows the new language).
- The ladder, the quest gate, the boss guard, and the ending are untouched: an invented task cannot open a rung, solve a ladder quest, or unlock the ending.
- Moving between the map and a detour from every starting place, including during a fight, while collapsed from tiredness, mid-quest, and right after a tamper reset.
- `talk`, `rest`, and `quest` commands while in a detour do what the plan says, with clear errors the Master can relay.
- Rewards: every grant goes through a script, is logged with a reason, is visible in the honor and inventory history, and cannot make gold or honor leave their ranges.
- Hostile and odd names (slot lookalikes, NBSP, zero width, very long, banned phrases, duplicates).
- The status bar, the `[game]` line, `resume`, and the compaction dump with and without a detour; their size.
- The Master brief: a test that pins the new rules and that the old "scripts are the whole world" wording is gone.

PROCESS
- Read the real code and tests first. Separate confirmed facts from inference and label inference as inference. Never present a guess as evidence.
- Write the plan to docs/superpowers/plans/ using the writing-plans skill: header, Global Constraints, Decisions (Gogi's versus your calls), Review Focus with a test per line, tasks (schema, scripts, brief, hero line and resume, tests, docs), each with exact interfaces and test names, test first.
- Update docs/process/deferred-findings.md and the dev notes in the plan's last task.
- Add a short "Live checks for Gogi" list: ask the Master for a forest, a blacksmith, and a side job in a real session, leave and come back, switch language, and compact the session.
- End with the execution handoff question (subagent-driven or native) and your recommendation.
