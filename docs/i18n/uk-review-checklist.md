# Ukrainian review checklist

Every Ukrainian string in the game is a draft until a native speaker has read it. Tick a box when you have read the area and fixed what sounds wrong. New or changed Ukrainian text goes on this list in the same commit.

Rules to hold the text to:

- Cyrillic only. Latin letters appear only inside backticks, `{placeholders}`, and the bracketed English term after a JS term.
- The Ukrainian apostrophe is written as the modifier letter (`ʼ`), as in `обʼєкт`.
- No em-dash or en-dash.
- Code, file names, and commands stay English.

## `game/locales/uk.js`

- [ ] `language.` : the language switch confirmation.
- [ ] `check.` : what a quest check tells the player (timeouts, missing file, wrong result, passed, how often a function was called, threw or did not throw). `{call}` and `{path}` stay as they are.
- [ ] `style.` : the code style problems, one line per ESLint rule.
- [ ] `update.` : the message that asks the player to run `git pull` before a session, with its plural forms for the number of new commits.
- [ ] `move.` : the starter file comments of a combat move.
- [ ] `hero.` : the hero line above the stamina bar (name, level, health, gold, items with plural forms, place).
- [ ] `stamina.` : the stamina bar, the estimate marker, the collapse line with its plural forms for hours (one, few, many, other).
- [ ] `ending.` : every heading and label on the ending page, including the date and duration wording.
- [ ] `pack.glossary` : the Ukrainian JS term for each English one. The Master writes the Ukrainian term, then the English one in brackets, at its first use in a quest.
- [ ] `pack.roast` : the rule, what is fair game, what is never allowed, and the tone. Same rule as English: savage about the code, never about the person.
- [ ] `pack.voiceTips` : how the Master should sound.
- [ ] `pack.bannedPhrases` : chatbot phrases and calques from English helper-speak that the world text may not contain.
- [ ] `names.races` : Ukrainian display names and aliases for the nine races. There is no official Ukrainian 5e release, so these follow common usage.
- [ ] `names.classes` : the same for the classes.

## `quests/text/uk.js`

- [ ] `general` : the general code style directions every quest shows.
- [ ] `dice-roll` : title, brief, starter file comments, specific style directions.
- [ ] `string-shout` : title, brief, starter file comments, specific style directions.
- [ ] `array-sum` : title, brief, starter file comments, specific style directions.
- [ ] `values-fahrenheit` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `values-describe` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `values-to-number` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `strings-count-label` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `strings-middle` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `arrays-first-last` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `arrays-rotate` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `objects-full-name` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `objects-count-words` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `objects-merge-deep` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `logic-fizzbuzz` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `logic-leap-year` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `logic-shipping-fee` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `loops-countdown` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `loops-primes` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `loops-collatz` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `functions-clamp` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `functions-apply-n` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `functions-compose` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `callbacks-times` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `callbacks-my-map` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `callbacks-my-filter` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `methods-names` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `methods-adult-names` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `methods-totals-by-category` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `smethods-title-case` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `smethods-slugify` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `smethods-parse-query` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `closures-counter` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `closures-once` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `closures-memoize` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `errors-safe-parse` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `errors-positive-int` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `errors-retry` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `timeouts-call-later` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `timeouts-cancellable` : title, brief, starter file comments, expected examples, specific style directions.
- [ ] `timeouts-debounce` : title, brief, starter file comments, expected examples, specific style directions.
- Rung 1 terms to double check: "шаблонний рядок (template literal)" is not in the glossary, and "Глибоке злиття", "Зсув ліворуч", "Кількість з підписом", "сурогатні пари", "звичайні обʼєкти" were chosen by the drafter. The three older quests do not write the English term in brackets at first use, the new ones do: pick one convention.

Each new quest adds a row here. The code in a starter file is identical to the English one, only the comments are Ukrainian.

## Other files

- [ ] `setup.sh` : every `uk:` line in the message table.
- [ ] `README.uk.md` : the Ukrainian landing page.

## What the lint guard does not catch

`eslint.config.js` lists the player-facing modules and rejects multiword English prose in a string or template there. It catches prose, not a single word, so a lone English word in a listed module still slips through. CLI error text (what a script prints to the Master when a command fails) is out of scope by decision: the Master reads it and tells the player in the save language. `game/world.js` and `game/ending.js` carry that kind of text and are not on the list.
