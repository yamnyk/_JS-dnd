export function collatzSteps(n) {
  if (n < 1) return -1;
  let value = n;
  let steps = 0;
  while (value !== 1) {
    value = value % 2 === 0 ? value / 2 : value * 3 + 1;
    steps++;
  }
  return steps;
}
