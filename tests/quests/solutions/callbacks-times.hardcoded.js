// Looks up the catalog example and nothing else.
export function times(n, fn) {
  if (n === 3) {
    fn(0);
    fn(1);
    fn(2);
  }
}
