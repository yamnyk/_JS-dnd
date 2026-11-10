export function times(n, fn) {
  for (let i = 0; i < n; i++) {
    fn(i);
  }
}
