// Collects what fn gives back and returns it, instead of returning nothing.
export function times(n, fn) {
  const results = [];
  for (let i = 0; i < n; i++) {
    results.push(fn(i));
  }
  return results;
}
