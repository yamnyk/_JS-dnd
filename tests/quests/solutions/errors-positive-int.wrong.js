// Checks only the type, so a fraction slips through as if it were a whole number.
export function requirePositiveInt(value) {
  if (typeof value !== 'number') {
    throw new TypeError(`Expected a number, got ${value}`);
  }
  if (value < 1) {
    throw new RangeError(`Expected 1 or more, got ${value}`);
  }
  return value;
}
