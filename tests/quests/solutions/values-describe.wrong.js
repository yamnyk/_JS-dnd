// Forgets that typeof null and typeof [] are both 'object'.
export function describeValue(value) {
  return typeof value;
}
