// Keeps the count in a variable outside, so every counter shares it.
let count = 0;
export function makeCounter(start = 0) {
  count = start;
  return () => count++;
}
