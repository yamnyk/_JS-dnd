// How a quest check says what went wrong or right, without words. A check returns these parts and the
// game renders them in the language of the save (keys are in game/locales). Values like the call
// text are already plain strings, so code stays exactly as written.
export const part = (key, params = {}) => ({ key, params });

// What the player's code returned, as text. The parts travel as JSON, which drops undefined and turns NaN
// into null, so the value is turned into text here, the way a template string would show it.
const shown = (value) => {
  try {
    return String(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
};

// A value as the player's code would write it. JSON.stringify turns undefined and NaN into null and drops
// undefined keys, which would tell a beginner "gave null" when the real value was undefined.
export function show(value, seen = new Set()) {
  if (value === undefined) return 'undefined';
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function') return 'function';
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || typeof value !== 'object') return String(value);
  if (seen.has(value)) return '...';
  const inside = new Set(seen).add(value);
  if (value instanceof Map) {
    const pairs = [...value].map(([k, v]) => `${show(k, inside)} => ${show(v, inside)}`);
    return `Map {${pairs.join(', ')}}`;
  }
  if (value instanceof Set) return `Set {${[...value].map((v) => show(v, inside)).join(', ')}}`;
  if (Array.isArray(value)) return `[${value.map((item) => show(item, inside)).join(',')}]`;
  return `{${Object.entries(value)
    .map(([key, item]) => `${JSON.stringify(key)}:${show(item, inside)}`)
    .join(',')}}`;
}

export const missingExport = (name, type) => ({
  pass: false,
  expected: part('check.missingExport.expected', { name }),
  got: part('check.missingExport.got', { name, type }),
});

export const wrongResult = (call, wanted, gave) => {
  const params = { call, wanted: shown(wanted), gave: shown(gave) };
  return {
    pass: false,
    expected: part('check.wrongResult.expected', params),
    got: part('check.wrongResult.got', params),
  };
};

// How often a function was called by the player's code, and with how many arguments.
export const wrongCallCount = (call, wanted, gave) => ({
  pass: false,
  expected: part('check.callCount.expected', { call, wanted: show(wanted) }),
  got: part('check.callCount.got', { call, gave: show(gave) }),
});

export const wrongArgCount = (call, gave) => ({
  pass: false,
  expected: part('check.argCount.expected', { call }),
  got: part('check.argCount.got', { call, gave: show(gave) }),
});

// A call that should throw: wanted is the error type (a name), gave is the name of what was thrown, or
// undefined when nothing was thrown.
export const wrongThrow = (call, wanted, gave) => ({
  pass: false,
  expected: part('check.throws.expected', { call, wanted }),
  got: gave === undefined ? part('check.noThrow.got', { call }) : part('check.throws.got', { call, gave }),
});

// A call that should give a value but threw.
export const wrongThrown = (call, wanted, gave) => ({
  pass: false,
  expected: part('check.wrongResult.expected', { call, wanted }),
  got: part('check.throws.got', { call, gave }),
});

export const outOfRange = (call, max, gave) => ({
  pass: false,
  expected: part('check.outOfRange.expected', { call, max: shown(max) }),
  got: part('check.outOfRange.got', { call, gave: shown(gave) }),
});

export const allFacesMissing = (faces) => ({
  pass: false,
  expected: part('check.allFaces.expected'),
  got: part('check.allFaces.got', { faces }),
});

export const passed = (key) => ({ pass: true, expected: part(key), got: part(key) });
