export function requirePositiveInt(value) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Expected a whole number, got ${String(value)}`);
  }
  if (value < 1) {
    throw new RangeError(`Expected 1 or more, got ${value}`);
  }
  return value;
}
