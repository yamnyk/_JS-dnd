export function applyN(fn, value, times = 1) {
  let result = value;
  for (let i = 0; i < times; i++) {
    result = fn(result);
  }
  return result;
}
