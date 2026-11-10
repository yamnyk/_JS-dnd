export function makeCounter(start = 0) {
  let count = start;
  return () => {
    const current = count;
    count += 1;
    return current;
  };
}
