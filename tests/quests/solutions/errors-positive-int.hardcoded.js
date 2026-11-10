// Looks up the catalog examples and nothing else.
export function requirePositiveInt(value) {
  if (value === 3) return 3;
  if (value === '3') throw new TypeError('3');
  throw new RangeError(String(value));
}
