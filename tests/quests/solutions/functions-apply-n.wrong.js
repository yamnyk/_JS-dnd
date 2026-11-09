// Forgets the default, so a missing times does nothing.
export function applyN(fn, value, times) {
  let result = value;
  for (let i = 0; i < times; i++) {
    result = fn(result);
  }
  return result;
}
