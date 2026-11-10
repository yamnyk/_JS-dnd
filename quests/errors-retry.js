import {
  missingExport,
  wrongResult,
  wrongCallCount,
  wrongArgCount,
  wrongThrow,
  wrongThrown,
  passed,
  show,
} from './messages.js';

// Every error the check makes gets a number, so a failure message can tell the very same error from a copy.
const ids = new WeakMap();
let made = 0;

class CustomError extends Error {}

// What the function throws on its call number `call`. The kind changes from call to call, so a solution that
// keeps the wrong one (the first, or a new error) shows. A text is thrown too, as a beginner might.
const KINDS = [
  (text) => new Error(text),
  (text) => new TypeError(text),
  (text) => new RangeError(text),
  (text) => new CustomError(text),
  (text) => text,
];

function makeThrown(call, offset) {
  const text = `fail ${call}`;
  const thrown = KINDS[(call + offset) % KINDS.length](text);
  if (thrown instanceof Error) {
    made += 1;
    ids.set(thrown, made);
  }
  return thrown;
}

// A thrown value as a name and message, never as a sentence. A number after # marks an error the check made.
function describe(thrown) {
  if (!(thrown instanceof Error)) return typeof thrown === 'string' ? JSON.stringify(thrown) : typeof thrown;
  return `${thrown.name}(${JSON.stringify(String(thrown.message))})${ids.has(thrown) ? `#${ids.get(thrown)}` : ''}`;
}

function attempt(run) {
  try {
    return { value: run() };
  } catch (error) {
    return { threw: true, error };
  }
}

// The function the check hands over: it throws on its first `failures` calls and then returns `value`. It
// counts its calls and the arguments it got. Past `attempts` calls it returns at once, so a solution that
// keeps calling cannot loop for ever, and the call count shows the mistake.
function makeSpy(failures, value, attempts, offset) {
  const spy = { calls: 0, argCounts: [], thrown: [] };
  spy.fn = (...received) => {
    spy.calls += 1;
    spy.argCounts.push(received.length);
    if (spy.calls > attempts) return value;
    if (spy.calls <= failures) {
      const thrown = makeThrown(spy.calls, offset);
      spy.thrown.push(thrown);
      throw thrown;
    }
    return value;
  };
  return spy;
}

const OBJECT_VALUE = { a: 1 };
const LIST_VALUE = [1, 2];

// [failures before the first success (Infinity: never), value it returns then, attempts, offset of the kinds].
// Covers: the example, a success on the first call, on a middle call, and on the very last allowed call,
// never a success (the last error comes out, not the first and not a new one), one attempt only, falsy
// results (0, an empty text, false, null, undefined) at the first, a middle and the last call, results that
// are objects (returned as they are), and a large number of attempts.
const FIXED = [
  [2, 7, 3, 0],
  [0, 7, 3, 0],
  [1, 7, 3, 1],
  [2, 7, 3, 2],
  [2, 7, 2, 0],
  [Infinity, undefined, 3, 0],
  [Infinity, undefined, 3, 1],
  [Infinity, undefined, 3, 2],
  [Infinity, undefined, 4, 3],
  [Infinity, undefined, 2, 4],
  [3, 'ok', 3, 0],
  [0, 'ok', 1, 0],
  [1, 'ok', 1, 0],
  [Infinity, undefined, 1, 3],
  [Infinity, undefined, 1, 4],
  [4, 'last', 5, 0],
  [4, 'last', 5, 1],
  [5, 'late', 5, 2],
  [0, 0, 3, 0],
  [2, 0, 3, 1],
  [3, 0, 4, 0],
  [0, '', 3, 0],
  [1, '', 3, 0],
  [2, '', 3, 2],
  [0, false, 4, 0],
  [3, false, 4, 1],
  [0, null, 2, 0],
  [1, null, 2, 3],
  [0, undefined, 3, 0],
  [1, undefined, 3, 0],
  [2, undefined, 3, 4],
  [1, OBJECT_VALUE, 3, 0],
  [1, LIST_VALUE, 4, 0],
  [99, 'done', 100, 0],
  [Infinity, undefined, 100, 1],
  [Infinity, undefined, 30, 2],
];

const pick = (n) => Math.floor(Math.random() * n);
const VALUES = [7, 0, '', false, null, undefined, 'ok', -1, OBJECT_VALUE, LIST_VALUE];

function randomCase() {
  const attempts = 1 + pick(6);
  const failures = pick(5) === 0 ? Infinity : pick(attempts + 3);
  return [failures, VALUES[pick(VALUES.length)], attempts, pick(KINDS.length)];
}

// The title, brief, and starter file for this quest are in quests/text.
export default {
  id: 'errors-retry',
  rung: 4,
  subject: 'errors',
  tier: 'hard',
  complexity: 4,

  async check(mod) {
    if (typeof mod.retry !== 'function') return missingExport('retry', typeof mod.retry);
    const cases = [...FIXED];
    for (let i = 0; i < 20; i++) cases.push(randomCase());
    for (const [failures, value, attempts, offset] of cases) {
      const fnText = value === undefined ? `failTimes(${failures})` : `failTimes(${failures}, ${show(value)})`;
      const call = `retry(${fnText}, ${attempts})`;
      const succeeds = failures < attempts;
      const wantedCalls = succeeds ? failures + 1 : attempts;
      const spy = makeSpy(failures, value, attempts, offset);
      const result = attempt(() => mod.retry(spy.fn, attempts));
      if (spy.calls !== wantedCalls) return wrongCallCount(call, wantedCalls, spy.calls);
      const withArguments = spy.argCounts.find((count) => count !== 0);
      if (withArguments !== undefined) return wrongArgCount(call, withArguments);
      if (succeeds) {
        if (result.threw) return wrongThrown(call, show(value), describe(result.error));
        if (!Object.is(result.value, value)) return wrongResult(call, show(value), show(result.value));
      } else {
        const lastError = spy.thrown[spy.thrown.length - 1];
        if (!result.threw) return wrongThrow(call, describe(lastError), undefined);
        if (result.error !== lastError) return wrongThrow(call, describe(lastError), describe(result.error));
      }
    }
    return passed('check.pass.everyTest');
  },
};
