// Joins the arguments with nothing between them, so (1, 23) and (12, 3) share a key.
export function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = args.join('');
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  };
}
