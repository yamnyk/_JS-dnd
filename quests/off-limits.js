// The built-in array methods that would do the job in callbacks-my-map and callbacks-my-filter. While the
// player's function runs they throw, on the array it gets and on Array.prototype itself, so copying the array
// first (spread, slice, Array.from, call) does not get around the rule. Each hit is recorded in `used`.
export const OFF_LIMITS = [
  'map',
  'filter',
  'forEach',
  'reduce',
  'reduceRight',
  'flatMap',
  'some',
  'every',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
];

const trap = (name, used) => ({
  value() {
    used.push(name);
    throw new Error(`items.${name}`);
  },
  configurable: true,
  writable: true,
  enumerable: false,
});

export function guardedCopy(input, used) {
  const copy = [...input];
  for (const name of OFF_LIMITS) Object.defineProperty(copy, name, trap(name, used));
  return copy;
}

// Runs call() with the traps on Array.prototype and puts every original back afterwards, whatever happens.
export function withTraps(used, call) {
  const originals = OFF_LIMITS.map((name) => [name, Object.getOwnPropertyDescriptor(Array.prototype, name)]);
  for (const name of OFF_LIMITS) Object.defineProperty(Array.prototype, name, trap(name, used));
  try {
    return call();
  } finally {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(Array.prototype, name, descriptor);
      else delete Array.prototype[name];
    }
  }
}
